import React, { useState, useEffect } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import SectionSidebar from '../components/SectionSidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let sectionStockCache = null;
let sectionStockCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchSectionStockData() {
  const now = Date.now();
  if (sectionStockCache && now - sectionStockCacheTime < CACHE_TTL_MS) {
    return sectionStockCache;
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

  // Filtrer les brigades de la section du chef
  const sectionId = userData.section;
  const brigadesSection = brigadesData.filter(b => b.section === sectionId);

  // Pour le stock total par état, on prend tout le stock (car les matériels ne sont pas directement liés à une section)
  // Mais on peut choisir de ne montrer que les matériels qui ont été approvisionnés dans les brigades de la section.
  // Pour simplifier, on garde tous les matériels, car le chef de section a une vue globale.
  // On garde le même calcul que ServiceStock : total par état.

  // On pourrait aussi filtrer par brigade, mais c'est plus complexe. On garde la vue globale.

  // Calcul du stock par état
  const stockParEtat = stockData.reduce((acc, item) => {
    acc[item.etat] = (acc[item.etat] || 0) + item.quantite;
    return acc;
  }, {});

  // Calcul des quantités totales par matériel
  const quantitesParMateriel = {};
  stockData.forEach(s => {
    if (!quantitesParMateriel[s.materiel]) quantitesParMateriel[s.materiel] = 0;
    quantitesParMateriel[s.materiel] += s.quantite;
  });

  // Construire les alertes (matériels dont le total est <= seuil)
  const alertes = materielsData
    .map(m => ({
      ...m,
      total: quantitesParMateriel[m.id] || 0,
    }))
    .filter(m => m.total > 0 && m.total <= m.seuil_alerte)
    .sort((a, b) => a.total - b.total);

  // Pour chaque alerte, on peut essayer de trouver la brigade correspondante (via le stock ? pas direct)
  // On affichera la brigade du chef ou une valeur par défaut.
  // Pour plus de précision, on pourrait lier un matériel à une brigade via les mouvements, mais on simplifie.

  const result = {
    user: userData,
    stockParEtat,
    alertes,
    materiels: materielsData,
    stockData,
    brigades: brigadesSection,
  };

  sectionStockCache = result;
  sectionStockCacheTime = now;
  return result;
}

// ─── Loader ───
export async function sectionStockLoader() {
  return fetchSectionStockData();
}

// ─── ErrorElement ───
export function SectionStockError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement du stock:', error);
  return (
    <div className="stock-body">
      <div className="app">
        <SectionSidebar />
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
const SectionStock = () => {
  const { user, stockParEtat, alertes, materiels, stockData, brigades } = useLoaderData();

  // ─── États pour les filtres ───
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAlertes, setFilteredAlertes] = useState(alertes);

  // Appliquer les filtres sur les alertes
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

  // ─── Gérer l'approvisionnement ───
  const handleApprovisionner = async (materielId, nom) => {
    const quantite = parseInt(prompt(`Quantité à approvisionner pour "${nom}" :`, '1'));
    if (!quantite || quantite <= 0) return;

    const etat = prompt(`État (NEUF, BON, MOYEN, MAUVAIS, HORS_SERVICE) :`, 'NEUF') || 'NEUF';
    if (!['NEUF', 'BON', 'MOYEN', 'MAUVAIS', 'HORS_SERVICE'].includes(etat.toUpperCase())) {
      alert('État invalide.');
      return;
    }

    try {
      await api.post('/materiaux/mouvements/', {
        type: 'APPROVISIONNEMENT',
        materiel: materielId,
        quantite,
        date_mouvement: new Date().toISOString().split('T')[0],
        brigade: user.brigade || null, // Optionnel, on peut laisser vide pour une approvisionnement général
        commentaire: `Approvisionnement de ${quantite} ${nom} en état ${etat.toUpperCase()}`,
      });
      alert(`✅ ${quantite} ${nom} approvisionné(s) avec succès !`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('❌ Erreur lors de l\'approvisionnement.');
    }
  };

  // ─── États possibles ───
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

        /* ─── Contenu principal avec marge ─── */
        .main {
          flex: 1;
          padding: 28px 36px;
          margin-left: 240px;
          max-width: calc(100% - 240px);
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
        .page-header .sub .section-badge {
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
          .main { padding: 20px 24px; max-width: calc(100% - 200px); margin-left: 200px; }
        }
        @media (max-width: 768px) {
          .app { flex-direction: column; }
          .main { max-width: 100%; padding: 16px; margin-left: 0; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .stock-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .stock-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="stock-body">
        <div className="app">

          <SectionSidebar />

          <main className="main">

            <div className="page-header">
              <div>
                <h1>État du Stock</h1>
                <div className="sub">
                  Vue globale par état — Section <span className="section-badge">{user?.section?.nom || 'N/A'}</span>
                </div>
              </div>
              <div className="user-badge">
                <div className="avatar">{user?.nom ? user.nom[0] : 'CS'}</div>
                <div>
                  <div className="name">{user?.nom || 'Chef'}</div>
                  <div className="role">Chef de Section</div>
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
                              onClick={() => handleApprovisionner(m.id, m.nom)}
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
    </>
  );
};

export default SectionStock;