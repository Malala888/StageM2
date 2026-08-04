import React from 'react';
import { Link, useLoaderData, useRouteError, useRevalidator } from 'react-router-dom';
import SectionSidebar from '../components/SectionSidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let sectionDashboardCache = null;
let sectionDashboardCacheTime = 0;
const CACHE_TTL_MS = 15000;

export function clearSectionDashboardCache() {
  sectionDashboardCache = null;
  sectionDashboardCacheTime = 0;
}

async function fetchSectionDashboardData() {
  const now = Date.now();
  if (sectionDashboardCache && now - sectionDashboardCacheTime < CACHE_TTL_MS) {
    return sectionDashboardCache;
  }

  const [
    { data: userData },
    { data: users },
    { data: stockData },
    { data: mouvements },
    { data: sections },
    { data: brigades },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/accounts/users/'),
    api.get('/materiaux/stock/'),
    api.get('/materiaux/mouvements/'),
    api.get('/personnel/sections/'),
    api.get('/personnel/brigades/'),
  ]);

  // Filtrer par section de l'utilisateur (Chef de Section)
  const sectionId = userData.section;
  const section = sections.find(s => s.id === sectionId);
  const sectionName = section?.nom || 'N/A';

  // Utilisateurs de la section
  const usersSection = users.filter(u => u.section === sectionId);
  const actifs = usersSection.filter(u => u.statut === 'ACTIF');
  const enAttente = usersSection.filter(u => u.statut === 'EN_ATTENTE');

  // Brigades de la section
  const brigadesSection = brigades.filter(b => b.section === sectionId);
  const brigadeIds = brigadesSection.map(b => b.id);

  // Mouvements des brigades de la section
  const mouvementsSection = mouvements.filter(m => brigadeIds.includes(m.brigade));
  const derniers = mouvementsSection.slice(0, 5);
  const enCours = mouvementsSection.filter(m => m.statut === 'EN_COURS');
  const retards = mouvementsSection.filter(m => m.statut === 'EN_RETARD');

  // Stock total (pour la section, on peut sommer par matériel – on garde global ici)
  const totalStock = stockData.reduce((acc, item) => acc + item.quantite, 0);

  // Activités récentes
  const activitesList = derniers.map((m, index) => ({
    id: m.id || index,
    type: m.type,
    materiel: m.materiel ? m.materiel.nom : 'Matériel',
    agent: m.agent_concerner ? `${m.agent_concerner.nom} ${m.agent_concerner.prenom}` : 'Système',
    date: new Date(m.date_mouvement).toLocaleDateString('fr-FR'),
    statut: m.statut,
  }));

  const result = {
    user: userData,
    section: section,
    sectionName,
    stats: {
      agentsActifs: actifs.length,
      totalAgents: usersSection.length,
      stockTotal: totalStock,
      empruntsEnCours: enCours.length,
      retards: retards.length,
    },
    derniersMouvements: derniers,
    activites: activitesList,
    comptesEnAttente: enAttente,
  };

  sectionDashboardCache = result;
  sectionDashboardCacheTime = now;
  return result;
}

// ─── Loader ───
export async function sectionDashboardLoader() {
  return fetchSectionDashboardData();
}

