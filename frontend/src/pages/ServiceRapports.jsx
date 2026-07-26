import React, { useState, useEffect } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let rapportsCache = null;
let rapportsCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchRapportsData() {
  const now = Date.now();
  if (rapportsCache && now - rapportsCacheTime < CACHE_TTL_MS) {
    return rapportsCache;
  }

  const [
    { data: userData },
    { data: mouvementsData },
    { data: stockData },
    { data: materielsData },
    { data: brigadesData },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/materiaux/mouvements/'),
    api.get('/materiaux/stock/'),
    api.get('/materiaux/materiels/'),
    api.get('/personnel/brigades/'),
  ]);

  // Statistiques globales
  const totalMouvements = mouvementsData.length;
  const empruntsEnCours = mouvementsData.filter(m => m.type === 'EMPRUNT' && m.statut === 'EN_COURS').length;
  const retards = mouvementsData.filter(m => m.statut === 'EN_RETARD').length;

  // Matériels abîmés (état MAUVAIS ou HORS_SERVICE)
  const materielsAbimes = stockData.filter(s => s.etat === 'MAUVAIS' || s.etat === 'HORS_SERVICE')
    .reduce((acc, s) => acc + s.quantite, 0);

  // Stock total
  const stockTotal = stockData.reduce((acc, s) => acc + s.quantite, 0);

  // Statistiques par brigade (nombre de mouvements par brigade)
  const statsParBrigade = brigadesData.map(b => {
    const count = mouvementsData.filter(m => m.brigade === b.id).length;
    return { ...b, count };
  }).sort((a, b) => b.count - a.count);

  // Top 5 des matériels les plus empruntés (via les mouvements EMPRUNT)
  const empruntsParMateriel = {};
  mouvementsData
    .filter(m => m.type === 'EMPRUNT')
    .forEach(m => {
      const id = m.materiel;
      if (!empruntsParMateriel[id]) empruntsParMateriel[id] = 0;
      empruntsParMateriel[id] += m.quantite;
    });
  const topMateriels = Object.entries(empruntsParMateriel)
    .map(([id, qte]) => ({ id: parseInt(id), qte }))
    .sort((a, b) => b.qte - a.qte)
    .slice(0, 5)
    .map(item => {
      const m = materielsData.find(mat => mat.id === item.id);
      return m ? { nom: m.nom, qte: item.qte } : null;
    })
    .filter(Boolean);

  const result = {
    user: userData,
    mouvements: mouvementsData,
    stock: stockData,
    materiels: materielsData,
    brigades: brigadesData,
    totalMouvements,
    empruntsEnCours,
    retards,
    materielsAbimes,
    stockTotal,
    statsParBrigade,
    topMateriels,
  };

  rapportsCache = result;
  rapportsCacheTime = now;
  return result;
}

// ─── Loader ───
export async function serviceRapportsLoader() {
  return fetchRapportsData();
}

