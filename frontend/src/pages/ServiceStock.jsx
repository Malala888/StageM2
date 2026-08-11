import React, { useState } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let stockCache = null;
let stockCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchStockData() {
  const now = Date.now();
  if (stockCache && now - stockCacheTime < CACHE_TTL_MS) {
    return stockCache;
  }

  const [
    { data: userData },
    { data: materielsData },
    { data: stockData },
    { data: brigadesData },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/materiaux/materiels/'),
    api.get('/materiaux/stock/'),
    api.get('/personnel/brigades/'),
  ]);

  const result = {
    user: userData,
    materiels: materielsData,
    stock: stockData,
    brigades: brigadesData,
  };
  stockCache = result;
  stockCacheTime = now;
  return result;
}

export async function serviceStockLoader() {
  return fetchStockData();
}

export function ServiceStockError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement du stock:', error);
  return (
    <div className="stock-body">
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

const ServiceStock = () => {
  const { user, materiels, stock, brigades } = useLoaderData();

  // ─── Modal Approvisionner ───
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalForm, setModalForm] = useState({ materielId: null, materielNom: '', quantite: 1, etat: 'NEUF', brigade: '' });

  // ─── Calculer le stock par état ───
  const stockParEtat = stock.reduce((acc, item) => {
    acc[item.etat] = (acc[item.etat] || 0) + item.quantite;
    return acc;
  }, {});

  // États possibles
  const etats = ['NEUF', 'BON', 'MOYEN', 'MAUVAIS', 'HORS_SERVICE'];
  const etatsLabels = {
    NEUF: 'NEUF',
    BON: 'BON',
    MOYEN: 'MOYEN',
    MAUVAIS: 'MAUVAIS',
    HORS_SERVICE: 'HORS_SERVICE',
  };
  const etatsColors = {
    NEUF: 'neuf',
    BON: 'bon',
    MOYEN: 'moyen',
    MAUVAIS: 'mauvais',
    HORS_SERVICE: 'hs',
  };

  // ─── Calculer les alertes de stock bas ───
  const getStockTotal = (materielId) => {
    return stock
      .filter(s => s.materiel === materielId)
      .reduce((acc, s) => acc + s.quantite, 0);
  };

  // Retrouve le(s) nom(s) de brigade réellement concernée(s) par le stock bas d'un matériel
  // (les lignes de "stock" sont censées porter un champ brigade — cf. backend à confirmer)
  const getBrigadesConcernees = (materielId) => {
    const brigadeIds = [...new Set(
      stock.filter(s => s.materiel === materielId && s.brigade != null).map(s => s.brigade)
    )];
    if (brigadeIds.length === 0) return 'Toutes brigades';
    return brigadeIds
      .map(id => brigades.find(b => b.id === id)?.nom || `#${id}`)
      .join(', ');
  };

  const alertes = materiels
    .map(m => {
      const total = getStockTotal(m.id);
      const seuil = m.seuil_alerte || 5;
      return { ...m, total, seuil, brigadeNom: getBrigadesConcernees(m.id) };
    })
    .filter(m => m.total < m.seuil) // stock bas, y compris les ruptures totales (total === 0)
    .sort((a, b) => a.total - b.total);

  // ─── Gérer l'approvisionnement ───
  const openApproModal = (materielId, nom) => {
    setModalError('');
    setModalForm({
      materielId,
      materielNom: nom,
      quantite: 1,
      etat: 'NEUF',
      brigade: user?.role === 'ADMIN' ? '' : (user?.brigade || ''),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (modalSaving) return;
    setModalOpen(false);
  };

  const handleApproSubmit = async (e) => {
    e.preventDefault();
    const quantite = parseInt(modalForm.quantite);
    if (!quantite || quantite <= 0) {
      setModalError('La quantité doit être un nombre positif.');
      return;
    }
    setModalSaving(true);
    setModalError('');

    try {
      await api.post('/materiaux/mouvements/', {
        type: 'APPROVISIONNEMENT',
        materiel: modalForm.materielId,
        quantite,
        etat: modalForm.etat,
        date_mouvement: new Date().toISOString().split('T')[0],
        brigade: modalForm.brigade ? parseInt(modalForm.brigade) : null,
        commentaire: `Approvisionnement de ${quantite} ${modalForm.materielNom} en état ${modalForm.etat}`,
      });
      setModalOpen(false);
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de l\'approvisionnement.';
      setModalError(msg);
    } finally {
      setModalSaving(false);
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

        .stock-body {
          font-family: 'Inter', sans-serif;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
          color: #0f172a;
          min-height: 100vh;
        }

        .stock-body::before {
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

        .stock-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stock-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid rgba(255,255,255,0.5);
          text-align: center;
          transition: transform 0.15s;
        }
        .stock-card:hover { transform: translateY(-2px); }
        .stock-card .count { font-size: 2rem; font-weight: 700; color: #0f172a; }
        .stock-card .label { font-size: 0.7rem; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.05em; margin-top: 2px; }
        .stock-card .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-bottom: 4px; }
        .stock-card .dot.neuf { background: #22c55e; }
        .stock-card .dot.bon { background: #3b82f6; }
        .stock-card .dot.moyen { background: #eab308; }
        .stock-card .dot.mauvais { background: #f97316; }
        .stock-card .dot.hs { background: #ef4444; }

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
          .stock-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .stock-grid { grid-template-columns: 1fr; }
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

      <div className="stock-body">
        <div className="app">

          <Sidebar />

          <main className="main">

            <div className="page-header">
              <div>
                <h1>État du Stock</h1>
                <div className="sub">Vue globale par état et localisation</div>
              </div>
              <div className="user-badge">
                <div className="avatar">{user?.nom ? user.nom[0] : 'AD'}</div>
                <div>
                  <div className="name">{user?.nom || 'Admin'}</div>
                  <div className="role">{user?.role || '—'}</div>
                </div>
              </div>
            </div>

            {/* ─── Stock par état ─── */}
            <div className="stock-grid">
              {etats.map(etat => (
                <div className="stock-card" key={etat}>
                  <div className={`dot ${etatsColors[etat]}`}></div>
                  <div className="count">{stockParEtat[etat] || 0}</div>
                  <div className="label">{etatsLabels[etat]}</div>
                </div>
              ))}
            </div>

            {/* ─── Alertes stock bas ─── */}
            <div className="card">
              <h3>⚠️ Alertes stock bas</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Matériel</th>
                      <th>Stock actuel</th>
                      <th>Seuil</th>
                      <th>Brigade</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertes.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>✅ Aucune alerte de stock bas</td></tr>
                    ) : (
                      alertes.map(m => (
                        <tr key={m.id}>
                          <td><strong>{m.nom}</strong></td>
                          <td>{m.total}</td>
                          <td>{m.seuil}</td>
                          <td>{m.brigadeNom}</td>
                          <td>
                            <button
                              className="btn-sm primary"
                              onClick={() => openApproModal(m.id, m.nom)}
                            >
                              Approvisionner
                            </button>
                          </td>
                        </tr>
                      ))
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
              <h3>📦 Approvisionner "{modalForm.materielNom}"</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleApproSubmit}>
              <div className="modal-body">
                {modalError && <div className="modal-error">{modalError}</div>}
                <div className="modal-field">
                  <label htmlFor="modal-quantite">Quantité *</label>
                  <input
                    id="modal-quantite"
                    type="number"
                    min="1"
                    value={modalForm.quantite}
                    onChange={(e) => setModalForm({ ...modalForm, quantite: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="modal-etat">État *</label>
                  <select
                    id="modal-etat"
                    value={modalForm.etat}
                    onChange={(e) => setModalForm({ ...modalForm, etat: e.target.value })}
                  >
                    <option value="NEUF">NEUF</option>
                    <option value="BON">BON</option>
                    <option value="MOYEN">MOYEN</option>
                    <option value="MAUVAIS">MAUVAIS</option>
                    <option value="HORS_SERVICE">HORS_SERVICE</option>
                  </select>
                </div>
                {user?.role === 'ADMIN' && (
                  <div className="modal-field">
                    <label htmlFor="modal-brigade">Brigade destinataire</label>
                    <select
                      id="modal-brigade"
                      value={modalForm.brigade}
                      onChange={(e) => setModalForm({ ...modalForm, brigade: e.target.value })}
                    >
                      <option value="">Dépôt central</option>
                      {brigades.map(b => (
                        <option key={b.id} value={b.id}>{b.nom}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn-save" disabled={modalSaving}>
                  {modalSaving ? 'Enregistrement...' : 'Approvisionner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceStock;