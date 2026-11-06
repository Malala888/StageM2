import React from 'react';

// ─── Libellés communs (mouvements) ───
export const ROLES = { ADMIN: 'Chef de Service', CHEF_SECTION: 'Chef de Section', CHEF_BRIGADE: 'Chef de Brigade', GL: 'GL', CN: 'CN' };
export const TYPES = {
  APPROVISIONNEMENT: 'Approvisionnement', EMPRUNT: 'Emprunt', RETOUR: 'Retour', TRANSFERT: 'Transfert',
  REPARATION: 'Réparation', REBUT: 'Mise au rebut', INVENTAIRE: 'Inventaire',
};
export const STATUTS = {
  DEMANDE: 'Demande en attente', EN_COURS: 'En cours', RETOURNE: 'Retourné', EN_RETARD: 'En retard',
  REJETEE: 'Rejetée', PERDU: 'Perdu', ANNULE: 'Annulé',
};
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('fr-FR') : '—');

// Qui est concerné ? Une personne, sinon la brigade, sinon la section, sinon le Service
export const getConcerne = (m) => {
  if (m.type === 'TRANSFERT') {
    return { kind: 'transfert', label: `${m.brigade_nom || '—'} → ${m.brigade_destination_nom || '—'}`, sub: 'Entre brigades' };
  }
  if (m.agent_concerner_nom) {
    const rattache = m.agent_concerner_brigade_nom
      ? ` · Brigade ${m.agent_concerner_brigade_nom}`
      : (m.agent_concerner_section_nom ? ` · Section ${m.agent_concerner_section_nom}` : '');
    return { kind: 'agent', label: m.agent_concerner_nom, sub: `${ROLES[m.agent_concerner_role] || 'Agent'}${rattache}` };
  }
  if (m.brigade_nom) {
    return { kind: 'brigade', label: `Brigade ${m.brigade_nom}`, sub: m.brigade_section_nom ? `Section ${m.brigade_section_nom}` : 'Brigade' };
  }
  if (m.createur_role === 'CHEF_SECTION' && m.createur_section_nom) {
    return { kind: 'section', label: `Section ${m.createur_section_nom}`, sub: `Chef de Section : ${m.createur_nom || '—'}` };
  }
  return { kind: 'service', label: 'Chef de Service', sub: m.createur_nom ? `${m.createur_nom} · niveau Service` : 'Niveau Service' };
};
export const concerneTexte = (m) => {
  const c = getConcerne(m);
  return c.kind === 'agent' ? `${c.label} (${c.sub})` : `${c.label}`;
};

export const getPhrase = (m) => {
  const qui = m.createur_nom
    ? `${m.createur_nom} (${ROLES[m.createur_role] || 'Utilisateur'}${m.createur_section_nom && m.createur_role === 'CHEF_SECTION' ? ' · Section ' + m.createur_section_nom : ''})`
    : 'Un utilisateur';
  const q = `${m.quantite} × ${m.materiel_nom || 'matériel'}${m.etat ? ` (état ${m.etat})` : ''}`;
  const cible = concerneTexte(m);
  switch (m.type) {
    case 'APPROVISIONNEMENT': return `${qui} a ajouté ${q} au stock de ${m.brigade_nom ? `la brigade ${m.brigade_nom}` : (m.createur_role === 'CHEF_SECTION' && m.createur_section_nom ? `la section ${m.createur_section_nom}` : 'du Service')}.`;
    case 'EMPRUNT': return m.statut === 'DEMANDE' || m.statut === 'REJETEE'
      ? `${qui} a demandé l'emprunt de ${q} pour ${cible}.`
      : `${qui} a enregistré l'emprunt de ${q} par ${cible}.`;
    case 'RETOUR': return `${qui} a enregistré le retour de ${q} par ${cible}.`;
    case 'TRANSFERT': return `${qui} a transféré ${q} de la brigade ${m.brigade_nom || '—'} vers la brigade ${m.brigade_destination_nom || '—'}.`;
    case 'REPARATION': return `${qui} a envoyé ${q} en réparation (${cible}).`;
    case 'REBUT': return `${qui} a mis au rebut ${q} (${cible}).`;
    case 'INVENTAIRE': return `${qui} a fixé le stock à ${q} (${cible}).`;
    default: return `${qui} a effectué un mouvement : ${q}.`;
  }
};

