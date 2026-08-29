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

  // Filtrer par brigade du chef de brigade (repli sur Brigade.chef_brigade si
  // user.brigade n'est pas renseigné, cohérent avec _get_user_brigade côté backend)
  const brigadeId = userData.brigade || brigadesData.find(b => b.chef_brigade === userData.id)?.id || null;
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

  // ─── Modal : modifier un utilisateur ───
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalSaving, setUserModalSaving] = useState(false);
  const [userModalError, setUserModalError] = useState('');
  const [userModalForm, setUserModalForm] = useState({ id: null, nom: '', prenom: '', email: '' });

  // Reproduit côté frontend les règles hiérarchiques du backend (_user_can_validate) :
  // un Chef de Brigade ne gère que les GL/CN de sa propre brigade.
  const canManage = (target) => {
    if (!user) return false;
    if (target.id === user.id) return true;
    if (!brigade?.id) return false;
    return ['GL', 'CN'].includes(target.role) && target.brigade === brigade.id;
  };

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

  const openEditUserModal = (u) => {
    setUserModalError('');
    setUserModalForm({ id: u.id, nom: u.nom, prenom: u.prenom, email: u.email });
    setUserModalOpen(true);
  };

  const closeUserModal = () => {
    if (userModalSaving) return;
    setUserModalOpen(false);
  };

  const handleUserModalSubmit = async (e) => {
    e.preventDefault();
    if (!userModalForm.nom.trim() || !userModalForm.prenom.trim() || !userModalForm.email.trim()) {
      setUserModalError('Tous les champs sont obligatoires.');
      return;
    }
    setUserModalSaving(true);
    setUserModalError('');
    try {
      await api.patch(`/accounts/users/${userModalForm.id}/`, {
        nom: userModalForm.nom.trim(),
        prenom: userModalForm.prenom.trim(),
        email: userModalForm.email.trim(),
      });
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.error
        || (err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de la modification');
      setUserModalError(msg);
      setUserModalSaving(false);
    }
  };

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    try {
      await api.delete(`/accounts/users/${id}/`);
      alert('✅ Utilisateur supprimé');
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur lors de la suppression';
      alert(`❌ ${msg}`);
      console.error(err);
    }
  };

  const handleValidate = async (id, nom) => {
    try {
      await api.patch(`/accounts/users/${id}/valider/`);
      alert(`✅ ${nom} validé avec succès`);
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur lors de la validation';
      alert(`❌ ${msg}`);
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
      const msg = err.response?.data?.error || 'Erreur lors du rejet';
      alert(`❌ ${msg}`);
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

        /* ─── Modal ─── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .modal-card {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 460px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0,0,0,0.25);
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid #e2e8f0;
        }
        .modal-header h3 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
        .modal-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          color: #64748b;
          cursor: pointer;
          line-height: 1;
          padding: 4px;
        }
        .modal-close:hover { color: #0f172a; }
        .modal-body { padding: 20px 22px; }
        .modal-field { margin-bottom: 14px; }
        .modal-field label { display: block; font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 6px; }
        .modal-field input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
          box-sizing: border-box;
        }
        .modal-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.82rem;
          margin-bottom: 14px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 22px;
          border-top: 1px solid #e2e8f0;
        }
        .modal-footer button { padding: 9px 18px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; }
        .modal-footer .btn-cancel { background: #f1f5f9; color: #334155; }
        .modal-footer .btn-cancel:hover { background: #e2e8f0; }
        .modal-footer .btn-save { background: #2563eb; color: #fff; }
        .modal-footer .btn-save:hover { background: #1d4ed8; }
        .modal-footer .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
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
                <span></span>
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
                              {u.statut === 'EN_ATTENTE' && canManage(u) && (
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
                              )}
                              {u.statut !== 'EN_ATTENTE' && canManage(u) && (
                                <select
                                  className="status-select"
                                  defaultValue={u.statut}
                                  onChange={async (e) => {
                                    try {
                                      await api.patch(`/accounts/users/${u.id}/`, { statut: e.target.value });
                                      alert('✅ Statut mis à jour');
                                      window.location.reload();
                                    } catch (err) {
                                      const msg = err.response?.data?.error || 'Erreur lors de la mise à jour';
                                      alert(`❌ ${msg}`);
                                    }
                                  }}
                                >
                                  <option value="ACTIF">ACTIF</option>
                                  <option value="SUSPENDU">SUSPENDU</option>
                                  <option value="ARCHIVE">ARCHIVE</option>
                                </select>
                              )}
                              {canManage(u) && (
                                <>
                                  <button className="btn-sm outline" onClick={() => openEditUserModal(u)}>✏️</button>
                                  <button className="btn-sm danger" onClick={() => handleDelete(u.id, `${u.nom} ${u.prenom}`)}>🗑️</button>
                                </>
                              )}
                              {!canManage(u) && u.id !== user?.id && (
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
                              )}
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

      {userModalOpen && (
        <div className="modal-overlay" onClick={closeUserModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Modifier l'agent</h3>
              <button className="modal-close" onClick={closeUserModal}>✕</button>
            </div>
            <form onSubmit={handleUserModalSubmit}>
              <div className="modal-body">
                {userModalError && <div className="modal-error">{userModalError}</div>}
                <div className="modal-field">
                  <label htmlFor="um-nom">Nom *</label>
                  <input id="um-nom" type="text" value={userModalForm.nom}
                    onChange={(e) => setUserModalForm({ ...userModalForm, nom: e.target.value })} required />
                </div>
                <div className="modal-field">
                  <label htmlFor="um-prenom">Prénom *</label>
                  <input id="um-prenom" type="text" value={userModalForm.prenom}
                    onChange={(e) => setUserModalForm({ ...userModalForm, prenom: e.target.value })} required />
                </div>
                <div className="modal-field">
                  <label htmlFor="um-email">Email *</label>
                  <input id="um-email" type="email" value={userModalForm.email}
                    onChange={(e) => setUserModalForm({ ...userModalForm, email: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeUserModal}>Annuler</button>
                <button type="submit" className="btn-save" disabled={userModalSaving}>
                  {userModalSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BrigadeUsers;