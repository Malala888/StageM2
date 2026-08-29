import React, { useState } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import BrigadeSidebar from '../components/BrigadeSidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let brigadeRapportsCache = null;
let brigadeRapportsCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchBrigadeRapportsData() {
  const now = Date.now();
  if (brigadeRapportsCache && now - brigadeRapportsCacheTime < CACHE_TTL_MS) {
    return brigadeRapportsCache;
  }

  const [
    { data: userData },
    { data: mouvementsData },
    { data: stockData },
    { data: materielsData },
    { data: usersData },
    { data: brigades },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/materiaux/mouvements/'),
    api.get('/materiaux/stock/'),
    api.get('/materiaux/materiels/'),
    api.get('/accounts/users/'),
    api.get('/personnel/brigades/'),
  ]);

  const brigadeId = userData.brigade || brigades.find(b => b.chef_brigade === userData.id)?.id || null;

  // Récupérer le nom de la brigade du chef (user.brigade n'est qu'un ID renvoyé par l'API)
  const brigadeObj = brigades.find(b => b.id === brigadeId);
  const brigadeName = brigadeObj?.nom || 'N/A';

  // Mouvements de la brigade (sortants ET transferts entrants)
  const mouvementsBrigade = mouvementsData.filter(m => m.brigade === brigadeId || m.brigade_destination === brigadeId);

  // Agents de la brigade
  const agentsBrigade = usersData.filter(u => u.brigade === brigadeId);

  const result = {
    user: userData,
    mouvements: mouvementsBrigade,
    // stockData est déjà scopé par le backend à cette brigade (+ dépôt central)
    stock: stockData,
    materiels: materielsData,
    agentsBrigade,
    brigadeName,
  };

  brigadeRapportsCache = result;
  brigadeRapportsCacheTime = now;
  return result;
}

export async function brigadeRapportsLoader() {
  return fetchBrigadeRapportsData();
}

export function BrigadeRapportsError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement des rapports de la brigade:', error);
  return (
    <div className="rapports-body">
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

const BrigadeRapports = () => {
  const { user, mouvements, stock, materiels, agentsBrigade, brigadeName } = useLoaderData();

  const [periode, setPeriode] = useState('');

  const agentsActifs = agentsBrigade.filter(u => u.statut === 'ACTIF').length;

  // ─── Mouvements filtrés selon la période choisie ───
  const getDateLimite = (p) => {
    const now = new Date();
    if (p === 'mois') return new Date(now.getFullYear(), now.getMonth(), 1);
    if (p === 'trimestre') return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    if (p === 'annee') return new Date(now.getFullYear(), 0, 1);
    return null;
  };

  const mouvementsFiltres = mouvements.filter(m => {
    if (!periode) return true;
    const limite = getDateLimite(periode);
    return !limite || new Date(m.date_mouvement) >= limite;
  });

  const totalMouvements = mouvementsFiltres.length;
  const empruntsEnCours = mouvementsFiltres.filter(m => m.type === 'EMPRUNT' && m.statut === 'EN_COURS').length;
  const retards = mouvementsFiltres.filter(m => m.statut === 'EN_RETARD').length;

  const now = new Date();
  const moisDebut = new Date(now.getFullYear(), now.getMonth(), 1);
  const mouvementsMois = mouvements.filter(m => new Date(m.date_mouvement) >= moisDebut).length;

  // Stock déjà scopé par le backend à cette brigade (+ dépôt central) : pas de filtre supplémentaire nécessaire
  const materielsAbimes = stock.filter(s => s.etat === 'MAUVAIS' || s.etat === 'HORS_SERVICE').reduce((acc, s) => acc + s.quantite, 0);
  const stockTotal = stock.reduce((acc, s) => acc + s.quantite, 0);

  const handleGenerer = (e) => {
    e.preventDefault();
    const periodeLabel = { mois: 'Ce mois', trimestre: 'Ce trimestre', annee: 'Cette année' }[periode] || 'Toutes périodes';
    alert(`📊 Rapport mis à jour\nPériode : ${periodeLabel}`);
  };

  const handleExportPDF = () => {
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const periodeLabel = { mois: 'Ce mois', trimestre: 'Ce trimestre', annee: 'Cette année' }[periode] || 'Toutes périodes';

    const html = `
      <html>
        <head>
          <title>Rapport Brigade - ${dateStr}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #0f172a; }
            h1 { font-size: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            th { background: #f1f5f9; }
            .meta { color: #64748b; font-size: 12px; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <h1>Rapport - Brigade ${brigadeName}</h1>
          <div class="meta">Généré le ${dateStr} — Période : ${periodeLabel}</div>
          <table>
            <tr><th>Mouvements</th><td>${totalMouvements}</td></tr>
            <tr><th>Emprunts en cours</th><td>${empruntsEnCours}</td></tr>
            <tr><th>Retards</th><td>${retards}</td></tr>
            <tr><th>Matériels abîmés</th><td>${materielsAbimes}</td></tr>
            <tr><th>Stock total</th><td>${stockTotal}</td></tr>
            <tr><th>Agents actifs</th><td>${agentsActifs}</td></tr>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('❌ Le navigateur a bloqué la fenêtre d\'impression. Autorisez les pop-ups pour ce site.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const handleCardClick = (titre, detail) => {
    alert(`📄 ${titre}\n${detail || ''}`);
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
          .main { margin-left: 200px; padding: 20px 24px; }
        }
        @media (max-width: 768px) {
          .main { margin-left: 0; padding: 16px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .report-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .report-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rapports-body">
        <div className="app">
          <BrigadeSidebar />

          <main className="main">
            <div className="page-header">
              <div>
                <h1>Rapports</h1>
                <div className="sub">
                  Analyses et statistiques — Brigade <span className="brigade-badge">{brigadeName}</span>
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

            {/* ─── Filtres ─── */}
            <div className="filters">
              <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
                <option value="">Période</option>
                <option value="mois">Ce mois</option>
                <option value="trimestre">Ce trimestre</option>
                <option value="annee">Cette année</option>
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
              <div className="report-card" onClick={() => handleCardClick('Mouvements', `${totalMouvements} opérations au total`)}>
                <div className="icon">🔄</div>
                <div className="title">Mouvements</div>
                <div className="desc">{totalMouvements} opérations au total</div>
                <span className="badge blue">{mouvementsMois > 0 ? `+${mouvementsMois} ce mois` : 'Aucun'}</span>
              </div>
              <div className="report-card" onClick={() => handleCardClick('Agents', `${agentsActifs} agents actifs`)}>
                <div className="icon">👥</div>
                <div className="title">Agents actifs</div>
                <div className="desc">{agentsActifs} agents actifs</div>
                <span className="badge green">+{agentsActifs} actifs</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default BrigadeRapports;