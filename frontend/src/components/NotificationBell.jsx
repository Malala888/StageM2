import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

const REFRESH_MS = 60000; // actualisation automatique toutes les 60 s

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

// Pages de chaque rôle (pour que un clic sur une alerte ouvre la bonne page)
const ROUTES = {
  ADMIN: { users: '/users', mouvements: '/mouvements', stock: '/stock' },
  CHEF_SECTION: { users: '/section/users', mouvements: '/section/mouvements', stock: '/section/stock' },
  CHEF_BRIGADE: { users: '/brigade/users', mouvements: '/brigade/mouvements', stock: '/brigade/stock' },
  GL: { mouvements: '/gl/mouvements' },
  CN: { mouvements: '/cn/mouvements' },
};
// Qui valide qui (supérieur direct)
const VALIDE = { ADMIN: ['CHEF_SECTION'], CHEF_SECTION: ['CHEF_BRIGADE'], CHEF_BRIGADE: ['GL', 'CN'] };
const ROLE_LABEL = { CHEF_SECTION: 'Chef de Section', CHEF_BRIGADE: 'Chef de Brigade', GL: 'GL', CN: 'CN' };

const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; }
};

// ─── « Déjà vu » : mémorisé par utilisateur dans le navigateur ───
// Une alerte est considérée comme vue tant que son contenu ne change pas.
// Si elle change (un retard de plus, un nouveau compte...), elle redevient « nouvelle ».
const seenKey = (uid) => `nb_seen_${uid || 'anon'}`;
const loadSeen = (uid) => {
  try { return JSON.parse(localStorage.getItem(seenKey(uid)) || '{}'); } catch (e) { return {}; }
};
const saveSeen = (uid, obj) => {
  try { localStorage.setItem(seenKey(uid), JSON.stringify(obj)); } catch (e) { /* ignoré */ }
};
const signature = (a) => `${a.title}|${a.lines.join('/')}`;

