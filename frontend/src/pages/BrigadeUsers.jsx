import React, { useState, useEffect } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import BrigadeSidebar from '../components/BrigadeSidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let brigadeUsersCache = null;
let brigadeUsersCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchBrigadeUsersData() {
  const now = Date.now();
  if (brigadeUsersCache && now - brigadeUsersCacheTime < CACHE_TTL_MS) {
    return brigadeUsersCache;
  }

  const [
    { data: userData },
    { data: usersData },
    { data: brigadesData },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/accounts/users/'),
    api.get('/personnel/brigades/'),
  ]);

  // Filtrer par brigade du chef de brigade
  const brigadeId = userData.brigade;
  const usersBrigade = usersData.filter(u => u.brigade === brigadeId);
  const currentBrigade = brigadesData.find(b => b.id === brigadeId) || null;

  const result = {
    user: userData,
    users: usersBrigade,
    brigade: currentBrigade,
  };

  brigadeUsersCache = result;
  brigadeUsersCacheTime = now;
  return result;
}

// ─── Loader ───
export async function brigadeUsersLoader() {
  return fetchBrigadeUsersData();
}

// ─── ErrorElement ───
export function BrigadeUsersError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement des utilisateurs de la brigade:', error);
  return (
    <div className="users-body">
      <div className="app">
        <BrigadeSidebar />
        <main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
          <h2 style={{ color: 'red' }}>Erreur</h2>
          <p>Impossible de charger les données de la brigade. Veuillez réessayer.</p>
          <button className="btn-sm primary" onClick={() => window.location.reload()}>Réessayer</button>
        </main>
      </div>
    </div>
  );
}

// ─── Composant principal ───
const BrigadeUsers = () => {
  const { user, users, brigade } = useLoaderData();

  // ─── États pour les filtres ───
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);

  // ─── Appliquer les filtres ───
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

    if (statusFilter) {
      result = result.filter(u => u.statut === statusFilter);
    }

    setFilteredUsers(result);
  }, [searchTerm, roleFilter, statusFilter, users]);

  // ─── Handlers ───
  const handleFilter = (e) => {
    e.preventDefault();
  };

  const handleReset = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
  };

  const handleAddUser = () => {
    alert('➕ Ajouter un nouvel agent dans la brigade');
  };

  const handleEdit = (nom) => {
    alert(`✏️ Modifier : ${nom}`);
  };

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    try {
      await api.delete(`/accounts/users/${id}/`);
      alert('✅ Utilisateur supprimé');
      window.location.reload();
    } catch (err) {
      alert('❌ Erreur lors de la suppression');
      console.error(err);
    }
  };

  const handleValidate = async (id, nom) => {
    try {
      await api.patch(`/accounts/users/${id}/valider/`);
      alert(`✅ ${nom} validé avec succès`);
      window.location.reload();
    } catch (err) {
      alert('❌ Erreur lors de la validation');
      console.error(err);
    }
  };

  const handleReject = async (id, nom) => {
    if (!confirm(`Rejeter ${nom} ?`)) return;
    try {
      await api.patch(`/accounts/users/${id}/rejeter/`);
      alert(`❌ ${nom} rejeté`);
      window.location.reload();
    } catch (err) {
      alert('❌ Erreur lors du rejet');
      console.error(err);
    }
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
          display: block;
          min-height: 100vh;
        }

        .main {
          margin-left: 240px;
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

        .filters {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filters input, .filters select {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid rgba(203, 213, 225, 0.8);
          background: rgba(255, 255, 255, 0.8);
          font-size: 0.85rem;
          outline: none;
        }
        .filters input:focus, .filters select:focus {
          border-color: #2563eb;
          background: #fff;
        }

        .btn-sm {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-sm.primary { background: #2563eb; color: #fff; }
        .btn-sm.primary:hover { background: #1d4ed8; }
        .btn-sm.success { background: #10b981; color: #fff; }
        .btn-sm.success:hover { background: #059669; }
        .btn-sm.danger { background: #ef4444; color: #fff; }
        .btn-sm.danger:hover { background: #dc2626; }
        .btn-sm.outline { background: transparent; border: 1px solid #cbd5e1; color: #475569; }
        .btn-sm.outline:hover { background: rgba(0,0,0,0.03); }

        .table-wrap { overflow-x: auto; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        table th {
          text-align: left;
          padding: 10px 14px;
          color: #475569;
          font-weight: 600;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        }
        table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          color: #0f172a;
        }
        table tr:hover td {
          background: rgba(255, 255, 255, 0.4);
        }

        .badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .badge.blue { background: #dbeafe; color: #2563eb; }
        .badge.green { background: #dcfce7; color: #16a34a; }
        .badge.yellow { background: #fef9c3; color: #ca8a04; }
        .badge.red { background: #fee2e2; color: #dc2626; }
        .badge.gray { background: #f1f5f9; color: #64748b; }

        .actions-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-select {
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          font-size: 0.75rem;
          background: #fff;
          cursor: pointer;
        }
      `}</style>

      <div className="users-body">
        <div className="app">
          <BrigadeSidebar />
          <main className="main">
            <div className="page-header">
              <div>
                <h1>Gestion des Utilisateurs de la Brigade</h1>
                <div className="sub">
                  Brigade : <span className="brigade-badge">{brigade ? brigade.nom : 'Chargement...'}</span>
                </div>
              </div>
              <div className="user-badge">
                <div className="avatar">
                  {user.prenom ? user.prenom.charAt(0) : 'U'}
                </div>
                <div>
                  <div className="name">{user.prenom} {user.nom}</div>
                  <div className="role">Chef de Brigade</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>
                <span>Liste des agents de la brigade ({filteredUsers.length})</span>
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
                  <option value="">Rôle / Poste</option>
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
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          Aucun utilisateur trouvé pour cette brigade
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const roleClass = {
                          'GL': 'blue',
                          'CN': 'blue',
                        }[u.role] || 'gray';

                        const statusClass = {
                          'ACTIF': 'green',
                          'EN_ATTENTE': 'yellow',
                          'SUSPENDU': 'red',
                          'ARCHIVE': 'gray',
                          'REJETE': 'red',
                        }[u.statut]  || 'gray';

                        return (
                          <tr key={u.id}>
                            <td><strong>{u.nom} {u.prenom}</strong></td>
                            <td>{u.email}</td>
                            <td><span className={`badge ${roleClass}`}>{u.role}</span></td>
                            <td><span className={`badge ${statusClass}`}>{u.statut}</span></td>
                            <td className="actions-cell">
                              {u.statut === 'EN_ATTENTE' ? (
                                <>
                                  <button
                                    className="btn-sm success"
                                    onClick={() => handleValidate(u.id, `${u.nom} ${u.prenom}`)}
                                  >
                                    Valider
                                  </button>
                                  <button
                                    className="btn-sm danger"
                                    onClick={() => handleReject(u.id, `${u.nom} ${u.prenom}`)}
                                  >
                                    Rejeter
                                  </button>
                                </>
                              ) : (
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
                              <button className="btn-sm outline" onClick={() => handleEdit(`${u.nom} ${u.prenom}`)}>✏️</button>
                              <button className="btn-sm danger" onClick={() => handleDelete(u.id, `${u.nom} ${u.prenom}`)}>🗑️</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#475569', background: '#f1f5f9', padding: '8px 14px', borderRadius: '8px' }}>
                ℹ️ Les comptes en attente de votre brigade peuvent être validés ou rejetés directement ici par vous (Chef de Brigade).
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default BrigadeUsers;