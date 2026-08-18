import React from 'react';
import { Link, useLoaderData, useRouteError } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// Petit cache en mémoire : si les données ont été préchargées au survol
// du lien (voir prefetchServiceDashboard), le loader les réutilise au
// lieu de refaire les appels — navigation quasi instantanée.
let dashboardCache = null;
let dashboardCacheTime = 0;
const CACHE_TTL_MS = 15000; // 15s : au-delà, on considère les données périmées

async function fetchDashboardData() {
  const now = Date.now();
  if (dashboardCache && now - dashboardCacheTime < CACHE_TTL_MS) {
    return dashboardCache;
  }

  // Les 5 appels ne dépendent pas les uns des autres : on les lance
  // en parallèle plutôt que d'attendre chacun l'un après l'autre.
  const [
    { data: userData },
    { data: users },
    { data: stockData },
    { data: mouvements },
    { data: brigades },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/accounts/users/'),
    api.get('/materiaux/stock/'),
    api.get('/materiaux/mouvements/'),
    api.get('/personnel/brigades/'),
  ]);

  const actifs = users.filter(u => u.statut === 'ACTIF');
  const enAttente = users.filter(u => u.statut === 'EN_ATTENTE');
  const totalStock = stockData.reduce((acc, item) => acc + item.quantite, 0);
  const derniers = mouvements.slice(0, 5); // les 5 derniers
  const enCours = mouvements.filter(m => m.statut === 'EN_COURS');
  const retards = mouvements.filter(m => m.statut === 'EN_RETARD');

  const activitesList = derniers.map((m, index) => ({
    id: m.id || index,
    type: m.type,
    materiel: m.materiel_nom || 'Matériel',
    agent: m.agent_concerner_nom || 'Système',
    date: new Date(m.date_mouvement).toLocaleDateString('fr-FR'),
    statut: m.statut,
  }));

  const result = {
    user: userData,
    brigades,
    stats: {
      utilisateursActifs: actifs.length,
      totalUtilisateurs: users.length,
      stockTotal: totalStock,
      empruntsEnCours: enCours.length,
      retards: retards.length,
    },
    derniersMouvements: derniers,
    activites: activitesList,
    comptesEnAttente: enAttente,
  };

  dashboardCache = result;
  dashboardCacheTime = now;
  return result;
}

// Appelé par React Router juste avant d'afficher la page.
export async function serviceDashboardLoader() {
  return fetchDashboardData();
}

// À appeler au survol du lien vers /dashboard (onMouseEnter) pour lancer
// le chargement en avance. Si l'utilisateur clique ensuite, le loader
// trouvera les données déjà en cache : navigation quasi instantanée.
export function prefetchServiceDashboard() {
  fetchDashboardData().catch(() => {
    // on ignore les erreurs ici : si le préchargement échoue, le loader
    // réessaiera normalement au clic et affichera l'écran d'erreur si besoin
  });
}

// Affiché automatiquement par React Router si le loader plante (ex: API down)
export function ServiceDashboardError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement du tableau de bord:', error);
  return (
    <div className="dashboard-body">
      <div className="app">
        <Sidebar />
        <main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <div style={{ color: 'red', textAlign: 'center' }}>
            <h2>Erreur</h2>
            <p>Impossible de charger les données. Veuillez réessayer.</p>
            <button onClick={() => window.location.reload()} className="btn-sm primary">Réessayer</button>
          </div>
        </main>
      </div>
    </div>
  );
}

