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

  // ─── Modal : modifier un utilisateur ───
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalSaving, setUserModalSaving] = useState(false);
  const [userModalError, setUserModalError] = useState('');
  const [userModalForm, setUserModalForm] = useState({ id: null, nom: '', prenom: '', email: '' });

  // ─── Modal : ajouter / modifier une section ───
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [sectionModalMode, setSectionModalMode] = useState('add');
  const [sectionModalSaving, setSectionModalSaving] = useState(false);
  const [sectionModalError, setSectionModalError] = useState('');
  const [sectionModalForm, setSectionModalForm] = useState({ id: null, nom: '', code: '' });

  // ─── Modal : ajouter / modifier une brigade ───
  const [brigadeModalOpen, setBrigadeModalOpen] = useState(false);
  const [brigadeModalMode, setBrigadeModalMode] = useState('add');
  const [brigadeModalSaving, setBrigadeModalSaving] = useState(false);
  const [brigadeModalError, setBrigadeModalError] = useState('');
  const [brigadeModalForm, setBrigadeModalForm] = useState({ id: null, nom: '', code: '', section: '' });

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

  // ─── Reproduit côté frontend les règles hiérarchiques du backend (_user_can_validate) ───
  // pour cacher les boutons Modifier/Supprimer/Valider/Rejeter quand l'action serait de
  // toute façon refusée par le serveur (Chef Service → Chef Section → Chef Brigade → GL/CN).
  const getUserBrigadeId = () => {
    if (user?.brigade) return user.brigade;
    const b = brigades.find(br => br.chef_brigade === user?.id);
    return b ? b.id : null;
  };

  const canManage = (target) => {
    if (!user) return false;
    if (target.id === user.id) return true;
    if (user.role === 'ADMIN') return target.role === 'CHEF_SECTION';
    if (user.role === 'CHEF_SECTION') {
      return target.role === 'CHEF_BRIGADE' && !!user.section && target.section === user.section;
    }
    if (user.role === 'CHEF_BRIGADE') {
      const brigadeId = getUserBrigadeId();
      return ['GL', 'CN'].includes(target.role) && !!brigadeId && target.brigade === brigadeId;
    }
    return false;
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
    if (!(await window.appConfirm(`Supprimer "${nom}" ?`))) return;
    try {
      await api.delete(`/accounts/users/${id}/`);
      alert('✅ Utilisateur supprimé');
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.error || 'Vous n\'avez peut-être pas les droits sur ce compte (seul le supérieur hiérarchique direct peut agir).';
      alert(`❌ Erreur lors de la suppression : ${msg}`);
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
    }
  };

  const handleReject = async (id, nom) => {
    if (!(await window.appConfirm(`Rejeter ${nom} ?`))) return;
    try {
      await api.patch(`/accounts/users/${id}/rejeter/`);
      alert(`❌ ${nom} rejeté`);
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur lors du rejet';
      alert(`❌ ${msg}`);
    }
  };

  // ─── Modal Section (ajout / modification) ───
  const openAddSectionModal = () => {
    setSectionModalMode('add');
    setSectionModalError('');
    setSectionModalForm({ id: null, nom: '', code: '' });
    setSectionModalOpen(true);
  };

  const openEditSectionModal = (s) => {
    setSectionModalMode('edit');
    setSectionModalError('');
    setSectionModalForm({ id: s.id, nom: s.nom, code: s.code });
    setSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    if (sectionModalSaving) return;
    setSectionModalOpen(false);
  };

  const handleSectionModalSubmit = async (e) => {
    e.preventDefault();
    if (!sectionModalForm.nom.trim() || !sectionModalForm.code.trim()) {
      setSectionModalError('Le nom et le code sont obligatoires.');
      return;
    }
    setSectionModalSaving(true);
    setSectionModalError('');
    const payload = { nom: sectionModalForm.nom.trim(), code: sectionModalForm.code.trim().toUpperCase() };
    try {
      if (sectionModalMode === 'add') {
        await api.post('/personnel/sections/', payload);
      } else {
        await api.patch(`/personnel/sections/${sectionModalForm.id}/`, payload);
      }
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de l\'enregistrement';
      setSectionModalError(msg);
      setSectionModalSaving(false);
    }
  };

  const handleDeleteSection = async (s) => {
    if (!(await window.appConfirm(`Supprimer la section "${s.nom}" ?`))) return;
    try {
      await api.delete(`/personnel/sections/${s.id}/`);
      alert('✅ Section supprimée');
      window.location.reload();
    } catch (err) {
      // Brigade a une FK RESTRICT vers Section : ça échoue tant que des brigades y sont rattachées
      alert('❌ Impossible de supprimer : des brigades sont encore rattachées à cette section.');
    }
  };

  // ─── Modal Brigade (ajout / modification) ───
  const openAddBrigadeModal = () => {
    setBrigadeModalMode('add');
    setBrigadeModalError('');
    setBrigadeModalForm({ id: null, nom: '', code: '', section: '' });
    setBrigadeModalOpen(true);
  };

  const openEditBrigadeModal = (b) => {
    setBrigadeModalMode('edit');
    setBrigadeModalError('');
    setBrigadeModalForm({ id: b.id, nom: b.nom, code: b.code, section: b.section || '' });
    setBrigadeModalOpen(true);
  };

  const closeBrigadeModal = () => {
    if (brigadeModalSaving) return;
    setBrigadeModalOpen(false);
  };

  const handleBrigadeModalSubmit = async (e) => {
    e.preventDefault();
    if (!brigadeModalForm.nom.trim() || !brigadeModalForm.code.trim() || !brigadeModalForm.section) {
      setBrigadeModalError('Le nom, le code et la section sont obligatoires.');
      return;
    }
    setBrigadeModalSaving(true);
    setBrigadeModalError('');
    const payload = {
      nom: brigadeModalForm.nom.trim(),
      code: brigadeModalForm.code.trim().toUpperCase(),
      section: parseInt(brigadeModalForm.section),
    };
    try {
      if (brigadeModalMode === 'add') {
        await api.post('/personnel/brigades/', payload);
      } else {
        await api.patch(`/personnel/brigades/${brigadeModalForm.id}/`, payload);
      }
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de l\'enregistrement';
      setBrigadeModalError(msg);
      setBrigadeModalSaving(false);
    }
  };

  const handleDeleteBrigade = async (b) => {
    if (!(await window.appConfirm(`Supprimer la brigade "${b.nom}" ?`))) return;
    try {
      await api.delete(`/personnel/brigades/${b.id}/`);
      alert('✅ Brigade supprimée');
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de la suppression';
      alert(`❌ ${msg}`);
    }
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
          max-width: 480px;
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
        .modal-field input,
        .modal-field select {
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
                  <div className="role">{user?.role || '—'}</div>
                </div>
              </div>
            </div>

            {/* ─── Liste des utilisateurs ─── */}
            <div className="card">
              <h3>
                👥 Comptes utilisateurs ({filteredUsers.length})
                <span></span>
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
                              {u.statut === 'EN_ATTENTE' && canManage(u) && (
                                <>
                                  <button className="btn-sm success" onClick={() => handleValidate(u.id, `${u.nom} ${u.prenom}`)}>Valider</button>
                                  <button className="btn-sm danger" onClick={() => handleReject(u.id, `${u.nom} ${u.prenom}`)}>Rejeter</button>
                                </>
                              )}
                              {canManage(u) && (
                                <>
                                  <button className="btn-sm danger" onClick={() => handleDelete(u.id, `${u.nom} ${u.prenom}`)}>🗑️</button>
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
                                      alert('❌ Erreur lors de la mise à jour');
                                    }
                                  }}
                                >
                                  <option value="ACTIF">ACTIF</option>
                                  <option value="SUSPENDU">SUSPENDU</option>
                                  <option value="ARCHIVE">ARCHIVE</option>
                                </select>
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
                  <button className="btn-sm primary" style={{ padding: '8px 18px' }} onClick={openAddSectionModal}>
                    ➕ Nouvelle section
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
                              <button className="btn-sm outline" onClick={() => openEditSectionModal(s)}>✏️</button>
                              <button className="btn-sm danger" onClick={() => handleDeleteSection(s)}>🗑️</button>
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
                  <button className="btn-sm primary" style={{ padding: '8px 18px' }} onClick={openAddBrigadeModal}>
                    ➕ Nouvelle brigade
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
                              <button className="btn-sm outline" onClick={() => openEditBrigadeModal(b)}>✏️</button>
                              <button className="btn-sm danger" onClick={() => handleDeleteBrigade(b)}>🗑️</button>
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

      {/* ─── Modal : modifier un utilisateur ─── */}
      {userModalOpen && (
        <div className="modal-overlay" onClick={closeUserModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Modifier l'utilisateur</h3>
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

      {/* ─── Modal : ajouter / modifier une section ─── */}
      {sectionModalOpen && (
        <div className="modal-overlay" onClick={closeSectionModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{sectionModalMode === 'add' ? '➕ Nouvelle section' : '✏️ Modifier la section'}</h3>
              <button className="modal-close" onClick={closeSectionModal}>✕</button>
            </div>
            <form onSubmit={handleSectionModalSubmit}>
              <div className="modal-body">
                {sectionModalError && <div className="modal-error">{sectionModalError}</div>}
                <div className="modal-field">
                  <label htmlFor="sm-nom">Nom *</label>
                  <input id="sm-nom" type="text" placeholder="Ex: Fianarantsoa" value={sectionModalForm.nom}
                    onChange={(e) => setSectionModalForm({ ...sectionModalForm, nom: e.target.value })} required />
                </div>
                <div className="modal-field">
                  <label htmlFor="sm-code">Code *</label>
                  <input id="sm-code" type="text" placeholder="Ex: FIA" value={sectionModalForm.code}
                    onChange={(e) => setSectionModalForm({ ...sectionModalForm, code: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeSectionModal}>Annuler</button>
                <button type="submit" className="btn-save" disabled={sectionModalSaving}>
                  {sectionModalSaving ? 'Enregistrement...' : (sectionModalMode === 'add' ? 'Ajouter' : 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal : ajouter / modifier une brigade ─── */}
      {brigadeModalOpen && (
        <div className="modal-overlay" onClick={closeBrigadeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{brigadeModalMode === 'add' ? '➕ Nouvelle brigade' : '✏️ Modifier la brigade'}</h3>
              <button className="modal-close" onClick={closeBrigadeModal}>✕</button>
            </div>
            <form onSubmit={handleBrigadeModalSubmit}>
              <div className="modal-body">
                {brigadeModalError && <div className="modal-error">{brigadeModalError}</div>}
                <div className="modal-field">
                  <label htmlFor="bm-nom">Nom *</label>
                  <input id="bm-nom" type="text" placeholder="Ex: BOA" value={brigadeModalForm.nom}
                    onChange={(e) => setBrigadeModalForm({ ...brigadeModalForm, nom: e.target.value })} required />
                </div>
                <div className="modal-field">
                  <label htmlFor="bm-code">Code *</label>
                  <input id="bm-code" type="text" placeholder="Ex: BOA" value={brigadeModalForm.code}
                    onChange={(e) => setBrigadeModalForm({ ...brigadeModalForm, code: e.target.value })} required />
                </div>
                <div className="modal-field">
                  <label htmlFor="bm-section">Section *</label>
                  <select id="bm-section" value={brigadeModalForm.section}
                    onChange={(e) => setBrigadeModalForm({ ...brigadeModalForm, section: e.target.value })} required>
                    <option value="">Sélectionner</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeBrigadeModal}>Annuler</button>
                <button type="submit" className="btn-save" disabled={brigadeModalSaving}>
                  {brigadeModalSaving ? 'Enregistrement...' : (brigadeModalMode === 'add' ? 'Ajouter' : 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceUsers;