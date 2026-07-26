import React, { useState, useEffect } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let usersCache = null;
let usersCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchUsersData() {
  const now = Date.now();
  if (usersCache && now - usersCacheTime < CACHE_TTL_MS) {
    return usersCache;
  }

  const [
    { data: userData },
    { data: usersData },
    { data: sectionsData },
    { data: brigadesData },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/accounts/users/'),
    api.get('/personnel/sections/'),
    api.get('/personnel/brigades/'),
  ]);

  // Calcul des statistiques (nombre d'agents par brigade/section)
  const brigadesWithCount = brigadesData.map(b => ({
    ...b,
    agents: usersData.filter(u => u.brigade === b.id).length,
  }));

  const sectionsWithCount = sectionsData.map(s => ({
    ...s,
    brigades: brigadesData.filter(b => b.section === s.id).length,
    agents: usersData.filter(u => u.section === s.id).length,
  }));

  const result = {
    user: userData,
    users: usersData,
    sections: sectionsWithCount,
    brigades: brigadesWithCount,
  };

  usersCache = result;
  usersCacheTime = now;
  return result;
}

// ─── Loader ───
export async function serviceUsersLoader() {
  return fetchUsersData();
}

// ─── ErrorElement ───
export function ServiceUsersError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement des utilisateurs:', error);
  return (
    <div className="users-body">
      <div className="app">
        <Sidebar />
        <main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
          <h2 style={{ color: 'red' }}>Erreur</h2>
          <p>Impossible de charger les données. Veuillez réessayer.</p>
          <button className="btn-sm primary" onClick={() => window.location.reload()}>Réessayer</button>
        </main>
      </div>
    </div>
  );
}