// ─── Export CSV ───
const csvEscape = (val) => {
  const s = val === null || val === undefined ? '' : String(val);
  // Séparateur ';' (Excel FR) : on entoure de guillemets si besoin
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Exporte une liste de mouvements en CSV (compatible Excel FR : séparateur ';', BOM UTF-8).
 * @param {Array} mouvements - liste des mouvements à exporter
 * @param {string} [filename] - nom du fichier (sans extension)
 */
export const exportMouvementsCsv = (mouvements = [], filename = 'mouvements') => {
  const colonnes = [
    ['N°', (m) => m.numero],
    ['Type', (m) => TYPES[m.type] || m.type],
    ['Statut', (m) => STATUTS[m.statut] || m.statut],
    ['Matériel', (m) => m.materiel_nom],
    ['Quantité', (m) => m.quantite],
    ['État', (m) => m.etat],
    ['Concerné', (m) => concerneTexte(m)],
    ['Brigade', (m) => m.brigade_nom],
    ['Brigade destination', (m) => m.brigade_destination_nom],
    ['Effectué par', (m) => (m.createur_nom ? `${m.createur_nom} (${ROLES[m.createur_role] || ''})` : '')],
    ['Date du mouvement', (m) => fmtDate(m.date_mouvement)],
    ['Retour prévu le', (m) => fmtDate(m.date_retour_prevue)],
    ['Retourné le', (m) => fmtDate(m.date_retour_effective)],
    ['Commentaire', (m) => m.commentaire],
    ['Enregistré le', (m) => fmtDateTime(m.created_at)],
  ];

  const lignes = [
    colonnes.map(([titre]) => csvEscape(titre)).join(';'),
    ...mouvements.map((m) => colonnes.map(([, get]) => csvEscape(get(m))).join(';')),
  ];

  const blob = new Blob(['\uFEFF' + lignes.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const WhoChipStyles = `
  .cell-sub { font-size: 0.72rem; color: #64748b; margin-top: 2px; }
  .cell-sub.mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.7rem; color: #94a3b8; }
  .who-chip { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; background: #f1f5f9; color: #334155; max-width: 100%; white-space: normal; }
  .who-chip.agent { background: #dbeafe; color: #1d4ed8; }
  .who-chip.brigade { background: #fef3c7; color: #b45309; }
  .who-chip.section { background: #dcfce7; color: #15803d; }
  .who-chip.service { background: #ede9fe; color: #6d28d9; }
  .who-chip.transfert { background: #e0e7ff; color: #4f46e5; }
`;

/** Pastille « Concerné » + détail dessous, à mettre dans une cellule de tableau */
export const ConcerneCell = ({ m }) => {
  const c = getConcerne(m);
  const ico = c.kind === 'agent' ? '👤' : c.kind === 'service' ? '🏛️' : c.kind === 'section' ? '🗂️' : c.kind === 'transfert' ? '🔁' : '🏢';
  return (
    <>
      <style>{WhoChipStyles}</style>
      <span className={`who-chip ${c.kind}`}>{ico} {c.label}</span>
      <div className="cell-sub">{c.sub}</div>
    </>
  );
};

/** Fenêtre « Détail du mouvement » */
const MouvementDetailModal = ({ mouvement: m, onClose }) => {
  if (!m) return null;
  const c = getConcerne(m);
  const Item = ({ k, v, full }) => (
    <div className={`md-item ${full ? 'full' : ''}`}><div className="k">{k}</div><div className="v">{v || '—'}</div></div>
  );
  return (
    <>
      <style>{`
        .md-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 1500; padding: 16px; font-family: 'Inter', sans-serif; }
        .md-card { background: #fff; border-radius: 18px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.25); color: #0f172a; }
        .md-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
        .md-head h3 { font-size: 1.15rem; margin: 0; }
        .md-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; }
        .md-phrase { margin: 18px 24px 0; padding: 14px 16px; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; font-size: 0.92rem; line-height: 1.5; color: #1e3a8a; }
        .md-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; padding: 18px 24px; }
        .md-grid .full { grid-column: 1 / -1; }
        .md-item .k { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 600; margin-bottom: 3px; }
        .md-item .v { font-size: 0.92rem; }
        .md-foot { padding: 14px 24px 20px; display: flex; justify-content: flex-end; }
        .md-btn { background: #2563eb; color: #fff; border: none; border-radius: 10px; padding: 9px 22px; font-weight: 600; cursor: pointer; font-family: inherit; }
        @media (max-width: 560px) { .md-grid { grid-template-columns: 1fr; } }
      `}</style>
      <div className="md-overlay" onClick={onClose}>
        <div className="md-card" onClick={(e) => e.stopPropagation()}>
          <div className="md-head">
            <div>
              <h3>Mouvement {m.numero}</h3>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{TYPES[m.type] || m.type} · {STATUTS[m.statut] || m.statut}</div>
            </div>
            <button className="md-close" onClick={onClose} aria-label="Fermer">✕</button>
          </div>
          <div className="md-phrase">{getPhrase(m)}</div>
          <div className="md-grid">
            <Item k="Matériel" v={m.materiel_nom} />
            <Item k="Quantité" v={m.quantite} />
            <Item k="État du matériel" v={m.etat} />
            <Item k="Date du mouvement" v={fmtDate(m.date_mouvement)} />
            <Item k="Effectué par" v={m.createur_nom ? `${m.createur_nom} — ${ROLES[m.createur_role] || ''}` : null} />
            <Item k="Concerné" v={`${c.label} — ${c.sub}`} />
            <Item k={m.type === 'TRANSFERT' ? "Brigade d'origine" : 'Brigade rattachée'}
              v={m.brigade_nom ? `${m.brigade_nom}${m.brigade_section_nom ? ` (Section ${m.brigade_section_nom})` : ''}` : 'Aucune (niveau Service / Section)'} />
            {m.type === 'TRANSFERT' && (
              <Item k="Brigade de destination" v={m.brigade_destination_nom ? `${m.brigade_destination_nom}${m.brigade_destination_section_nom ? ` (Section ${m.brigade_destination_section_nom})` : ''}` : null} />
            )}
            <Item k="Retour prévu le" v={fmtDate(m.date_retour_prevue)} />
            <Item k="Retourné le" v={fmtDate(m.date_retour_effective)} />
            <Item k="Enregistré le" v={fmtDateTime(m.created_at)} />
            <Item k="Dernière mise à jour" v={fmtDateTime(m.updated_at)} />
            <Item k="Commentaire" v={m.commentaire} full />
          </div>
          <div className="md-foot"><button className="md-btn" onClick={onClose}>Fermer</button></div>
        </div>
      </div>
    </>
  );
};

export default MouvementDetailModal;