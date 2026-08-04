import React, { useState, useEffect, useRef } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import BrigadeSidebar from '../components/BrigadeSidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let brigadeMouvementsCache = null;
let brigadeMouvementsCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchBrigadeMouvementsData() {
  const now = Date.now();
  if (brigadeMouvementsCache && now - brigadeMouvementsCacheTime < CACHE_TTL_MS) {
    return brigadeMouvementsCache;
  }

  const [
    { data: userData },
    { data: materielsData },
    { data: usersData },
    { data: mouvementsData },
    { data: brigades },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/materiaux/materiels/'),
    api.get('/accounts/users/'),
    api.get('/materiaux/mouvements/'),
    api.get('/personnel/brigades/'),
  ]);

  // Filtrer les agents (GL et CN) pour le formulaire
  const agents = usersData.filter(u => u.role === 'GL' || u.role === 'CN');

  // Filtrer les mouvements par brigade du chef
  const brigadeId = userData.brigade;
  const mouvementsBrigade = mouvementsData.filter(m => m.brigade === brigadeId);

  // Récupérer le nom de la brigade du chef (user.brigade n'est qu'un ID renvoyé par l'API)
  const brigadeObj = brigades.find(b => b.id === brigadeId);
  const brigadeName = brigadeObj?.nom || 'N/A';

  const result = {
    user: userData,
    materiels: materielsData,
    agents,
    mouvements: mouvementsBrigade,
    brigadeName,
  };

  brigadeMouvementsCache = result;
  brigadeMouvementsCacheTime = now;
  return result;
}

// ─── Loader ───
export async function brigadeMouvementsLoader() {
  return fetchBrigadeMouvementsData();
}

