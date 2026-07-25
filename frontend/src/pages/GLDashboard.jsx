import React from 'react';
import { Link } from 'react-router-dom';
import GLSidebar from '../components/GLSidebar';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

const GLDashboard = () => {
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
          display: block;          /* plus de flex, sidebar fixed */
          min-height: 100vh;
        }

        /* ─── Le main est décalé pour la sidebar fixed ─── */
        .main {
          margin-left: 240px;      /* largeur de la sidebar */
          padding: 28px 36px;
          min-height: 100vh;
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
        .page-header .sub .role-badge {
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

        /* ─── Responsive ─── */
        @media (max-width: 1024px) {
          .main { margin-left: 200px; padding: 20px 24px; }
        }
        @media (max-width: 768px) {
          .main {
            margin-left: 0;        /* la sidebar devient relative ou on garde fixed mais on réduit le padding */
            padding: 16px;
          }
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
          {/* Sidebar fixed, importée depuis le composant séparé */}
          <GLSidebar />

          <main className="main">
            <div className="page-header">
              <div>
                <h1>Tableau de bord</h1>
                <div className="sub">
                  Bienvenue, Garde Ligne <span className="role-badge">GL</span>
                </div>
              </div>
              <div className="user-badge">
                <div className="avatar">GL</div>
                <div>
                  <div className="name">Rakoto Jean</div>
                  <div className="role">Garde Ligne • BR FI</div>
                </div>
              </div>
            </div>

            <div className="widget-grid">
              <div className="widget">
                <div className="icon">
                  <svg viewBox="0 0 24 24">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div className="label">Matériels assignés</div>
                <div className="value">8</div>
                <span className="change">+1 ce mois</span>
              </div>
              <div className="widget">
                <div className="icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="label">En cours d'emprunt</div>
                <div className="value">2</div>
                <span className="change">+1 depuis hier</span>
              </div>
              <div className="widget">
                <div className="icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="label">Retards</div>
                <div className="value">0</div>
                <span className="change" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>Aucun retard</span>
              </div>
              <div className="widget">
                <div className="icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="label">Brigade</div>
                <div className="value" style={{ fontSize: '1.2rem' }}>BR FI</div>
                <span className="change">Fianarantsoa</span>
              </div>
            </div>

            <div className="card-grid">
              <div className="card">
                <h3>
                  Mes derniers mouvements
                  <Link to="/gl/mouvements">Voir tout →</Link>
                </h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Matériel</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Pelle DS-12</td>
                        <td>EMPRUNT</td>
                        <td>24/07/2026</td>
                        <td><span className="badge yellow">En cours</span></td>
                      </tr>
                      <tr>
                        <td>Brouette 45L</td>
                        <td>RETOUR</td>
                        <td>23/07/2026</td>
                        <td><span className="badge green">Retourné</span></td>
                      </tr>
                      <tr>
                        <td>Perceuse Bosh</td>
                        <td>EMPRUNT</td>
                        <td>20/07/2026</td>
                        <td><span className="badge green">Retourné</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3>Activité récente</h3>
                <div className="activity-item">
                  <span className="dot blue"></span>
                  <span className="text">Emprunt enregistré : <strong>Pelle DS-12</strong></span>
                  <span className="time">1h</span>
                </div>
                <div className="activity-item">
                  <span className="dot green"></span>
                  <span className="text">Retour effectué : <strong>Brouette 45L</strong></span>
                  <span className="time">3h</span>
                </div>
                <div className="activity-item">
                  <span className="dot yellow"></span>
                  <span className="text">Nouveau matériel assigné : <strong>Échelle 6m</strong></span>
                  <span className="time">hier</span>
                </div>
                <div className="activity-item">
                  <span className="dot green"></span>
                  <span className="text">Profil mis à jour</span>
                  <span className="time">hier</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>
                📋 Matériels assignés
                <Link to="/gl/materiels">Voir tout →</Link>
              </h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Matériel</th>
                      <th>État</th>
                      <th>Quantité</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Pelle DS-12</strong></td>
                      <td><span className="badge green">BON</span></td>
                      <td>1</td>
                      <td><button className="btn-sm primary">Demander un emprunt</button></td>
                    </tr>
                    <tr>
                      <td><strong>Brouette 45L</strong></td>
                      <td><span className="badge yellow">MOYEN</span></td>
                      <td>2</td>
                      <td><button className="btn-sm primary">Demander un emprunt</button></td>
                    </tr>
                    <tr>
                      <td><strong>Échelle 6m</strong></td>
                      <td><span className="badge green">NEUF</span></td>
                      <td>1</td>
                      <td><button className="btn-sm primary">Demander un emprunt</button></td>
                    </tr>
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

export default GLDashboard;