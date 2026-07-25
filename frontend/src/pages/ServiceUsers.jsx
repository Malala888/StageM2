import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

const ServiceUsers = () => {
  // ─── States pour les filtres ───
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [brigadeFilter, setBrigadeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ─── States pour les onglets ───
  const [activeTab, setActiveTab] = useState('sections');

  // ─── States pour les formulaires ───
  const [newSection, setNewSection] = useState('');
  const [newBrigade, setNewBrigade] = useState('');
  const [brigadeSection, setBrigadeSection] = useState('FIA');

  // ─── Handlers ───
  const handleFilter = () => {
    alert('Filtres appliqués !');
  };

  const handleReset = () => {
    setSearchTerm('');
    setRoleFilter('');
    setBrigadeFilter('');
    setStatusFilter('');
  };

  const handleAddUser = () => {
    alert('➕ Ajouter un nouvel utilisateur');
  };

  const handleEdit = (nom) => {
    alert(`✏️ Modifier : ${nom}`);
  };

  const handleDelete = (nom) => {
    alert(`🗑️ Supprimer : ${nom}`);
  };

  const handleValidate = (nom) => {
    alert(`✅ Valider : ${nom}`);
  };

  const handleReject = (nom) => {
    alert(`❌ Rejeter : ${nom}`);
  };

  const handleAddSection = () => {
    if (newSection.trim()) {
      alert(`➕ Section ajoutée : ${newSection}`);
      setNewSection('');
    } else {
      alert('Veuillez saisir un nom de section');
    }
  };

  const handleAddBrigade = () => {
    if (newBrigade.trim()) {
      alert(`➕ Brigade ajoutée : ${newBrigade} (Section: ${brigadeSection === 'FIA' ? 'Fianarantsoa' : 'Manakara'})`);
      setNewBrigade('');
    } else {
      alert('Veuillez saisir un nom de brigade');
    }
  };

  const handleEditSection = (nom) => {
    alert(`✏️ Modifier la section : ${nom}`);
  };

  const handleDeleteSection = (nom) => {
    alert(`🗑️ Supprimer la section : ${nom}`);
  };

  const handleEditBrigade = (nom) => {
    alert(`✏️ Modifier la brigade : ${nom}`);
  };

  const handleDeleteBrigade = (nom) => {
    alert(`🗑️ Supprimer la brigade : ${nom}`);
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

        .tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .tabs button {
          padding: 8px 18px;
          border: none;
          background: transparent;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          color: #94a3b8;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
        }
        .tabs button:hover { color: #0f172a; }
        .tabs button.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        .tab-content { display: none; }
        .tab-content.active { display: block; }

        .inline-form {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: flex-end;
          margin-bottom: 16px;
        }
        .inline-form .field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .inline-form .field label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
        }
        .inline-form .field input, .inline-form .field select {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1.5px solid #e2e8f0;
          background: rgba(255,255,255,0.7);
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
          min-width: 150px;
        }
        .inline-form .field input:focus, .inline-form .field select:focus {
          border-color: #2563eb;
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
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .inline-form { flex-direction: column; align-items: stretch; }
          .inline-form .field input { min-width: auto; }
        }
      `}</style>

      <div className="users-body">
        <div className="app">

          <Sidebar />

          <main className="main">

            <div className="page-header">
              <div>
                <h1>Utilisateurs</h1>
                <div className="sub">Gestion des comptes, sections et brigades</div>
              </div>
              <div className="user-badge">
                <div className="avatar">AD</div>
                <div>
                  <div className="name">Admin</div>
                  <div className="role">Chef Service</div>
                </div>
              </div>
            </div>

            {/* ─── Liste des utilisateurs ─── */}
            <div className="card">
              <h3>
                👥 Comptes utilisateurs
                <span>
                  <button className="btn-sm success" style={{ padding: '8px 16px' }} onClick={handleAddUser}>
                    + Nouvel utilisateur
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
                  <option value="ADMIN">ADMIN</option>
                  <option value="CHEF_SECTION">CHEF_SECTION</option>
                  <option value="CHEF_BRIGADE">CHEF_BRIGADE</option>
                  <option value="GL">GL</option>
                  <option value="CN">CN</option>
                </select>
                <select value={brigadeFilter} onChange={(e) => setBrigadeFilter(e.target.value)}>
                  <option value="">Brigade</option>
                  <option value="BOA">BOA</option>
                  <option value="BR FI">BR FI</option>
                  <option value="BR ADV">BR ADV</option>
                  <option value="BR TLG">BR TLG</option>
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
                      <th>Brigade</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Rakoto Jean</strong></td>
                      <td>jean.rakoto@fce.mg</td>
                      <td><span className="badge blue">GL</span></td>
                      <td>BR FI</td>
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
                      <td>BOA</td>
                      <td><span className="badge yellow">EN_ATTENTE</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm success" onClick={() => handleValidate('Ranaivo Marie')}>Valider</button>
                        <button className="btn-sm danger" onClick={() => handleReject('Ranaivo Marie')}>Rejeter</button>
                        <button className="btn-sm outline" onClick={() => handleEdit('Ranaivo Marie')}>✏️</button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Andriatsitohaina Faly</strong></td>
                      <td>faly.andri@fce.mg</td>
                      <td><span className="badge blue">CHEF_BRIGADE</span></td>
                      <td>BR ADV</td>
                      <td><span className="badge green">ACTIF</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleEdit('Andriatsitohaina Faly')}>✏️</button>
                        <button className="btn-sm danger" onClick={() => handleDelete('Andriatsitohaina Faly')}>🗑️</button>
                        <select className="status-select" defaultValue="ACTIF">
                          <option value="ACTIF">ACTIF</option>
                          <option value="SUSPENDU">SUSPENDU</option>
                          <option value="ARCHIVE">ARCHIVE</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── Sections & Brigades ─── */}
            <div className="card">
              <h3>🏗️ Administration des sections et brigades</h3>

              <div className="tabs">
                <button
                  className={activeTab === 'sections' ? 'active' : ''}
                  onClick={() => setActiveTab('sections')}
                >
                  Sections
                </button>
                <button
                  className={activeTab === 'brigades' ? 'active' : ''}
                  onClick={() => setActiveTab('brigades')}
                >
                  Brigades
                </button>
              </div>

              {/* ─── Onglet Sections ─── */}
              <div className={`tab-content ${activeTab === 'sections' ? 'active' : ''}`}>
                <div className="inline-form">
                  <div className="field">
                    <label htmlFor="new-section">Nouvelle section</label>
                    <input
                      type="text"
                      id="new-section"
                      placeholder="Ex: Fianarantsoa"
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                    />
                  </div>
                  <button className="btn-sm primary" style={{ padding: '8px 18px' }} onClick={handleAddSection}>
                    ➕ Ajouter
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Code</th>
                        <th>Brigades</th>
                        <th>Agents</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Fianarantsoa</strong></td>
                        <td>FIA</td>
                        <td>3</td>
                        <td>28</td>
                        <td className="actions-cell">
                          <button className="btn-sm outline" onClick={() => handleEditSection('Fianarantsoa')}>✏️</button>
                          <button className="btn-sm danger" onClick={() => handleDeleteSection('Fianarantsoa')}>🗑️</button>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Manakara</strong></td>
                        <td>MAN</td>
                        <td>2</td>
                        <td>18</td>
                        <td className="actions-cell">
                          <button className="btn-sm outline" onClick={() => handleEditSection('Manakara')}>✏️</button>
                          <button className="btn-sm danger" onClick={() => handleDeleteSection('Manakara')}>🗑️</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ─── Onglet Brigades ─── */}
              <div className={`tab-content ${activeTab === 'brigades' ? 'active' : ''}`}>
                <div className="inline-form">
                  <div className="field">
                    <label htmlFor="new-brigade">Nouvelle brigade</label>
                    <input
                      type="text"
                      id="new-brigade"
                      placeholder="Ex: BOA"
                      value={newBrigade}
                      onChange={(e) => setNewBrigade(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="brigade-section">Section</label>
                    <select
                      id="brigade-section"
                      value={brigadeSection}
                      onChange={(e) => setBrigadeSection(e.target.value)}
                    >
                      <option value="FIA">Fianarantsoa</option>
                      <option value="MAN">Manakara</option>
                    </select>
                  </div>
                  <button className="btn-sm primary" style={{ padding: '8px 18px' }} onClick={handleAddBrigade}>
                    ➕ Ajouter
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Code</th>
                        <th>Section</th>
                        <th>Chef</th>
                        <th>Agents</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Base Opérationnelle d'Attente</strong></td>
                        <td>BOA</td>
                        <td>Fianarantsoa</td>
                        <td>Rakoto J.</td>
                        <td>12</td>
                        <td className="actions-cell">
                          <button className="btn-sm outline" onClick={() => handleEditBrigade('BOA')}>✏️</button>
                          <button className="btn-sm danger" onClick={() => handleDeleteBrigade('BOA')}>🗑️</button>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Brigade Régionale Fianarantsoa</strong></td>
                        <td>BR FI</td>
                        <td>Fianarantsoa</td>
                        <td>Razafy L.</td>
                        <td>18</td>
                        <td className="actions-cell">
                          <button className="btn-sm outline" onClick={() => handleEditBrigade('BR FI')}>✏️</button>
                          <button className="btn-sm danger" onClick={() => handleDeleteBrigade('BR FI')}>🗑️</button>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Brigade Régionale Andovoka</strong></td>
                        <td>BR ADV</td>
                        <td>Manakara</td>
                        <td>—</td>
                        <td>8</td>
                        <td className="actions-cell">
                          <button className="btn-sm outline" onClick={() => handleEditBrigade('BR ADV')}>✏️</button>
                          <button className="btn-sm danger" onClick={() => handleDeleteBrigade('BR ADV')}>🗑️</button>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Brigade Régionale Talata</strong></td>
                        <td>BR TLG</td>
                        <td>Manakara</td>
                        <td>—</td>
                        <td>6</td>
                        <td className="actions-cell">
                          <button className="btn-sm outline" onClick={() => handleEditBrigade('BR TLG')}>✏️</button>
                          <button className="btn-sm danger" onClick={() => handleDeleteBrigade('BR TLG')}>🗑️</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </>
  );
};

export default ServiceUsers;