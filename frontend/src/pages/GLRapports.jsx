import React, { useState } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import GLSidebar from '../components/GLSidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let glRapportsCache = null;
let glRapportsCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchGLRapportsData() {
  const now = Date.now();
  if (glRapportsCache && now - glRapportsCacheTime < CACHE_TTL_MS) {
    return glRapportsCache;
  }

  const [
    { data: userData },
    { data: mouvementsData },
    { data: materielsData },
    { data: brigadesData },
    { data: sectionsData },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/materiaux/mouvements/'),
    api.get('/materiaux/materiels/'),
    api.get('/personnel/brigades/'),
    api.get('/personnel/sections/'),
  ]);

  // Enrichir l'utilisateur avec la brigade et la section
  const brigade = brigadesData.find(b => b.id === userData.brigade) || null;
  const section = sectionsData.find(s => s.id === brigade?.section) || null;
  const user = { ...userData, brigade, section };

  // Filtrer les mouvements où l'utilisateur est agent_concerner
  const mesMouvements = mouvementsData.filter(m => m.agent_concerner === userData.id);

  // --- Statistiques ---
  const totalEmprunts = mesMouvements.filter(m => m.type === 'EMPRUNT').length;
  const totalRetours = mesMouvements.filter(m => m.type === 'RETOUR').length;
  const empruntsEnCours = mesMouvements.filter(m => m.type === 'EMPRUNT' && m.statut === 'EN_COURS').length;
  const retards = mesMouvements.filter(m => m.statut === 'EN_RETARD').length;
  const demandesEnAttente = mesMouvements.filter(m => m.type === 'EMPRUNT' && m.statut === 'EN_ATTENTE').length;

  // Taux de retour (pour les emprunts qui ont un retour effectif)
  const empruntsAvecRetour = mesMouvements.filter(m => m.type === 'EMPRUNT' && m.date_retour_effective !== null);
  const tauxRetour = totalEmprunts > 0 ? Math.round((empruntsAvecRetour.length / totalEmprunts) * 100) : 0;

  // Matériels actuellement assignés (en cours d'emprunt)
  const assignes = mesMouvements
    .filter(m => m.type === 'EMPRUNT' && m.statut === 'EN_COURS')
    .map(m => {
      const mat = materielsData.find(mat => mat.id === m.materiel);
      return mat ? mat.nom : null;
    })
    .filter(Boolean);

  // Nombre de matériels assignés (quantité totale)
  const nbMaterielsAssignes = mesMouvements
    .filter(m => m.type === 'EMPRUNT' && m.statut === 'EN_COURS')
    .reduce((acc, m) => acc + m.quantite, 0);

  const result = {
    user,
    totalEmprunts,
    totalRetours,
    empruntsEnCours,
    retards,
    demandesEnAttente,
    tauxRetour,
    nbMaterielsAssignes,
    assignes,
    section: section,
    brigade: brigade,
  };

  glRapportsCache = result;
  glRapportsCacheTime = now;
  return result;
}

// ─── Loader ───
export async function glRapportsLoader() {
  return fetchGLRapportsData();
}

// ─── ErrorElement ───
export function GLRapportsError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement des rapports GL:', error);
  return (
    <div className="rapports-body">
      <div className="app">
        <GLSidebar />
        <main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
          <h2 style={{ color: 'red' }}>Erreur</h2>
          <p>Impossible de charger vos statistiques. Veuillez réessayer.</p>
          <button className="btn-sm primary" onClick={() => window.location.reload()}>Réessayer</button>
        </main>
      </div>
    </div>
  );
}

// ─── Composant principal ───
const GLRapports = () => {
  const {
    user,
    totalEmprunts,
    totalRetours,
    empruntsEnCours,
    retards,
    demandesEnAttente,
    tauxRetour,
    nbMaterielsAssignes,
    assignes,
    brigade,
    section,
  } = useLoaderData();

  const [periode, setPeriode] = useState('');

  const handleGenerer = () => {
    alert(`📊 Rapport généré !\nPériode: ${periode || 'Toutes'}\nBasé sur vos données personnelles.`);
  };

  const handleExportPDF = () => {
    alert('📥 Export PDF en cours...');
  };

  const handleCardClick = (titre, detail) => {
    alert(`📄 ${titre}\n${detail || ''}`);
  };

  const brigadeName = brigade?.nom || 'N/A';
  const sectionName = section?.nom || 'N/A';

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
        .card h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 14px;
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
          <GLSidebar />

          <main className="main">
            <div className="page-header">
              <div>
                <h1>Mes Rapports</h1>
                <div className="sub">
                  Statistiques personnelles — <span className="role-badge">GL</span>
                </div>
              </div>
              <div className="user-badge">
                <div className="avatar">{user?.prenom?.[0] || 'G'}</div>
                <div>
                  <div className="name">{user?.prenom || 'Garde'} {user?.nom || 'Ligne'}</div>
                  <div className="role">Garde Ligne • {brigadeName}</div>
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
              <div className="report-card" onClick={() => handleCardClick('Emprunts effectués', `${totalEmprunts} emprunts au total`)}>
                <div className="icon">📊</div>
                <div className="title">Emprunts effectués</div>
                <div className="desc">{totalEmprunts} emprunts au total</div>
                <span className="badge blue">+{empruntsEnCours} en cours</span>
              </div>

              <div className="report-card" onClick={() => handleCardClick('Retards', `${retards} retard(s) signalé(s)`)}>
                <div className="icon">⏰</div>
                <div className="title">Retards</div>
                <div className="desc">{retards} retard{retards > 1 ? 's' : ''}</div>
                <span className={`badge ${retards === 0 ? 'green' : 'red'}`}>
                  {retards === 0 ? '✅ Parfait' : `${retards} à traiter`}
                </span>
              </div>

              <div className="report-card" onClick={() => handleCardClick('Matériels assignés', `${nbMaterielsAssignes} matériels en votre possession`)}>
                <div className="icon">🔧</div>
                <div className="title">Matériels assignés</div>
                <div className="desc">{nbMaterielsAssignes} matériel{nbMaterielsAssignes > 1 ? 's' : ''} en votre possession</div>
                <span className="badge blue">Voir détails</span>
              </div>

              <div className="report-card" onClick={() => handleCardClick('Taux de retour', `${tauxRetour}% de retours à temps`)}>
                <div className="icon">🔄</div>
                <div className="title">Taux de retour</div>
                <div className="desc">{tauxRetour}% de retours effectués</div>
                <span className={`badge ${tauxRetour >= 80 ? 'green' : 'orange'}`}>
                  {tauxRetour >= 80 ? '✅ Bon' : 'Améliorable'}
                </span>
              </div>

              <div className="report-card" onClick={() => handleCardClick('Demandes en attente', `${demandesEnAttente} demande(s) en attente`)}>
                <div className="icon">📦</div>
                <div className="title">Demandes en attente</div>
                <div className="desc">{demandesEnAttente} demande{demandesEnAttente > 1 ? 's' : ''} en attente</div>
                <span className={`badge ${demandesEnAttente === 0 ? 'green' : 'yellow'}`}>
                  {demandesEnAttente === 0 ? '✅ Aucune' : 'En attente'}
                </span>
              </div>

              <div className="report-card" onClick={() => handleCardClick('Brigade', `${brigadeName} – Section ${sectionName}`)}>
                <div className="icon">🏢</div>
                <div className="title">Brigade</div>
                <div className="desc">{brigadeName}</div>
                <span className="badge blue">Section {sectionName}</span>
              </div>
            </div>

            {/* ─── Détail des matériels assignés ─── */}
            {assignes.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px' }}>
                  📋 Matériels actuellement assignés ({assignes.length})
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {assignes.map((nom, index) => (
                    <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span><strong>{index+1}.</strong> {nom}</span>
                      <span className="badge blue">En cours</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default GLRapports;