// ─── ErrorElement ───
export function ServiceRapportsError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement des rapports:', error);
  return (
    <div className="rapports-body">
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
const ServiceRapports = () => {
  const {
    user,
    mouvements,
    stock,
    materiels,
    brigades,
    totalMouvements,
    empruntsEnCours,
    retards,
    materielsAbimes,
    stockTotal,
    statsParBrigade,
    topMateriels,
  } = useLoaderData();

  // États pour les filtres
  const [periode, setPeriode] = useState('');
  const [brigade, setBrigade] = useState('');

  // États pour les statistiques filtrées (pour une démo, on va juste afficher les données globales)
  // On pourrait filtrer les mouvements selon la période et la brigade, mais pour l'instant on garde les valeurs réelles.

  // Handlers
  const handleGenerer = () => {
    alert(`📊 Rapport généré !\nPériode: ${periode || 'Toutes'}\nBrigade: ${brigade || 'Toutes'}`);
    // Ici on pourrait recharger les données avec les filtres
  };

  const handleExportPDF = () => {
    alert('📥 Export PDF en cours...');
  };

  const handleCardClick = (titre, detail) => {
    alert(`📄 ${titre}\n${detail || ''}`);
  };

  // Fonction pour obtenir le nombre de mouvements par brigade
  const getMouvementsByBrigade = (brigadeId) => {
    return mouvements.filter(m => m.brigade === brigadeId).length;
  };

  // Fonction pour obtenir le top des matériels
  const getTopMateriels = () => {
    return topMateriels.map((m, i) => `${i+1}. ${m.nom} (${m.qte})`).join('\n');
  };

  // Stats par état du stock
  const statsParEtat = stock.reduce((acc, s) => {
    acc[s.etat] = (acc[s.etat] || 0) + s.quantite;
    return acc;
  }, {});

  const totalAbimes = (statsParEtat['MAUVAIS'] || 0) + (statsParEtat['HORS_SERVICE'] || 0);

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

        .rapports-body {
          font-family: 'Inter', sans-serif;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
          color: #0f172a;
          min-height: 100vh;
        }

        .rapports-body::before {
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
        .badge.orange { background: #fef3c7; color: #ca8a04; }

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

        .report-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }
        .report-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          border-radius: 14px;
          padding: 18px 20px;
          border: 1px solid rgba(255,255,255,0.5);
          text-align: center;
          transition: transform 0.15s;
          cursor: pointer;
        }
        .report-card:hover { transform: translateY(-2px); }
        .report-card .icon { font-size: 2.2rem; margin-bottom: 6px; }
        .report-card .title { font-weight: 600; color: #0f172a; }
        .report-card .desc { font-size: 0.8rem; color: #94a3b8; margin-top: 4px; }

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
          .report-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .report-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rapports-body">
        <div className="app">

          <Sidebar />

          <main className="main">

            <div className="page-header">
              <div>
                <h1>Rapports</h1>
                <div className="sub">Analyses et statistiques</div>
              </div>
              <div className="user-badge">
                <div className="avatar">{user?.nom ? user.nom[0] : 'AD'}</div>
                <div>
                  <div className="name">{user?.nom || 'Admin'}</div>
                  <div className="role">Chef Service</div>
                </div>
              </div>
            </div>

            {/* ─── Filtres ─── */}
            <div className="filters">
              <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
                <option value="">Période</option>
                <option value="mois">Ce mois</option>
                <option value="trimestre">Ce trimestre</option>
                <option value="annee">Cette année</option>
              </select>
              <select value={brigade} onChange={(e) => setBrigade(e.target.value)}>
                <option value="">Toutes les brigades</option>
                {brigades.map(b => (
                  <option key={b.id} value={b.id}>{b.nom}</option>
                ))}
              </select>
              <button className="btn-sm primary" style={{ padding: '8px 20px' }} onClick={handleGenerer}>
                Générer
              </button>
              <button
                className="btn-sm success"
                style={{ padding: '8px 20px', marginLeft: 'auto' }}
                onClick={handleExportPDF}
              >
                📥 Exporter PDF
              </button>
            </div>

            {/* ─── Cartes de rapports ─── */}
            <div className="report-grid">
              <div className="report-card" onClick={() => handleCardClick('Emprunts en cours', `${empruntsEnCours} matériels actuellement empruntés`)}>
                <div className="icon">📊</div>
                <div className="title">Emprunts en cours</div>
                <div className="desc">{empruntsEnCours} matériels actuellement empruntés</div>
                <span className="badge yellow">{empruntsEnCours > 0 ? `+${empruntsEnCours} en cours` : 'Aucun'}</span>
              </div>
              <div className="report-card" onClick={() => handleCardClick('Retards', `${retards} retards signalés`)}>
                <div className="icon">⏰</div>
                <div className="title">Retards</div>
                <div className="desc">{retards} retards signalés</div>
                <span className="badge red">{retards > 0 ? `${retards} à traiter` : '✅ Aucun'}</span>
              </div>
              <div className="report-card" onClick={() => handleCardClick('Par Brigade', statsParBrigade.map(b => `${b.nom} : ${b.count}`).join(' | '))}>
                <div className="icon">🏢</div>
                <div className="title">Par Brigade</div>
                <div className="desc">{statsParBrigade.slice(0, 3).map(b => `${b.nom} : ${b.count}`).join(' | ')}</div>
                <span className="badge blue">Voir détails</span>
              </div>
              <div className="report-card" onClick={() => handleCardClick('Matériels abîmés', `${materielsAbimes} en mauvais état`)}>
                <div className="icon">🔧</div>
                <div className="title">Matériels abîmés</div>
                <div className="desc">{materielsAbimes} en mauvais état</div>
                <span className="badge orange">{materielsAbimes > 0 ? `+${materielsAbimes} à réparer` : '✅ Bon état'}</span>
              </div>
              <div className="report-card" onClick={() => handleCardClick('Stock total', `${stockTotal} unités en stock`)}>
                <div className="icon">📦</div>
                <div className="title">Stock total</div>
                <div className="desc">{stockTotal} unités en stock</div>
                <span className="badge green">{stockTotal > 0 ? `${stockTotal} disponibles` : 'Stock vide'}</span>
              </div>
              <div className="report-card" onClick={() => handleCardClick('Mouvements', `${totalMouvements} opérations ce mois`)}>
                <div className="icon">🔄</div>
                <div className="title">Mouvements</div>
                <div className="desc">{totalMouvements} opérations au total</div>
                <span className="badge blue">{totalMouvements > 0 ? `+${totalMouvements} enregistrés` : 'Aucun'}</span>
              </div>
            </div>

            {/* ─── Détails supplémentaires ─── */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px' }}>📋 Top 5 des matériels les plus empruntés</h3>
              {topMateriels.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {topMateriels.map((m, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span><strong>{i+1}.</strong> {m.nom}</span>
                      <span className="badge blue">{m.qte} emprunts</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#94a3b8' }}>Aucun emprunt enregistré</p>
              )}
            </div>

          </main>
        </div>
      </div>
    </>
  );
};

export default ServiceRapports;