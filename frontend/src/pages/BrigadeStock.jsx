import React, { useState, useEffect } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import BrigadeSidebar from '../components/BrigadeSidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let brigadeStockCache = null;
let brigadeStockCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchBrigadeStockData() {
  const now = Date.now();
  if (brigadeStockCache && now - brigadeStockCacheTime < CACHE_TTL_MS) {
    return brigadeStockCache;
  }

  const [
    { data: userData },
    { data: materielsData },
    { data: stockData },
    { data: mouvementsData },
    { data: brigades },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/materiaux/materiels/'),
    api.get('/materiaux/stock/'),
    api.get('/materiaux/mouvements/'),
    api.get('/personnel/brigades/'),
  ]);

  // Récupérer la brigade du chef (repli sur Brigade.chef_brigade si user.brigade n'est pas
  // renseigné, cohérent avec _get_user_brigade côté backend)
  const brigadeId = userData.brigade || brigades.find(b => b.chef_brigade === userData.id)?.id || null;

  // Récupérer le nom de la brigade du chef (user.brigade n'est qu'un ID renvoyé par l'API)
  const brigadeObj = brigades.find(b => b.id === brigadeId);
  const brigadeName = brigadeObj?.nom || 'N/A';

  // stockData est déjà scopé par le backend à cette brigade (+ dépôt central) pour un
  // Chef de Brigade : pas besoin de le refiltrer, ni de passer par l'historique des mouvements.
  const stockParEtat = stockData.reduce((acc, item) => {
    acc[item.etat] = (acc[item.etat] || 0) + item.quantite;
    return acc;
  }, {});

  const quantitesParMateriel = {};
  stockData.forEach(s => {
    if (!quantitesParMateriel[s.materiel]) quantitesParMateriel[s.materiel] = 0;
    quantitesParMateriel[s.materiel] += s.quantite;
  });

  // Matériels visibles dans le stock de cette brigade (y compris dépôt central)
  const materielIdsVisibles = [...new Set(stockData.map(s => s.materiel))];
  const materielsBrigade = materielsData.filter(m => materielIdsVisibles.includes(m.id));

  // Alertes de stock bas, y compris les ruptures totales (total === 0)
  const alertes = materielsBrigade
    .map(m => ({
      ...m,
      total: quantitesParMateriel[m.id] || 0,
    }))
    .filter(m => m.total <= m.seuil_alerte)
    .sort((a, b) => a.total - b.total);

  const result = {
    user: userData,
    stockParEtat,
    alertes,
    brigadeId,
    brigadeName,
  };

  brigadeStockCache = result;
  brigadeStockCacheTime = now;
  return result;
}

export async function brigadeStockLoader() {
  return fetchBrigadeStockData();
}

export function BrigadeStockError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement du stock:', error);
  return (
    <div className="stock-body">
      <div className="app">
        <BrigadeSidebar />
        <main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
          <h2 style={{ color: 'red' }}>Erreur</h2>
          <p>Impossible de charger les données. Veuillez réessayer.</p>
          <button className="btn-sm primary" onClick={() => window.location.reload()}>Réessayer</button>
        </main>
      </div>
    </div>
  );
}

const BrigadeStock = () => {
  const { user, stockParEtat, alertes, brigadeId, brigadeName } = useLoaderData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAlertes, setFilteredAlertes] = useState(alertes);

  // ─── Modal Approvisionner ───
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalForm, setModalForm] = useState({ materielId: null, materielNom: '', quantite: 1, etat: 'NEUF' });

  useEffect(() => {
    let result = alertes;
    if (searchTerm.trim()) {
      result = result.filter(m =>
        m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.categorie.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredAlertes(result);
  }, [searchTerm, alertes]);

  const openApproModal = (materielId, nom) => {
    setModalError('');
    setModalForm({ materielId, materielNom: nom, quantite: 1, etat: 'NEUF' });
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
        // La brigade est de toute façon forcée côté serveur à la brigade du chef connecté.
        brigade: brigadeId,
        commentaire: `Approvisionnement de ${quantite} ${modalForm.materielNom} en état ${modalForm.etat}`,
      });
      setModalOpen(false);
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.error || (err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de l\'approvisionnement.');
      setModalError(msg);
    } finally {
      setModalSaving(false);
    }
  };

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

        .filters {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .filters input {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: rgba(255,255,255,0.6);
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .filters input:focus {
          border-color: #2563eb;
        }

        @media (max-width: 1024px) {
          .main { margin-left: 200px; padding: 20px 24px; }
        }
        @media (max-width: 768px) {
          .main { margin-left: 0; padding: 16px; }
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
          <BrigadeSidebar />

          <main className="main">
            <div className="page-header">
              <div>
                <h1>État du Stock</h1>
                <div className="sub">
                  Vue globale par état — Brigade <span className="brigade-badge">{brigadeName}</span>
                </div>
              </div>
              <div className="user-badge">
                <div className="avatar">{user?.nom ? user.nom[0] : 'CB'}</div>
                <div>
                  <div className="name">{user?.nom || 'Chef'}</div>
                  <div className="role">Chef de Brigade</div>
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
              <h3>⚠️ Alertes stock bas ({filteredAlertes.length})</h3>
              <div className="filters">
                <input
                  type="text"
                  placeholder="🔍 Rechercher un matériel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className="btn-sm outline"
                  style={{ padding: '8px 20px' }}
                  onClick={() => setSearchTerm('')}
                >
                  Réinitialiser
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Matériel</th>
                      <th>Catégorie</th>
                      <th>Stock actuel</th>
                      <th>Seuil</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlertes.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          ✅ Aucune alerte stock bas
                        </td>
                      </tr>
                    ) : (
                      filteredAlertes.map(m => (
                        <tr key={m.id}>
                          <td><strong>{m.nom}</strong></td>
                          <td>{m.categorie}</td>
                          <td>{m.total}</td>
                          <td>{m.seuil_alerte}</td>
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
                <div className="modal-field">
                  <label>Brigade destinataire</label>
                  <input type="text" value={brigadeName} disabled />
                </div>
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

export default BrigadeStock;