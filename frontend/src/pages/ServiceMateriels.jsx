import React, { useState, useEffect } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let materielsCache = null;
let materielsCacheTime = 0;
const CACHE_TTL_MS = 15000; // 15s : au-delà, on recharge

async function fetchMaterielsData() {
  const now = Date.now();
  if (materielsCache && now - materielsCacheTime < CACHE_TTL_MS) {
    return materielsCache;
  }

  const [
    { data: userData },
    { data: materielsData },
    { data: stockData },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/materiaux/materiels/'),
    api.get('/materiaux/stock/'),
  ]);

  const result = { user: userData, materiels: materielsData, stockData };
  materielsCache = result;
  materielsCacheTime = now;
  return result;
}

// ─── Loader (appelé par React Router) ───
export async function serviceMaterielsLoader() {
  return fetchMaterielsData();
}

// ─── ErrorElement ───
export function ServiceMaterielsError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement des matériels:', error);
  return (
    <div className="materiels-body">
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
const ServiceMateriels = () => {
  const { user, materiels: initialMateriels, stockData } = useLoaderData();

  const [materiels, setMateriels] = useState(initialMateriels);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorie, setCategorie] = useState('');
  const [etat, setEtat] = useState('');
  const [filteredMateriels, setFilteredMateriels] = useState(initialMateriels);

  // ─── Modal Ajouter / Modifier un matériel ───
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalForm, setModalForm] = useState({ id: null, nom: '', categorie: '', seuil_alerte: 5, description: '' });

  // Appliquer les filtres
  useEffect(() => {
    let result = materiels;

    if (searchTerm.trim()) {
      result = result.filter(m => 
        m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.categorie.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categorie) {
      result = result.filter(m => m.categorie === categorie);
    }

    if (etat) {
      result = result.filter(m => getEtatPrincipal(m.id) === etat);
    }

    setFilteredMateriels(result);
  }, [searchTerm, categorie, etat, materiels]);

  // Obtenir la quantité totale d'un matériel
  const getQuantiteTotale = (materielId) => {
    return stockData
      .filter(s => s.materiel === materielId)
      .reduce((acc, s) => acc + s.quantite, 0);
  };

  // Obtenir l'état principal d'un matériel (celui avec le plus de quantité)
  const getEtatPrincipal = (materielId) => {
    const stocks = stockData.filter(s => s.materiel === materielId);
    if (stocks.length === 0) return 'BON';
    const sorted = stocks.sort((a, b) => b.quantite - a.quantite);
    return sorted[0].etat;
  };

  // Obtenir le statut du stock (basé sur le seuil)
  const getStockStatut = (materiel) => {
    const total = getQuantiteTotale(materiel.id);
    if (total === 0) return { label: '⚠️ Hors stock', class: 'low' };
    if (total <= materiel.seuil_alerte) return { label: '⚠️ Stock bas', class: 'low' };
    if (total <= materiel.seuil_alerte * 2) return { label: '⚠️ Seuil atteint', class: 'medium' };
    return { label: '✅ OK', class: 'high' };
  };

  // ─── Handlers ───
  const handleFilter = (e) => {
    e.preventDefault();
  };

  const handleReset = () => {
    setSearchTerm('');
    setCategorie('');
    setEtat('');
  };

  const openAddModal = () => {
    setModalMode('add');
    setModalError('');
    setModalForm({ id: null, nom: '', categorie: '', seuil_alerte: 5, description: '' });
    setModalOpen(true);
  };

  const openEditModal = (m) => {
    setModalMode('edit');
    setModalError('');
    setModalForm({
      id: m.id,
      nom: m.nom,
      categorie: m.categorie,
      seuil_alerte: m.seuil_alerte ?? 5,
      description: m.description || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (modalSaving) return;
    setModalOpen(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.nom.trim() || !modalForm.categorie.trim()) {
      setModalError('Le nom et la catégorie sont obligatoires.');
      return;
    }
    setModalSaving(true);
    setModalError('');

    const payload = {
      nom: modalForm.nom.trim(),
      categorie: modalForm.categorie.trim(),
      seuil_alerte: parseInt(modalForm.seuil_alerte) || 5,
      description: modalForm.description.trim(),
    };

    try {
      if (modalMode === 'add') {
        const { data } = await api.post('/materiaux/materiels/', payload);
        setMateriels(prev => [...prev, data]);
      } else {
        const { data } = await api.patch(`/materiaux/materiels/${modalForm.id}/`, payload);
        setMateriels(prev => prev.map(m => m.id === modalForm.id ? data : m));
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de l\'enregistrement.';
      setModalError(msg);
    } finally {
      setModalSaving(false);
    }
  };

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    
    try {
      await api.delete(`/materiaux/materiels/${id}/`);
      const updated = materiels.filter(m => m.id !== id);
      setMateriels(updated);
      setFilteredMateriels(updated.filter(m => {
        let result = true;
        if (searchTerm.trim()) {
          result = m.nom.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (categorie) {
          result = result && m.categorie === categorie;
        }
        return result;
      }));
      alert('✅ Matériel supprimé avec succès !');
    } catch (err) {
      alert('❌ Erreur lors de la suppression');
      console.error(err);
    }
  };

  // ─── Rendu ───
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

        .materiels-body {
          font-family: 'Inter', sans-serif;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
          color: #0f172a;
          min-height: 100vh;
        }

        .materiels-body::before {
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

        .stock-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .stock-badge.low { background: #fee2e2; color: #dc2626; }
        .stock-badge.medium { background: #fef9c3; color: #ca8a04; }
        .stock-badge.high { background: #dcfce7; color: #16a34a; }

        .actions-cell {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
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
        }

        /* ─── Modal ─── */
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPopIn {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          animation: modalFadeIn 0.15s ease-out;
        }
        .modal-card {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 460px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.04);
          animation: modalPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 22px 24px 18px;
          border-bottom: 1px solid #f1f5f9;
        }
        .modal-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #2563eb;
        }
        .modal-icon svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .modal-header-text { flex: 1; padding-top: 2px; }
        .modal-header h3 { font-size: 1.02rem; font-weight: 700; color: #0f172a; margin: 0; }
        .modal-subtitle { font-size: 0.78rem; color: #94a3b8; margin-top: 3px; line-height: 1.4; }
        .modal-close {
          background: #f8fafc;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }
        .modal-close:hover { background: #e2e8f0; color: #0f172a; }
        .modal-body { padding: 22px 24px 4px; }
        .modal-field { margin-bottom: 16px; }
        .modal-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .modal-field label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 7px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .modal-field label .optional-tag {
          font-size: 0.68rem;
          font-weight: 500;
          text-transform: none;
          letter-spacing: 0;
          color: #cbd5e1;
        }
        .modal-field input,
        .modal-field select,
        .modal-field textarea {
          width: 100%;
          padding: 10px 13px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.9rem;
          font-family: inherit;
          color: #0f172a;
          background: #fafbfc;
          box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .modal-field input::placeholder,
        .modal-field textarea::placeholder { color: #cbd5e1; }
        .modal-field input:hover,
        .modal-field select:hover,
        .modal-field textarea:hover { border-color: #cbd5e1; }
        .modal-field input:focus,
        .modal-field select:focus,
        .modal-field textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          background: #ffffff;
        }
        .modal-field textarea { resize: vertical; min-height: 60px; line-height: 1.5; }
        .modal-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 10px 13px;
          font-size: 0.8rem;
          line-height: 1.45;
          margin-bottom: 16px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 18px 24px 22px;
        }
        .modal-footer button {
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: background 0.15s, transform 0.1s;
        }
        .modal-footer button:active { transform: scale(0.97); }
        .modal-footer .btn-cancel { background: #f1f5f9; color: #475569; }
        .modal-footer .btn-cancel:hover { background: #e2e8f0; }
        .modal-footer .btn-save { background: #2563eb; color: #fff; box-shadow: 0 1px 2px rgba(37, 99, 235, 0.3); }
        .modal-footer .btn-save:hover { background: #1d4ed8; }
        .modal-footer .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="materiels-body">
        <div className="app">

          <Sidebar />

          <main className="main">

            <div className="page-header">
              <div>
                <h1>Catalogue Matériels</h1>
                <div className="sub">Gestion du stock et des références</div>
              </div>
              <div className="user-badge">
                <div className="avatar">{user?.nom ? user.nom[0] : 'AD'}</div>
                <div>
                  <div className="name">{user?.nom || 'Admin'}</div>
                  <div className="role">{user?.role || '—'}</div>
                </div>
              </div>
            </div>

            {/* Filtres */}
            <div className="filters">
              <input
                type="text"
                placeholder="🔍 Rechercher un matériel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
                <option value="">Catégorie</option>
                <option value="Outillage">Outillage</option>
                <option value="Électrique">Électrique</option>
                <option value="Transport">Transport</option>
                <option value="BTP">BTP</option>
              </select>
              <select value={etat} onChange={(e) => setEtat(e.target.value)}>
                <option value="">État</option>
                <option value="NEUF">NEUF</option>
                <option value="BON">BON</option>
                <option value="MOYEN">MOYEN</option>
                <option value="MAUVAIS">MAUVAIS</option>
                <option value="HORS_SERVICE">HORS_SERVICE</option>
              </select>
              <button className="btn-sm primary" style={{ padding: '8px 20px' }} onClick={handleFilter}>
                Filtrer
              </button>
              <button className="btn-sm outline" style={{ padding: '8px 20px' }} onClick={handleReset}>
                Réinitialiser
              </button>
              <button
                className="btn-sm success"
                style={{ padding: '8px 20px', marginLeft: 'auto' }}
                onClick={openAddModal}
              >
                + Ajouter un matériel
              </button>
            </div>

            {/* Tableau */}
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Catégorie</th>
                      <th>Quantité</th>
                      <th>État</th>
                      <th>Seuil</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMateriels.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          Aucun matériel trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredMateriels.map((m) => {
                        const total = getQuantiteTotale(m.id);
                        const etatPrincipal = getEtatPrincipal(m.id);
                        const stockStatut = getStockStatut(m);
                        return (
                          <tr key={m.id}>
                            <td><strong>{m.nom}</strong></td>
                            <td>{m.categorie}</td>
                            <td>{total}</td>
                            <td>
                              <span className={`badge ${etatPrincipal === 'NEUF' ? 'green' : etatPrincipal === 'BON' ? 'green' : etatPrincipal === 'MOYEN' ? 'yellow' : etatPrincipal === 'MAUVAIS' ? 'red' : 'red'}`}>
                                {etatPrincipal}
                              </span>
                            </td>
                            <td>
                              <span className={`stock-badge ${stockStatut.class}`}>
                                {stockStatut.label}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button 
                                className="btn-sm outline" 
                                onClick={() => openEditModal(m)}
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn-sm danger" 
                                onClick={() => handleDelete(m.id, m.nom)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
              </div>
              <div className="modal-header-text">
                <h3>{modalMode === 'add' ? 'Nouveau matériel' : 'Modifier le matériel'}</h3>
                <div className="modal-subtitle">
                  {modalMode === 'add' ? 'Ajouter un type d\'équipement au catalogue' : 'Mettre à jour les informations de ce type d\'équipement'}
                </div>
              </div>
              <button className="modal-close" onClick={closeModal} aria-label="Fermer">✕</button>
            </div>
            <form onSubmit={handleModalSubmit}>
              <div className="modal-body">
                {modalError && <div className="modal-error">{modalError}</div>}

                <div className="modal-field">
                  <label htmlFor="modal-nom">Nom</label>
                  <input
                    id="modal-nom"
                    type="text"
                    placeholder="Ex : Casque de chantier"
                    value={modalForm.nom}
                    onChange={(e) => setModalForm({ ...modalForm, nom: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-field-row">
                  <div className="modal-field">
                    <label htmlFor="modal-categorie">Catégorie</label>
                    <input
                      id="modal-categorie"
                      type="text"
                      placeholder="Ex : Protection"
                      value={modalForm.categorie}
                      onChange={(e) => setModalForm({ ...modalForm, categorie: e.target.value })}
                      required
                    />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="modal-seuil">Seuil d'alerte</label>
                    <input
                      id="modal-seuil"
                      type="number"
                      min="0"
                      value={modalForm.seuil_alerte}
                      onChange={(e) => setModalForm({ ...modalForm, seuil_alerte: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-field">
                  <label htmlFor="modal-description">Description <span className="optional-tag">(optionnel)</span></label>
                  <textarea
                    id="modal-description"
                    placeholder="Notes, spécifications techniques..."
                    value={modalForm.description}
                    onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn-save" disabled={modalSaving}>
                  {modalSaving ? 'Enregistrement...' : (modalMode === 'add' ? 'Ajouter' : 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceMateriels;