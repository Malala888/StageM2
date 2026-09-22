import React, { useState, useEffect } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import CNSidebar from '../components/CNSidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let cnMaterielsCache = null;
let cnMaterielsCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchCNMaterielsData() {
  const now = Date.now();
  if (cnMaterielsCache && now - cnMaterielsCacheTime < CACHE_TTL_MS) {
    return cnMaterielsCache;
  }

  const [
    { data: userData },
    { data: mouvementsData },
    { data: materielsData },
    { data: brigadesData },
    { data: stockData },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/materiaux/mouvements/'),
    api.get('/materiaux/materiels/'),
    api.get('/personnel/brigades/'),
    api.get('/materiaux/stock/'), // déjà scopé par le backend à la brigade du CN + dépôt central
  ]);

  // Enrichir l'utilisateur avec l'objet brigade
  const brigade = brigadesData.find(b => b.id === userData.brigade) || null;
  const user = { ...userData, brigade };

  // ─── Matériel disponible : quantité en stock par matériel ───
  // Remarque : ce total n'est pas décompté des emprunts en cours d'autres agents
  // (le CN ne voit que son propre historique), c'est donc une quantité "en stock"
  // plutôt qu'un solde disponible garanti en temps réel.
  const quantitesParMateriel = {};
  stockData.forEach(s => {
    quantitesParMateriel[s.materiel] = (quantitesParMateriel[s.materiel] || 0) + s.quantite;
  });
  const materielIdsVisibles = [...new Set(stockData.map(s => s.materiel))];
  const materielsDisponibles = materielsData
    .filter(m => materielIdsVisibles.includes(m.id))
    .map(m => ({ ...m, quantiteStock: quantitesParMateriel[m.id] || 0 }));

  // ─── Mes emprunts / demandes ───
  const mesMouvements = mouvementsData.filter(m => m.agent_concerner === userData.id && m.type === 'EMPRUNT');
  const materielsAssignes = mesMouvements
    .filter(m => ['EN_COURS', 'EN_RETARD'].includes(m.statut))
    .map(m => {
      const mat = materielsData.find(mat => mat.id === m.materiel);
      return mat ? {
        ...mat,
        etat: m.etat,
        quantite: m.quantite,
        mouvement_id: m.id,
        date_emprunt: m.date_mouvement,
        date_retour_prevue: m.date_retour_prevue,
        statut_mouvement: m.statut,
      } : null;
    })
    .filter(Boolean);
  const mesDemandes = mesMouvements.filter(m => m.statut === 'DEMANDE');

  const result = {
    user,
    materiels: materielsDisponibles,
    materielsAssignes,
    mesDemandes,
  };

  cnMaterielsCache = result;
  cnMaterielsCacheTime = now;
  return result;
}

// ─── Loader ───
export async function cnMaterielsLoader() {
  return fetchCNMaterielsData();
}

// ─── ErrorElement ───
export function CNMaterielsError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement des matériels CN:', error);
  return (
    <div className="materiels-body">
      <div className="app">
        <CNSidebar />
        <main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
          <h2 style={{ color: 'red' }}>Erreur</h2>
          <p>Impossible de charger vos matériels. Veuillez réessayer.</p>
          <button className="btn-sm primary" onClick={() => window.location.reload()}>Réessayer</button>
        </main>
      </div>
    </div>
  );
}

// ─── Composant principal ───
const CNMateriels = () => {
  const { user, materiels, materielsAssignes, mesDemandes } = useLoaderData();

  const [searchTerm, setSearchTerm] = useState('');
  const [categorie, setCategorie] = useState('');
  const [filteredMateriels, setFilteredMateriels] = useState(materiels);

  // ─── Modal Demander un emprunt ───
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalForm, setModalForm] = useState({ materielId: null, materielNom: '', quantite: 1, dateRetour: '', motif: '' });

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

    setFilteredMateriels(result);
  }, [searchTerm, categorie, materiels]);

  // ─── Handlers ───
  const handleFilter = (e) => {
    e.preventDefault();
  };

  const handleReset = () => {
    setSearchTerm('');
    setCategorie('');
  };

  const openDemandeModal = (materielId, nom) => {
    setModalError('');
    const dateParDefaut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setModalForm({ materielId, materielNom: nom, quantite: 1, dateRetour: dateParDefaut, motif: '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (modalSaving) return;
    setModalOpen(false);
  };

  const handleDemandeSubmit = async (e) => {
    e.preventDefault();
    const quantite = parseInt(modalForm.quantite);
    if (!quantite || quantite <= 0) {
      setModalError('La quantité doit être un nombre positif.');
      return;
    }
    if (!modalForm.dateRetour) {
      setModalError('La date de retour prévue est obligatoire.');
      return;
    }
    if (!modalForm.motif.trim()) {
      setModalError('Merci d\'indiquer un motif.');
      return;
    }
    setModalSaving(true);
    setModalError('');

    try {
      await api.post('/materiaux/mouvements/', {
        type: 'EMPRUNT',
        materiel: modalForm.materielId,
        quantite,
        date_mouvement: new Date().toISOString().split('T')[0],
        date_retour_prevue: modalForm.dateRetour,
        commentaire: modalForm.motif.trim(),
        // agent_concerner, brigade et statut (toujours DEMANDE) sont forcés côté serveur
      });
      setModalOpen(false);
      alert(`✅ Demande envoyée pour "${modalForm.materielNom}" — en attente de validation par votre Chef de Brigade.`);
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.error || (err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de la demande.');
      setModalError(msg);
      setModalSaving(false);
    }
  };

  const brigadeName = user?.brigade?.nom || 'N/A';

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

        .card {
          background: rgba(255, 255, 255, 0.70);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          padding: 20px 24px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          margin-bottom: 24px;
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
        .btn-sm.outline:disabled { opacity: 0.5; cursor: not-allowed; }

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

        @media (max-width: 1024px) {
          .main { margin-left: 200px; padding: 20px 24px; }
        }
        @media (max-width: 768px) {
          .main { margin-left: 0; padding: 16px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
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

      <div className="materiels-body">
        <div className="app">
          <CNSidebar />

          <main className="main">
            <div className="page-header">
              <div>
                <h1>Mes Matériels</h1>
                <div className="sub">
                  Matériels assignés à votre personne — <span className="role-badge">CN</span>
                </div>
              </div>
              <div className="user-badge">
                <div className="avatar">{user?.prenom ? user.prenom[0] : 'C'}</div>
                <div>
                  <div className="name">{user?.prenom || 'Cantonnier'} {user?.nom || ''}</div>
                  <div className="role">Cantonnier • {brigadeName}</div>
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
                <option value="Jardinage">Jardinage</option>
                <option value="Transport">Transport</option>
                <option value="BTP">BTP</option>
              </select>
              <button className="btn-sm primary" style={{ padding: '8px 20px' }} onClick={handleFilter}>
                Filtrer
              </button>
              <button className="btn-sm outline" style={{ padding: '8px 20px' }} onClick={handleReset}>
                Réinitialiser
              </button>
            </div>

            {/* Matériel disponible dans la brigade */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px' }}>📦 Matériel disponible — {brigadeName}</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Catégorie</th>
                      <th>Quantité en stock</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMateriels.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          Aucun matériel disponible dans votre brigade
                        </td>
                      </tr>
                    ) : (
                      filteredMateriels.map((m) => (
                        <tr key={m.id}>
                          <td><strong>{m.nom}</strong></td>
                          <td>{m.categorie}</td>
                          <td>{m.quantiteStock}</td>
                          <td className="actions-cell">
                            <button
                              className="btn-sm primary"
                              disabled={m.quantiteStock <= 0}
                              onClick={() => openDemandeModal(m.id, m.nom)}
                            >
                              {m.quantiteStock > 0 ? 'Demander' : 'Rupture'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '10px' }}>
                💡 Les quantités reflètent le stock de votre brigade, pas nécessairement en temps réel par rapport aux emprunts en cours des autres agents.
              </div>
            </div>

            {/* Mes demandes en attente */}
            {mesDemandes.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px' }}>⏳ Mes demandes en attente de validation</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>N°</th><th>Quantité</th><th>Date demande</th><th>Statut</th></tr>
                    </thead>
                    <tbody>
                      {mesDemandes.map(d => (
                        <tr key={d.id}>
                          <td><strong>{d.numero}</strong></td>
                          <td>{d.quantite}</td>
                          <td>{new Date(d.date_mouvement).toLocaleDateString('fr-FR')}</td>
                          <td><span className="badge yellow">En attente</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mes emprunts en cours */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px' }}>📋 Mes emprunts en cours</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Nom</th><th>État</th><th>Quantité</th><th>Statut</th></tr>
                  </thead>
                  <tbody>
                    {materielsAssignes.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Aucun matériel actuellement emprunté</td></tr>
                    ) : (
                      materielsAssignes.map((m) => (
                        <tr key={m.mouvement_id}>
                          <td><strong>{m.nom}</strong></td>
                          <td>
                            {m.etat ? (
                              <span className={`badge ${m.etat === 'NEUF' ? 'green' : m.etat === 'BON' ? 'green' : m.etat === 'MOYEN' ? 'yellow' : 'red'}`}>
                                {m.etat}
                              </span>
                            ) : '—'}
                          </td>
                          <td>{m.quantite}</td>
                          <td>
                            <span className={`badge ${m.statut_mouvement === 'EN_RETARD' ? 'red' : 'yellow'}`}>
                              {m.statut_mouvement === 'EN_RETARD' ? 'En retard' : 'En cours'}
                            </span>
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
              <h3>📤 Demander "{modalForm.materielNom}"</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleDemandeSubmit}>
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
                  <label htmlFor="modal-date-retour">Date de retour prévue *</label>
                  <input
                    id="modal-date-retour"
                    type="date"
                    value={modalForm.dateRetour}
                    onChange={(e) => setModalForm({ ...modalForm, dateRetour: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="modal-motif">Motif *</label>
                  <input
                    id="modal-motif"
                    type="text"
                    placeholder="Raison de l'emprunt..."
                    value={modalForm.motif}
                    onChange={(e) => setModalForm({ ...modalForm, motif: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn-save" disabled={modalSaving}>
                  {modalSaving ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CNMateriels;