// ─── Composant principal ───
const ServiceUsers = () => {
  const { user, users, sections, brigades } = useLoaderData();

  // ─── États pour les filtres ───
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [brigadeFilter, setBrigadeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);

  // ─── États pour les onglets ───
  const [activeTab, setActiveTab] = useState('users');

  // ─── États pour les formulaires ───
  const [newSection, setNewSection] = useState('');
  const [newBrigade, setNewBrigade] = useState('');
  const [brigadeSection, setBrigadeSection] = useState('');

  // Appliquer les filtres
  useEffect(() => {
    let result = users;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u =>
        u.nom.toLowerCase().includes(term) ||
        u.prenom.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }

    if (roleFilter) {
      result = result.filter(u => u.role === roleFilter);
    }

    if (brigadeFilter) {
      result = result.filter(u => u.brigade === parseInt(brigadeFilter));
    }

    if (statusFilter) {
      result = result.filter(u => u.statut === statusFilter);
    }

    setFilteredUsers(result);
  }, [searchTerm, roleFilter, brigadeFilter, statusFilter, users]);

  // ─── Handlers ───
  const handleFilter = (e) => {
    e.preventDefault();
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

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    try {
      await api.delete(`/accounts/users/${id}/`);
      alert('✅ Utilisateur supprimé');
      // Recharger les données (on pourrait rafraîchir le cache)
      window.location.reload();
    } catch (err) {
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleValidate = async (id, nom) => {
    try {
      await api.patch(`/accounts/users/${id}/valider/`);
      alert(`✅ ${nom} validé avec succès`);
      window.location.reload();
    } catch (err) {
      alert('❌ Erreur lors de la validation');
    }
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
      alert(`➕ Brigade ajoutée : ${newBrigade} (Section: ${brigadeSection || 'Non spécifiée'})`);
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

  // Trouver la section d'une brigade
  const getSectionName = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.nom : 'N/A';
  };

  // Rendu
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
                <div className="avatar">{user?.nom ? user.nom[0] : 'AD'}</div>
                <div>
                  <div className="name">{user?.nom || 'Admin'}</div>
                  <div className="role">Chef Service</div>
                </div>
              </div>
            </div>

            {/* ─── Liste des utilisateurs ─── */}
            <div className="card">
              <h3>
                👥 Comptes utilisateurs ({filteredUsers.length})
                <span>
                  <button className="btn-sm success" style={{ padding: '8px 16px' }} onClick={handleAddUser}>
                    + Nouvel utilisateur
                  </button>
                </span>
              </h3>

              <div className="filters">
                <input
                  type="text"
                  placeholder="🔍 Rechercher (nom, prénom, email)..."
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
                  {brigades.map(b => (
                    <option key={b.id} value={b.id}>{b.nom}</option>
                  ))}
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
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          Aucun utilisateur trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const roleClass = {
                          'ADMIN': 'red',
                          'CHEF_SECTION': 'blue',
                          'CHEF_BRIGADE': 'blue',
                          'GL': 'blue',
                          'CN': 'blue',
                        }[u.role] || 'gray';

                        const statusClass = {
                          'ACTIF': 'green',
                          'EN_ATTENTE': 'yellow',
                          'SUSPENDU': 'red',
                          'ARCHIVE': 'gray',
                          'REJETE': 'red',
                        }[u.statut] || 'gray';

                        const brigadeName = brigades.find(b => b.id === u.brigade)?.nom || 'N/A';

                        return (
                          <tr key={u.id}>
                            <td><strong>{u.nom} {u.prenom}</strong></td>
                            <td>{u.email}</td>
                            <td><span className={`badge ${roleClass}`}>{u.role}</span></td>
                            <td>{brigadeName}</td>
                            <td><span className={`badge ${statusClass}`}>{u.statut}</span></td>
                            <td className="actions-cell">
                              {u.statut === 'EN_ATTENTE' && (
                                <>
                                  <button className="btn-sm success" onClick={() => handleValidate(u.id, `${u.nom} ${u.prenom}`)}>Valider</button>
                                  <button className="btn-sm danger" onClick={() => handleReject(`${u.nom} ${u.prenom}`)}>Rejeter</button>
                                </>
                              )}
                              <button className="btn-sm outline" onClick={() => handleEdit(`${u.nom} ${u.prenom}`)}>✏️</button>
                              <button className="btn-sm danger" onClick={() => handleDelete(u.id, `${u.nom} ${u.prenom}`)}>🗑️</button>
                              {u.statut !== 'EN_ATTENTE' && (
                                <select
                                  className="status-select"
                                  defaultValue={u.statut}
                                  onChange={async (e) => {
                                    try {
                                      await api.patch(`/accounts/users/${u.id}/`, { statut: e.target.value });
                                      alert('✅ Statut mis à jour');
                                      window.location.reload();
                                    } catch (err) {
                                      alert('❌ Erreur lors de la mise à jour');
                                    }
                                  }}
                                >
                                  <option value="ACTIF">ACTIF</option>
                                  <option value="SUSPENDU">SUSPENDU</option>
                                  <option value="ARCHIVE">ARCHIVE</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
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
                      {sections.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8' }}>Aucune section</td></tr>
                      ) : (
                        sections.map((s) => (
                          <tr key={s.id}>
                            <td><strong>{s.nom}</strong></td>
                            <td>{s.code}</td>
                            <td>{s.brigades || 0}</td>
                            <td>{s.agents || 0}</td>
                            <td className="actions-cell">
                              <button className="btn-sm outline" onClick={() => handleEditSection(s.nom)}>✏️</button>
                              <button className="btn-sm danger" onClick={() => handleDeleteSection(s.nom)}>🗑️</button>
                            </td>
                          </tr>
                        ))
                      )}
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
                      <option value="">Sélectionner</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.id}>{s.nom}</option>
                      ))}
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
                        <th>Agents</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brigades.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8' }}>Aucune brigade</td></tr>
                      ) : (
                        brigades.map((b) => (
                          <tr key={b.id}>
                            <td><strong>{b.nom}</strong></td>
                            <td>{b.code}</td>
                            <td>{getSectionName(b.section)}</td>
                            <td>{b.agents || 0}</td>
                            <td className="actions-cell">
                              <button className="btn-sm outline" onClick={() => handleEditBrigade(b.nom)}>✏️</button>
                              <button className="btn-sm danger" onClick={() => handleDeleteBrigade(b.nom)}>🗑️</button>
                            </td>
                          </tr>
                        ))
                      )}
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