// ─── ErrorElement ───
export function BrigadeMouvementsError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement des mouvements:', error);
  return (
    <div className="mouvements-body">
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

// ─── Composant principal ───
const BrigadeMouvements = () => {
  const { user, materiels, agents, mouvements: initialMouvements, brigadeName } = useLoaderData();

  // ─── États pour le formulaire ───
  const [type, setType] = useState('');
  const [materiel, setMateriel] = useState('');
  const [agent, setAgent] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [date, setDate] = useState('');
  const [commentaire, setCommentaire] = useState('');

  // ─── États pour les filtres ───
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filteredMouvements, setFilteredMouvements] = useState(initialMouvements);

  // ─── États pour la soumission ───
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ─── Référence pour le champ date ───
  const dateInputRef = useRef(null);

  // ─── Initialiser la date du jour ───
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    if (dateInputRef.current) {
      dateInputRef.current.value = today;
    }
  }, []);

  // ─── Appliquer les filtres ───
  useEffect(() => {
    let result = initialMouvements;

    if (searchTerm.trim()) {
      result = result.filter(m =>
        (m.materiel?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.agent_concerner?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.agent_concerner?.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.numero.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType) {
      result = result.filter(m => m.type === filterType);
    }

    if (filterDate) {
      result = result.filter(m => m.date_mouvement === filterDate);
    }

    setFilteredMouvements(result);
  }, [searchTerm, filterType, filterDate, initialMouvements]);

  // ─── Handlers ───
  const handleFilter = (e) => {
    e.preventDefault();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterDate('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    if (!type || !materiel || !quantite || !date) {
      setSubmitError('Veuillez remplir tous les champs obligatoires.');
      setSubmitting(false);
      return;
    }

    const payload = {
      type,
      materiel: parseInt(materiel),
      quantite,
      date_mouvement: date,
      brigade: user.brigade, // La brigade du chef
      commentaire: commentaire || '',
    };

    if (agent) {
      payload.agent_concerner = parseInt(agent);
    }

    try {
      await api.post('/materiaux/mouvements/', payload);
      alert('✅ Mouvement enregistré avec succès !');
      setType('');
      setMateriel('');
      setAgent('');
      setQuantite(1);
      setCommentaire('');

      // Recharger les mouvements de la brigade
      const { data: newMouvements } = await api.get('/materiaux/mouvements/');
      const brigadeId = user.brigade;
      setFilteredMouvements(newMouvements.filter(m => m.brigade === brigadeId));
    } catch (err) {
      console.error(err);
      setSubmitError('Erreur lors de l\'enregistrement du mouvement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetail = (numero) => {
    alert(`📄 Détail du mouvement : ${numero}`);
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

        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

        .mouvements-body {
          font-family: 'Inter', sans-serif;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
          color: #0f172a;
          min-height: 100vh;
        }

        .mouvements-body::before {
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
          margin-bottom: 16px;
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

        .type-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .type-badge.appro { background: #dbeafe; color: #2563eb; }
        .type-badge.emprunt { background: #fef3c7; color: #d97706; }
        .type-badge.retour { background: #dcfce7; color: #16a34a; }
        .type-badge.transfert { background: #e0e7ff; color: #4f46e5; }
        .type-badge.reparation { background: #fce4ec; color: #dc2626; }
        .type-badge.rebut { background: #fee2e2; color: #b91c1c; }

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

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }
        .form-row .field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-row .field label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
        }
        .form-row .field input, .form-row .field select {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: rgba(255,255,255,0.7);
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-row .field input:focus, .form-row .field select:focus {
          border-color: #2563eb;
        }

        .submit-error {
          color: #dc2626;
          font-size: 0.85rem;
          margin-top: 8px;
        }

        @media (max-width: 1024px) {
          .main { margin-left: 200px; padding: 20px 24px; }
        }
        @media (max-width: 768px) {
          .main { margin-left: 0; padding: 16px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="mouvements-body">
        <div className="app">
          <BrigadeSidebar />

          <main className="main">
            <div className="page-header">
              <div>
                <h1>Mouvements</h1>
                <div className="sub">
                  Enregistrer et consulter l'historique — Brigade <span className="brigade-badge">{brigadeName}</span>
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

            {/* ─── Formulaire d'enregistrement ─── */}
            <div className="card">
              <h3>📝 Nouveau mouvement</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="type">Type de mouvement *</label>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="APPROVISIONNEMENT">📦 APPROVISIONNEMENT</option>
                      <option value="EMPRUNT">📤 EMPRUNT</option>
                      <option value="RETOUR">📥 RETOUR</option>
                      <option value="TRANSFERT">🔄 TRANSFERT</option>
                      <option value="REPARATION">🔧 RÉPARATION</option>
                      <option value="REBUT">🗑️ REBUT</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="materiel">Matériel *</label>
                    <select
                      id="materiel"
                      value={materiel}
                      onChange={(e) => setMateriel(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner</option>
                      {materiels.map(m => (
                        <option key={m.id} value={m.id}>{m.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="agent">Agent concerné</label>
                    <select
                      id="agent"
                      value={agent}
                      onChange={(e) => setAgent(e.target.value)}
                    >
                      <option value="">Sélectionner</option>
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.nom} {a.prenom} ({a.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="quantite">Quantité *</label>
                    <input
                      type="number"
                      id="quantite"
                      value={quantite}
                      onChange={(e) => setQuantite(parseInt(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="date">Date *</label>
                    <input
                      type="date"
                      id="date"
                      ref={dateInputRef}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="commentaire">Commentaire (optionnel)</label>
                    <input
                      type="text"
                      id="commentaire"
                      placeholder="Motif, remarque..."
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                    />
                  </div>
                </div>
                {submitError && <div className="submit-error">{submitError}</div>}
                <button
                  type="submit"
                  className="btn-sm primary"
                  style={{ padding: '10px 24px', fontSize: '0.85rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Enregistrement...' : '✅ Enregistrer le mouvement'}
                </button>
              </form>
            </div>

            {/* ─── Historique ─── */}
            <div className="card">
              <h3>📋 Historique des mouvements ({filteredMouvements.length})</h3>
              <div className="filters">
                <input
                  type="text"
                  placeholder="🔍 Rechercher (n°, matériel, agent)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Tous les types</option>
                  <option value="APPROVISIONNEMENT">APPROVISIONNEMENT</option>
                  <option value="EMPRUNT">EMPRUNT</option>
                  <option value="RETOUR">RETOUR</option>
                  <option value="TRANSFERT">TRANSFERT</option>
                  <option value="REPARATION">RÉPARATION</option>
                  <option value="REBUT">REBUT</option>
                </select>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                <button
                  className="btn-sm primary"
                  style={{ padding: '8px 20px' }}
                  onClick={handleFilter}
                >
                  Filtrer
                </button>
                <button
                  className="btn-sm outline"
                  style={{ padding: '8px 20px' }}
                  onClick={handleResetFilters}
                >
                  Réinitialiser
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Matériel</th>
                      <th>Type</th>
                      <th>Agent</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMouvements.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          Aucun mouvement trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredMouvements.map((m) => {
                        const typeClass = {
                          'APPROVISIONNEMENT': 'appro',
                          'EMPRUNT': 'emprunt',
                          'RETOUR': 'retour',
                          'TRANSFERT': 'transfert',
                          'REPARATION': 'reparation',
                          'REBUT': 'rebut',
                        }[m.type] || '';

                        const statutClass = {
                          'EN_COURS': 'yellow',
                          'RETOURNE': 'green',
                          'EN_RETARD': 'red',
                          'PERDU': 'red',
                          'ANNULE': 'gray',
                        }[m.statut] || 'gray';

                        return (
                          <tr key={m.id}>
                            <td><strong>{m.numero}</strong></td>
                            <td>{m.materiel?.nom || 'N/A'}</td>
                            <td><span className={`type-badge ${typeClass}`}>{m.type}</span></td>
                            <td>{m.agent_concerner ? `${m.agent_concerner.nom} ${m.agent_concerner.prenom}` : '—'}</td>
                            <td>{new Date(m.date_mouvement).toLocaleDateString('fr-FR')}</td>
                            <td><span className={`badge ${statutClass}`}>{m.statut}</span></td>
                            <td className="actions-cell">
                              <button className="btn-sm outline" onClick={() => handleDetail(m.numero)}>📄 Détail</button>
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
    </>
  );
};

export default BrigadeMouvements;