// ─── ErrorElement ───
export function SectionDashboardError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement du tableau de bord section:', error);
  return (
    <div className="dashboard-body">
      <div className="app">
        <SectionSidebar />
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

// ─── Composant principal ───
const SectionDashboard = () => {
  const { user, section, sectionName, stats, derniersMouvements, activites, comptesEnAttente } = useLoaderData();
  const revalidator = useRevalidator();

  // Fonction de validation hiérarchique (Chef de Section peut valider CHEF_BRIGADE, GL, CN de sa section)
  const canValidate = (targetUser) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'CHEF_SECTION') {
      if (!user.section) return false;
      if (!['CHEF_BRIGADE', 'GL', 'CN'].includes(targetUser.role)) return false;
      return targetUser.section === user.section;
    }
    return false;
  };

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

        /* ─── Contenu principal avec marge ─── */
        .main {
          flex: 1;
          padding: 28px 36px;
          margin-left: 240px;
          max-width: calc(100% - 240px);
        }

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
        .page-header .sub .section-badge {
          display: inline-block;
          padding: 4px 14px;
          background: #dbeafe;
          color: #2563eb;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
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
          .main { padding: 20px 24px; max-width: calc(100% - 200px); margin-left: 200px; }
        }
        @media (max-width: 768px) {
          .app { flex-direction: column; }
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

          <SectionSidebar />

          <main className="main">

            <div className="page-header">
              <div>
                <h1>Tableau de bord</h1>
                <div className="sub">
                  Bienvenue, {user?.nom || 'Chef'} {user?.prenom || 'Section'} — Section <span className="section-badge">{sectionName}</span>
                </div>
              </div>
              <div className="user-badge">
                <div className="avatar">{user?.nom ? user.nom[0] : 'CS'}</div>
                <div>
                  <div className="name">{user?.nom || 'Chef'}</div>
                  <div className="role">Chef de Section</div>
                </div>
              </div>
            </div>

            {/* Widgets */}
            <div className="widget-grid">
              <div className="widget">
                <div className="icon">
                  <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="label">Agents actifs</div>
                <div className="value">{stats.agentsActifs} <small>/ {stats.totalAgents}</small></div>
                <span className="change">+{stats.agentsActifs} actifs</span>
              </div>
              <div className="widget">
                <div className="icon">
                  <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <div className="label">Matériels en stock</div>
                <div className="value">{stats.stockTotal}</div>
                <span className="change">Total unités</span>
              </div>
              <div className="widget">
                <div className="icon">
                  <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="label">En cours d'emprunt</div>
                <div className="value">{stats.empruntsEnCours}</div>
                <span className="change down">En cours</span>
              </div>
              <div className="widget">
                <div className="icon">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div className="label">Retards signalés</div>
                <div className="value">{stats.retards}</div>
                <span className="change down">À traiter</span>
              </div>
            </div>

            {/* Cards */}
            <div className="card-grid">
              <div className="card">
                <h3>
                  Derniers mouvements
                  <Link to="/section/mouvements">Voir tout →</Link>
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
                            <td>{mvt.materiel?.nom || 'N/A'}</td>
                            <td>{mvt.type}</td>
                            <td>{mvt.agent_concerner ? `${mvt.agent_concerner.nom} ${mvt.agent_concerner.prenom}` : 'Système'}</td>
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

            {/* Comptes en attente */}
            <div className="card">
              <h3>
                Comptes en attente de validation
                <Link to="/section/users">Tout valider →</Link>
              </h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Nom</th><th>Email</th><th>Poste</th><th>Brigade</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {comptesEnAttente.length > 0 ? (
                      comptesEnAttente.map((targetUser) => {
                        const canValidateUser = canValidate(targetUser);
                        return (
                          <tr key={targetUser.id}>
                            <td>{targetUser.nom} {targetUser.prenom}</td>
                            <td>{targetUser.email}</td>
                            <td>{targetUser.role}</td>
                            <td>{targetUser.brigade?.nom || 'N/A'}</td>
                            <td>
                              {canValidateUser ? (
                                <>
                                  <button
                                    className="btn-sm success"
                                    onClick={async () => {
                                      try {
                                        await api.patch(`/accounts/users/${targetUser.id}/valider/`);
                                        clearSectionDashboardCache();
                                        revalidator.revalidate();
                                        alert(`✅ ${targetUser.nom} ${targetUser.prenom} validé`);
                                      } catch (err) {
                                        console.error(err);
                                        alert('❌ Erreur lors de la validation');
                                      }
                                    }}
                                  >
                                    Valider
                                  </button>
                                  <button
                                    className="btn-sm danger"
                                    onClick={async () => {
                                      if (!confirm(`Rejeter ${targetUser.nom} ${targetUser.prenom} ?`)) return;
                                      try {
                                        await api.patch(`/accounts/users/${targetUser.id}/rejeter/`);
                                        clearSectionDashboardCache();
                                        revalidator.revalidate();
                                        alert(`❌ ${targetUser.nom} ${targetUser.prenom} rejeté`);
                                      } catch (err) {
                                        console.error(err);
                                        alert('❌ Erreur lors du rejet');
                                      }
                                    }}
                                  >
                                    Rejeter
                                  </button>
                                </>
                              ) : (
                                <span className="badge gray">En attente</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="5">Aucun compte en attente</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        </div>
      </div>
    </>
  );
};

export default SectionDashboard;