/**
 * Cloche de notifications flottante (en bas à droite), pour tous les rôles.
 * Calculée à partir des données existantes (aucune table en plus), et filtrée
 * automatiquement par le serveur selon le périmètre de l'utilisateur.
 *  - Chefs : comptes à valider, demandes à valider, retards, stocks bas / ruptures
 *  - GL / CN : état de leurs demandes (en attente, rejetées) et retours à faire
 */
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(false);
  const [seen, setSeen] = useState({});
  const [fresh, setFresh] = useState([]); // alertes « nouvelles » à l'ouverture (point bleu)
  const boxRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const visible = location.pathname !== '/' && location.pathname !== '/register' && !!localStorage.getItem('access_token');
  const me = getStoredUser();
  const role = me?.role;
  const uid = me?.id;

  useEffect(() => { setSeen(loadSeen(uid)); }, [uid, location.pathname]);

  const load = useCallback(async () => {
    const r = getStoredUser()?.role;
    if (!r || !localStorage.getItem('access_token')) { setAlerts([]); setLoading(false); return; }
    const R = ROUTES[r] || {};
    const isChef = r === 'ADMIN' || r === 'CHEF_SECTION' || r === 'CHEF_BRIGADE';
    try {
      const calls = [api.get('/materiaux/mouvements/')];
      if (isChef) calls.push(api.get('/accounts/users/'), api.get('/materiaux/materiels/'), api.get('/materiaux/stock/'));
      const res = await Promise.all(calls);
      const mvts = res[0].data;
      const list = [];

      if (isChef) {
        const [, usersR, matR, stockR] = res;

        // 1. Comptes à valider (supérieur direct uniquement)
        const attente = usersR.data.filter(u => u.statut === 'EN_ATTENTE' && (VALIDE[r] || []).includes(u.role));
        if (attente.length > 0) {
          list.push({
            id: 'comptes', level: 'warn', icon: '👤', to: R.users,
            title: `${attente.length} compte(s) en attente de validation`,
            lines: attente.slice(0, 3).map(u => `${u.nom} ${u.prenom} — ${ROLE_LABEL[u.role] || u.role}`),
            more: attente.length - 3,
          });
        }

        // 2. Demandes de matériel à valider (Chef de Brigade) / en attente (autres)
        const demandes = mvts.filter(m => m.statut === 'DEMANDE');
        if (demandes.length > 0) {
          list.push({
            id: 'demandes', level: r === 'CHEF_BRIGADE' ? 'danger' : 'info', icon: '📨', to: R.mouvements,
            title: r === 'CHEF_BRIGADE'
              ? `${demandes.length} demande(s) de matériel à valider`
              : `${demandes.length} demande(s) de matériel en attente (chez les chefs de brigade)`,
            lines: demandes.slice(0, 3).map(m => `${m.materiel_nom} × ${m.quantite} — ${m.agent_concerner_nom || m.createur_nom || '—'}`),
            more: demandes.length - 3,
          });
        }

        // 3. Retards
        const retards = mvts.filter(m => m.statut === 'EN_RETARD');
        if (retards.length > 0) {
          list.push({
            id: 'retards', level: 'danger', icon: '⏰', to: R.mouvements,
            title: `${retards.length} emprunt(s) en retard`,
            lines: retards.slice(0, 3).map(m =>
              `${m.materiel_nom} × ${m.quantite} — ${m.agent_concerner_nom || (m.brigade_nom ? 'Brigade ' + m.brigade_nom : '—')} (prévu le ${fmtDate(m.date_retour_prevue)})`),
            more: retards.length - 3,
          });
        }

        // 4. Ruptures et stocks bas
        //    Service : stock total. Section / Brigade : leurs propres brigades (hors dépôt central).
        const rows = r === 'ADMIN' ? stockR.data : stockR.data.filter(s => s.brigade != null);
        const rupture = [];
        const bas = [];
        matR.data.forEach(mat => {
          const items = rows.filter(s => s.materiel === mat.id);
          if (r !== 'ADMIN' && items.length === 0) return; // jamais reçu dans ce périmètre : pas d'alerte
          const total = items.reduce((a, s) => a + s.quantite, 0);
          const seuil = mat.seuil_alerte ?? 5;
          if (total === 0) rupture.push({ nom: mat.nom, total, seuil });
          else if (total <= seuil) bas.push({ nom: mat.nom, total, seuil });
        });
        if (rupture.length > 0) {
          list.push({
            id: 'rupture', level: 'danger', icon: '⛔', to: R.stock,
            title: `${rupture.length} matériel(s) en rupture`,
            lines: rupture.slice(0, 3).map(x => `${x.nom} — stock : 0 (seuil ${x.seuil})`),
            more: rupture.length - 3,
          });
        }
        if (bas.length > 0) {
          list.push({
            id: 'bas', level: 'warn', icon: '⚠️', to: R.stock,
            title: `${bas.length} matériel(s) en stock bas`,
            lines: bas.slice(0, 3).map(x => `${x.nom} — stock : ${x.total} (seuil ${x.seuil})`),
            more: bas.length - 3,
          });
        }
      } else {
        // GL / CN : leurs propres demandes et emprunts (le serveur ne renvoie que les leurs)
        const mine = mvts.filter(m => m.agent_concerner === me?.id || m.createur === me?.id);
        const attente = mine.filter(m => m.statut === 'DEMANDE');
        if (attente.length > 0) {
          list.push({
            id: 'attente', level: 'info', icon: '⏳', to: R.mouvements,
            title: `${attente.length} demande(s) en attente de validation`,
            lines: attente.slice(0, 3).map(m => `${m.materiel_nom} × ${m.quantite} — demandée le ${fmtDate(m.date_mouvement)}`),
            more: attente.length - 3,
          });
        }
        const semaine = Date.now() - 7 * 24 * 3600 * 1000;
        const rejetees = mine.filter(m => m.statut === 'REJETEE' && new Date(m.updated_at || m.date_mouvement).getTime() > semaine);
        if (rejetees.length > 0) {
          list.push({
            id: 'rejetees', level: 'danger', icon: '❌', to: R.mouvements,
            title: `${rejetees.length} demande(s) rejetée(s) cette semaine`,
            lines: rejetees.slice(0, 3).map(m => `${m.materiel_nom} × ${m.quantite}${m.commentaire ? ' — ' + m.commentaire : ''}`),
            more: rejetees.length - 3,
          });
        }
        const retards = mine.filter(m => m.statut === 'EN_RETARD');
        if (retards.length > 0) {
          list.push({
            id: 'retards', level: 'danger', icon: '⏰', to: R.mouvements,
            title: `${retards.length} matériel(s) à rendre en retard`,
            lines: retards.slice(0, 3).map(m => `${m.materiel_nom} × ${m.quantite} — prévu le ${fmtDate(m.date_retour_prevue)}`),
            more: retards.length - 3,
          });
        }
        const bientot = mine.filter(m => m.statut === 'EN_COURS' && m.type === 'EMPRUNT' && m.date_retour_prevue
          && new Date(m.date_retour_prevue).getTime() - Date.now() < 2 * 24 * 3600 * 1000 && new Date(m.date_retour_prevue).getTime() >= Date.now() - 24 * 3600 * 1000);
        if (bientot.length > 0) {
          list.push({
            id: 'bientot', level: 'warn', icon: '📅', to: R.mouvements,
            title: `${bientot.length} matériel(s) à rendre sous 2 jours`,
            lines: bientot.slice(0, 3).map(m => `${m.materiel_nom} × ${m.quantite} — avant le ${fmtDate(m.date_retour_prevue)}`),
            more: bientot.length - 3,
          });
        }
      }

      setAlerts(list);
      setError(false);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load, visible, location.pathname]);

  // Fermer en cliquant à l'extérieur ou avec Échap
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isNew = (a) => seen[a.id] !== signature(a);
  const unseen = alerts.filter(isNew);
  const count = unseen.length;
  const hasDanger = unseen.some(a => a.level === 'danger');

  // Marque toutes les alertes actuelles comme vues
  const markAllSeen = (list) => {
    const next = { ...seen };
    list.forEach(a => { next[a.id] = signature(a); });
    setSeen(next);
    saveSeen(uid, next);
  };

  const toggle = () => {
    if (!open) {
      setFresh(unseen.map(a => a.id)); // garder les points « nouveau » pendant cette ouverture
      markAllSeen(alerts);              // le compteur disparaît dès qu'on a regardé
      load();
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (open && alerts.length > 0) {
      const changed = alerts.filter(a => seen[a.id] !== signature(a));
      if (changed.length > 0) {
        setFresh(f => [...new Set([...f, ...changed.map(a => a.id)])]);
        markAllSeen(alerts);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, open]);

  const go = (to) => { setOpen(false); setFresh([]); if (to) navigate(to); };

  if (!visible || !role) return null;

  return (
    <>
      <style>{`
        .nb-wrap { position: fixed; right: 24px; bottom: 24px; z-index: 3000; }
        .nb-btn {
          width: 54px; height: 54px; border-radius: 50%; border: none; cursor: pointer;
          background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(37,99,235,0.4); position: relative; transition: transform 0.15s;
        }
        .nb-btn:hover { transform: scale(1.06); }
        .nb-btn svg { width: 24px; height: 24px; stroke: currentColor; stroke-width: 2; fill: none; }
        .nb-badge {
          position: absolute; top: -4px; right: -4px; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px;
          background: #dc2626; color: #fff; font-size: 0.72rem; font-weight: 700; border: 2px solid #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .nb-badge.warn { background: #d97706; }
        .nb-badge.ok { background: #16a34a; }
        .nb-ring { animation: nbRing 2.4s ease-in-out infinite; transform-origin: top center; }
        @keyframes nbRing { 0%, 90%, 100% { transform: rotate(0); } 93% { transform: rotate(14deg); } 96% { transform: rotate(-12deg); } }
        .nb-panel {
          position: absolute; right: 0; bottom: 66px; width: 380px; max-width: calc(100vw - 32px);
          max-height: min(560px, calc(100vh - 110px)); overflow-y: auto; background: #fff; border-radius: 16px;
          box-shadow: 0 20px 50px rgba(15,23,42,0.28); border: 1px solid #e2e8f0;
        }
        .nb-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; background: #fff; }
        .nb-head h4 { font-size: 1rem; color: #0f172a; }
        .nb-head button { background: none; border: none; cursor: pointer; color: #64748b; font-size: 0.8rem; font-family: inherit; }
        .nb-item { display: flex; gap: 12px; padding: 14px 18px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.15s; }
        .nb-item:hover { background: #f8fafc; }
        .nb-ico { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.05rem; flex-shrink: 0; }
        .nb-ico.danger { background: #fee2e2; } .nb-ico.warn { background: #fef3c7; } .nb-ico.info { background: #dbeafe; }
        .nb-title { font-size: 0.88rem; font-weight: 600; color: #0f172a; }
        .nb-line { font-size: 0.76rem; color: #64748b; margin-top: 3px; line-height: 1.35; }
        .nb-new { margin-left: 8px; background: #2563eb; color: #fff; font-size: 0.62rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; vertical-align: middle; }
        .nb-more { font-size: 0.74rem; color: #2563eb; margin-top: 3px; }
        .nb-empty { padding: 34px 18px; text-align: center; color: #64748b; font-size: 0.88rem; }
        .nb-empty .big { font-size: 2rem; margin-bottom: 8px; }
        @media print { .nb-wrap { display: none; } }
      `}</style>

      <div className="nb-wrap" ref={boxRef}>
        {open && (
          <div className="nb-panel" role="dialog" aria-label="Notifications">
            <div className="nb-head">
              <h4>🔔 Notifications</h4>
              <button onClick={load}>↻ Actualiser</button>
            </div>
            {error && <div className="nb-empty">Impossible de charger les notifications.</div>}
            {!error && alerts.length === 0 && (
              <div className="nb-empty"><div className="big">✅</div>Tout est à jour, aucune alerte.</div>
            )}
            {!error && alerts.map(a => (
              <div className="nb-item" key={a.id} onClick={() => go(a.to)}>
                <div className={`nb-ico ${a.level}`}>{a.icon}</div>
                <div>
                  <div className="nb-title">{a.title}{fresh.includes(a.id) && <span className="nb-new">Nouveau</span>}</div>
                  {a.lines.map((l, i) => <div className="nb-line" key={i}>{l}</div>)}
                  {a.more > 0 && <div className="nb-more">+ {a.more} autre(s) — voir tout</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="nb-btn" onClick={toggle} aria-label="Notifications">
          <svg viewBox="0 0 24 24" className={count > 0 ? 'nb-ring' : ''}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {!loading && count > 0 && <span className={`nb-badge ${hasDanger ? '' : 'warn'}`}>{count}</span>}
        </button>
      </div>
    </>
  );
};

export default NotificationBell;