const ServiceDashboard = () => {
  const { user, stats, derniersMouvements, activites, comptesEnAttente, brigades } = useLoaderData();

  const getBrigadeName = (brigadeId) => {
    if (!brigadeId) return 'N/A';
    return brigades.find(b => b.id === brigadeId)?.nom || 'N/A';
  };

  // ─── Personnalisation du tableau de bord selon le périmètre du rôle ───
  // (le backend renvoie déjà des données scopées : ici on adapte juste les libellés)
  const isGlOuCn = user?.role === 'GL' || user?.role === 'CN';
  const peutValider = ['ADMIN', 'CHEF_SECTION', 'CHEF_BRIGADE'].includes(user?.role);

  let sousTitre = 'vue globale du système';
  if (user?.role === 'CHEF_SECTION') sousTitre = 'vue de votre section';
  else if (user?.role === 'CHEF_BRIGADE') sousTitre = `vue de votre brigade${getBrigadeName(user?.brigade) !== 'N/A' ? ` (${getBrigadeName(user.brigade)})` : ''}`;
  else if (isGlOuCn) sousTitre = 'votre espace personnel';

  return (
    <>
      <style>{`
        /* ─── Reset complet ─── */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          min-height: 100%;
          font-family: 'Inter', sans-serif;
        }

        #root {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          min-height: 100vh !important;
          display: block !important;
          border: none !important;
          padding: 0 !important;
        }

        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

        .dashboard-body {
          font-family: 'Inter', sans-serif;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
          color: #0f172a;
          min-height: 100vh;
        }

        .dashboard-body::before {
          content: '';
          position: fixed;
          inset: 0;
          background: rgba(255, 255, 255, 0.30);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          z-index: 0;
        }

        .app {
          position: relative;
          z-index: 1;
          display: flex;
          min-height: 100vh;
        }

        /* ─── Sidebar fixe ─── */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 240px;
          height: 100vh;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-right: 1px solid rgba(255, 255, 255, 0.3);
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex-shrink: 0;
          z-index: 100;
        }

        /* ─── Contenu principal avec marge ─── */
        .main {
          flex: 1;
          padding: 28px 36px;
          margin-left: 240px;
          max-width: calc(100% - 240px);
        }

        .sidebar-brand {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sidebar-brand span { color: #2563eb; }
        .sidebar-brand svg { width: 24px; height: 24px; stroke: #2563eb; stroke-width: 2; fill: none; }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .sidebar-menu a {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          color: #475569;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          transition: background 0.15s, color 0.15s;
        }
        .sidebar-menu a:hover {
          background: rgba(37, 99, 235, 0.08);
          color: #0f172a;
        }
        .sidebar-menu a.active {
          background: #2563eb;
          color: #fff;
        }
        .sidebar-menu a svg {
          width: 20px;
          height: 20px;
          stroke: currentColor;
          stroke-width: 2;
          fill: none;
          flex-shrink: 0;
        }

        .sidebar-footer {
          padding-top: 16px;
          border-top: 1px solid rgba(0,0,0,0.06);
          font-size: 0.8rem;
          color: #94a3b8;
        }
        .sidebar-footer a {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
          text-decoration: none;
          padding: 8px 0;
          transition: color 0.15s;
        }
        .sidebar-footer a:hover { color: #0f172a; }
        .sidebar-footer svg { width: 18px; height: 18px; stroke: currentColor; stroke-width: 2; fill: none; }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }
        .page-header h1 {
          font-size: 1.8rem;
          font-weight: 700;
          color: #0f172a;
        }
        .page-header .sub {
          font-size: 0.9rem;
          color: #475569;
          font-weight: 400;
          margin-top: 2px;
        }
        .page-header .user-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(4px);
          padding: 8px 16px 8px 12px;
          border-radius: 40px;
          border: 1px solid rgba(255,255,255,0.5);
        }
        .page-header .user-badge .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #2563eb;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .page-header .user-badge .name {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .page-header .user-badge .role {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .widget-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 18px;
          margin-bottom: 28px;
        }
        .widget {
          background: rgba(255, 255, 255, 0.70);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          padding: 18px 20px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .widget:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
        }
        .widget .label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }
        .widget .value {
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 4px;
        }
        .widget .value small {
          font-size: 0.9rem;
          font-weight: 500;
          color: #94a3b8;
          margin-left: 6px;
        }
        .widget .change {
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 6px;
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          background: rgba(34, 197, 94, 0.12);
          color: #16a34a;
        }
        .widget .change.down {
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
        }
        .widget .icon {
          float: right;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(37, 99, 235, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
        }
        .widget .icon svg { width: 20px; height: 20px; stroke: currentColor; stroke-width: 2; fill: none; }

        .card {
          background: rgba(255, 255, 255, 0.70);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          padding: 20px 24px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          margin-bottom: 24px;
        }
        .card h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .card h3 a {
          font-size: 0.8rem;
          font-weight: 600;
          color: #2563eb;
          text-decoration: none;
        }
        .card h3 a:hover { text-decoration: underline; }

        .table-wrap { overflow-x: auto; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        table th {
          text-align: left;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          font-size: 0.65rem;
          letter-spacing: 0.05em;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        table td {
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
        }
        table tr:last-child td { border-bottom: none; }

        .badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .badge.green { background: #dcfce7; color: #16a34a; }
        .badge.yellow { background: #fef9c3; color: #ca8a04; }
        .badge.red { background: #fee2e2; color: #dc2626; }
        .badge.blue { background: #dbeafe; color: #2563eb; }
        .badge.gray { background: #f1f5f9; color: #64748b; }

        .btn-sm {
          padding: 4px 12px;
          border: none;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-sm.primary { background: #2563eb; color: #fff; }
        .btn-sm.primary:hover { background: #1d4ed8; }
        .btn-sm.success { background: #16a34a; color: #fff; }
        .btn-sm.success:hover { background: #15803d; }
        .btn-sm.danger { background: #dc2626; color: #fff; }
        .btn-sm.danger:hover { background: #b91c1c; }
        .btn-sm.outline { background: transparent; color: #475569; border: 1px solid #e2e8f0; }
        .btn-sm.outline:hover { background: #f1f5f9; }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .activity-item:last-child { border-bottom: none; }
        .activity-item .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563eb;
          flex-shrink: 0;
        }
        .activity-item .dot.green { background: #16a34a; }
        .activity-item .dot.yellow { background: #ca8a04; }
        .activity-item .dot.red { background: #dc2626; }
        .activity-item .text { font-size: 0.85rem; color: #1e293b; }
        .activity-item .time { font-size: 0.7rem; color: #94a3b8; margin-left: auto; white-space: nowrap; }

        .card-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 28px;
        }

        @media (max-width: 1024px) {
          .sidebar { width: 200px; padding: 20px 16px; }
          .main { padding: 20px 24px; max-width: calc(100% - 200px); margin-left: 200px; }
        }
        @media (max-width: 768px) {
          .app { flex-direction: column; }
          .sidebar {
            width: 100%;
            min-height: auto;
            position: static;
            flex-direction: row;
            flex-wrap: wrap;
            padding: 16px 20px;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.3);
            gap: 8px;
            align-items: center;
          }
          .sidebar-brand { padding-bottom: 0; border-bottom: none; }
          .sidebar-menu { flex-direction: row; flex-wrap: wrap; gap: 2px; flex: none; }
          .sidebar-menu a { padding: 6px 12px; font-size: 0.8rem; }
          .sidebar-footer { display: none; }
          .main { max-width: 100%; padding: 16px; margin-left: 0; }
          .card-grid { grid-template-columns: 1fr; }
          .widget-grid { grid-template-columns: repeat(2, 1fr); }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
        @media (max-width: 480px) {
          .widget-grid { grid-template-columns: 1fr; }
          .widget .value { font-size: 1.5rem; }
        }
      `}</style>

      <div className="dashboard-body">
        <div className="app">

          <Sidebar />

          <main className="main">

            <div className="page-header">
              <div>
                <h1>Tableau de bord</h1>
                <div className="sub">Bienvenue, {user?.nom || 'Admin'} {user?.prenom || ''} — {sousTitre}</div>
              </div>
              <div className="user-badge">
                <div className="avatar">{user?.nom ? user.nom[0] : 'AD'}</div>
                <div>
                  <div className="name">{user?.nom || 'Admin'}</div>
                  <div className="role">{user?.role || '—'}</div>
                </div>
              </div>
            </div>

            {/* Widgets */}
            <div className="widget-grid">
              {!isGlOuCn && (
                <div className="widget">
                  <div className="icon">
                    <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div className="label">Utilisateurs actifs</div>
                  <div className="value">{stats.utilisateursActifs} <small>/ {stats.totalUtilisateurs}</small></div>
                  <span className="change">+{stats.utilisateursActifs} actifs</span>
                </div>
              )}
              <div className="widget">
                <div className="icon">
                  <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <div className="label">{isGlOuCn ? 'Matériel disponible' : 'Matériels en stock'}</div>
                <div className="value">{stats.stockTotal}</div>
                <span className="change">Total unités</span>
              </div>
              <div className="widget">
                <div className="icon">
                  <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="label">{isGlOuCn ? 'Mes emprunts en cours' : "En cours d'emprunt"}</div>
                <div className="value">{stats.empruntsEnCours}</div>
                <span className="change down">En cours</span>
              </div>
              <div className="widget">
                <div className="icon">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div className="label">{isGlOuCn ? 'Mes retards' : 'Retards signalés'}</div>
                <div className="value">{stats.retards}</div>
                <span className="change down">À traiter</span>
              </div>
            </div>

            {/* Cards */}
            <div className="card-grid">
              <div className="card">
                <h3>
                  Derniers mouvements
                  <Link to="/mouvements">Voir tout →</Link>
                </h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Matériel</th><th>Type</th><th>Agent</th><th>Statut</th></tr>
                    </thead>
                    <tbody>
                      {derniersMouvements.length > 0 ? (
                        derniersMouvements.map((mvt) => (
                          <tr key={mvt.id}>
                            <td>{mvt.materiel_nom || 'N/A'}</td>
                            <td>{mvt.type}</td>
                            <td>{mvt.agent_concerner_nom || 'Système'}</td>
                            <td>
                              <span className={`badge ${mvt.statut === 'EN_COURS' ? 'yellow' : mvt.statut === 'RETOURNE' ? 'green' : mvt.statut === 'EN_RETARD' ? 'red' : 'blue'}`}>
                                {mvt.statut}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4">Aucun mouvement récent</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3>Activité récente</h3>
                {activites.length > 0 ? (
                  activites.map((act, index) => (
                    <div className="activity-item" key={index}>
                      <span className={`dot ${act.statut === 'RETOURNE' ? 'green' : act.statut === 'EN_RETARD' ? 'red' : 'blue'}`}></span>
                      <span className="text">
                        {act.type} : <strong>{act.materiel}</strong> {act.agent !== 'Système' && `- ${act.agent}`}
                      </span>
                      <span className="time">{act.date}</span>
                    </div>
                  ))
                ) : (
                  <div className="activity-item">Aucune activité récente</div>
                )}
              </div>
            </div>

            {/* Comptes en attente (non pertinent pour GL/CN : ils ne valident jamais personne) */}
            {peutValider && (
              <div className="card">
                <h3>
                  Comptes en attente de validation
                  <Link to="/users">Tout valider →</Link>
                </h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Nom</th><th>Email</th><th>Poste</th><th>Brigade</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {comptesEnAttente.length > 0 ? (
                        comptesEnAttente.map((u) => (
                          <tr key={u.id}>
                            <td>{u.nom} {u.prenom}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>{getBrigadeName(u.brigade)}</td>
                            <td>
                              <button
                                className="btn-sm success"
                                onClick={async () => {
                                  try {
                                    await api.patch(`/accounts/users/${u.id}/valider/`);
                                    alert(`✅ ${u.nom} ${u.prenom} validé`);
                                    window.location.reload();
                                  } catch (err) {
                                    const msg = err.response?.data?.error || 'Erreur lors de la validation';
                                    alert(`❌ ${msg}`);
                                  }
                                }}
                              >
                                Valider
                              </button>
                              <button
                                className="btn-sm danger"
                                onClick={async () => {
                                  if (!confirm(`Rejeter ${u.nom} ${u.prenom} ?`)) return;
                                  try {
                                    await api.patch(`/accounts/users/${u.id}/rejeter/`);
                                    alert(`❌ ${u.nom} ${u.prenom} rejeté`);
                                    window.location.reload();
                                  } catch (err) {
                                    const msg = err.response?.data?.error || 'Erreur lors du rejet';
                                    alert(`❌ ${msg}`);
                                  }
                                }}
                              >
                                Rejeter
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5">Aucun compte en attente</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
};

export default ServiceDashboard;