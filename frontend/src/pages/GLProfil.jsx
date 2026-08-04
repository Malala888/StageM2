import React, { useState } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import GLSidebar from '../components/GLSidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let glProfilCache = null;
let glProfilCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchGLProfilData() {
  const now = Date.now();
  if (glProfilCache && now - glProfilCacheTime < CACHE_TTL_MS) {
    return glProfilCache;
  }

  const [
    { data: userData },
    { data: brigadesData },
    { data: sectionsData },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/personnel/brigades/'),
    api.get('/personnel/sections/'),
  ]);

  const brigade = brigadesData.find(b => b.id === userData.brigade) || null;
  const section = sectionsData.find(s => s.id === brigade?.section) || null;
  const user = { ...userData, brigade, section };

  const result = { user };
  glProfilCache = result;
  glProfilCacheTime = now;
  return result;
}

export async function glProfilLoader() {
  return fetchGLProfilData();
}

export function GLProfilError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement du profil:', error);
  return (
    <div className="profil-body">
      <div className="app">
        <GLSidebar />
        <main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
          <h2 style={{ color: 'red' }}>Erreur</h2>
          <p>Impossible de charger votre profil. Veuillez réessayer.</p>
          <button className="btn-sm primary" onClick={() => window.location.reload()}>Réessayer</button>
        </main>
      </div>
    </div>
  );
}

const GLProfil = () => {
  const { user: initialUser } = useLoaderData();

  const [nom, setNom] = useState(initialUser?.nom || '');
  const [prenom, setPrenom] = useState(initialUser?.prenom || '');
  const [email, setEmail] = useState(initialUser?.email || '');
  const [telephone, setTelephone] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brigadeName = initialUser?.brigade?.nom || 'N/A';
  const sectionName = initialUser?.section?.nom || 'N/A';
  const statut = initialUser?.statut || 'ACTIF';
  const dateInscription = initialUser?.date_inscription
    ? new Date(initialUser.date_inscription).toLocaleDateString('fr-FR')
    : 'N/A';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    setIsSubmitting(true);

    try {
      const payload = { nom, prenom, email };
      await api.patch(`/accounts/users/${initialUser.id}/`, payload);
      setUpdateSuccess('✅ Profil mis à jour avec succès !');
      initialUser.nom = nom;
      initialUser.prenom = prenom;
      initialUser.email = email;
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Erreur lors de la mise à jour du profil';
      setUpdateError(`❌ ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
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

        .profil-body {
          font-family: 'Inter', sans-serif;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
          color: #0f172a;
          min-height: 100vh;
        }
        .profil-body::before {
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
          padding: 24px 28px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          margin-bottom: 24px;
        }
        .card h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 18px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .profile-header .avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #2563eb;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 2rem;
        }
        .profile-header .info h2 {
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
        }
        .profile-header .info p {
          color: #475569;
          font-size: 0.9rem;
          margin-top: 2px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 30px;
        }
        .form-grid .field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-grid .field.full {
          grid-column: span 2;
        }
        .form-grid .field label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
        }
        .form-grid .field input {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: rgba(255,255,255,0.7);
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-grid .field input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }
        .form-grid .field input:disabled {
          background: #f1f5f9;
          color: #64748b;
          cursor: not-allowed;
        }

        .btn-sm {
          padding: 6px 16px;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
        }
        .btn-sm.primary { background: #2563eb; color: #fff; }
        .btn-sm.primary:hover { background: #1d4ed8; }
        .btn-sm.success { background: #16a34a; color: #fff; }
        .btn-sm.success:hover { background: #15803d; }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .success-message {
          color: #16a34a;
          background: #dcfce7;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 0.9rem;
        }
        .error-message {
          color: #dc2626;
          background: #fee2e2;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 0.9rem;
        }

        @media (max-width: 1024px) {
          .main { margin-left: 200px; padding: 20px 24px; }
        }
        @media (max-width: 768px) {
          .main { margin-left: 0; padding: 16px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .form-grid { grid-template-columns: 1fr; }
          .form-grid .field.full { grid-column: span 1; }
          .profile-header { flex-direction: column; text-align: center; }
        }
      `}</style>

      <div className="profil-body">
        <div className="app">
          <GLSidebar />
          <main className="main">
            <div className="page-header">
              <div>
                <h1>Mon Profil</h1>
                <div className="sub">Informations personnelles — <span className="role-badge">GL</span></div>
              </div>
              <div className="user-badge">
                <div className="avatar">{initialUser?.prenom?.[0] || 'G'}</div>
                <div>
                  <div className="name">{initialUser?.prenom || 'Garde'} {initialUser?.nom || 'Ligne'}</div>
                  <div className="role">Garde Ligne • {brigadeName}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="profile-header">
                <div className="avatar-large">{initialUser?.prenom?.[0] || 'G'}{initialUser?.nom?.[0] || 'L'}</div>
                <div className="info">
                  <h2>{initialUser?.prenom || 'Garde'} {initialUser?.nom || 'Ligne'}</h2>
                  <p>Garde Ligne (GL) • Brigade {brigadeName} • Section {sectionName}</p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Compte validé le {dateInscription} • {statut}
                  </p>
                </div>
              </div>

              {updateSuccess && <div className="success-message">{updateSuccess}</div>}
              {updateError && <div className="error-message">{updateError}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="nom">Nom</label>
                    <input type="text" id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="prenom">Prénom</label>
                    <input type="text" id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="telephone">Téléphone</label>
                    <input type="text" id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+261 XX XXX XX XX" />
                  </div>
                  <div className="field">
                    <label>Poste</label>
                    <input type="text" value="Garde Ligne (GL)" disabled />
                  </div>
                  <div className="field">
                    <label>Brigade</label>
                    <input type="text" value={brigadeName} disabled />
                  </div>
                  <div className="field">
                    <label>Section</label>
                    <input type="text" value={sectionName} disabled />
                  </div>
                  <div className="field">
                    <label>Statut</label>
                    <input type="text" value={statut} style={{ color: statut === 'ACTIF' ? '#16a34a' : '#dc2626', fontWeight: 600 }} disabled />
                  </div>
                  <div className="field">
                    <label>Date d'adhésion</label>
                    <input type="text" value={dateInscription} disabled />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-sm primary" style={{ padding: '10px 28px' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Enregistrement...' : '💾 Mettre à jour'}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default GLProfil;