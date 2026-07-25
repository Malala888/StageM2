import React, { useState } from 'react';
import BrigadeSidebar from '../components/BrigadeSidebar';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

const BrigadeUsers = () => {
  // ─── States pour les filtres ───
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ─── Handlers ───
  const handleFilter = () => {
    alert('Filtres appliqués !');
  };

  const handleReset = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
  };

  const handleAddUser = () => {
    alert('➕ Ajouter un nouvel agent');
  };

  const handleEdit = (nom) => {
    alert(`✏️ Modifier : ${nom}`);
  };

  const handleDelete = (nom) => {
    alert(`🗑️ Supprimer : ${nom}`);
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

        .users-body {
          font-family: 'Inter', sans-serif;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
          color: #0f172a;
          min-height: 100vh;
        }

        .users-body::before {
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
        .page-header .sub .brigade-badge {
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

        .filters {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .filters select, .filters input {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: rgba(255,255,255,0.6);
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .filters select:focus, .filters input:focus {
          border-color: #2563eb;
        }

        .actions-cell {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .status-select {
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          font-size: 0.7rem;
          font-weight: 600;
          background: rgba(255,255,255,0.8);
          cursor: pointer;
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
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>

      <div className="users-body">
        <div className="app">
          {/* Sidebar fixed, importée depuis le composant séparé */}
          <BrigadeSidebar />

          <main className="main">
            <div className="page-header">
              <div>
                <h1>Utilisateurs</h1>
                <div className="sub">
                  Gestion des comptes — Brigade <span className="brigade-badge">BR FI</span>
                </div>
              </div>
              <div className="user-badge">
                <div className="avatar">CB</div>
                <div>
                  <div className="name">Chef Brigade</div>
                  <div className="role">Chef de Brigade</div>
                </div>
              </div>
            </div>

            {/* ─── Liste des agents ─── */}
            <div className="card">
              <h3>
                👥 Agents de la brigade
                <span>
                  <button className="btn-sm success" style={{ padding: '8px 16px' }} onClick={handleAddUser}>
                    + Nouvel agent
                  </button>
                </span>
              </h3>

              <div className="filters">
                <input
                  type="text"
                  placeholder="🔍 Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="">Rôle</option>
                  <option value="GL">GL</option>
                  <option value="CN">CN</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">Statut</option>
                  <option value="ACTIF">ACTIF</option>
                  <option value="EN_ATTENTE">EN_ATTENTE</option>
                  <option value="SUSPENDU">SUSPENDU</option>
                  <option value="ARCHIVE">ARCHIVE</option>
                </select>
                <button className="btn-sm primary" style={{ padding: '8px 20px' }} onClick={handleFilter}>
                  Filtrer
                </button>
                <button className="btn-sm outline" style={{ padding: '8px 20px' }} onClick={handleReset}>
                  Réinitialiser
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Rakoto Jean</strong></td>
                      <td>jean.rakoto@fce.mg</td>
                      <td><span className="badge blue">GL</span></td>
                      <td><span className="badge green">ACTIF</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleEdit('Rakoto Jean')}>✏️</button>
                        <button className="btn-sm danger" onClick={() => handleDelete('Rakoto Jean')}>🗑️</button>
                        <select className="status-select" defaultValue="ACTIF">
                          <option value="ACTIF">ACTIF</option>
                          <option value="SUSPENDU">SUSPENDU</option>
                          <option value="ARCHIVE">ARCHIVE</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Ranaivo Marie</strong></td>
                      <td>marie.ranaivo@fce.mg</td>
                      <td><span className="badge blue">CN</span></td>
                      <td><span className="badge green">ACTIF</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleEdit('Ranaivo Marie')}>✏️</button>
                        <button className="btn-sm danger" onClick={() => handleDelete('Ranaivo Marie')}>🗑️</button>
                        <select className="status-select" defaultValue="ACTIF">
                          <option value="ACTIF">ACTIF</option>
                          <option value="SUSPENDU">SUSPENDU</option>
                          <option value="ARCHIVE">ARCHIVE</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Andriatsitohaina Faly</strong></td>
                      <td>faly.andri@fce.mg</td>
                      <td><span className="badge blue">GL</span></td>
                      <td><span className="badge yellow">EN_ATTENTE</span></td>
                      <td className="actions-cell">
                        <span className="badge gray" style={{ background: '#f1f5f9', color: '#64748b' }}>
                          En attente de validation
                        </span>
                        <button className="btn-sm outline" onClick={() => handleEdit('Andriatsitohaina Faly')}>✏️</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#94a3b8', background: '#f1f5f9', padding: '8px 14px', borderRadius: '8px' }}>
                ℹ️ Les comptes en attente doivent être validés par le Chef de Section.
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default BrigadeUsers;