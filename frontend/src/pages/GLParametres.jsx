import React, { useState } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import GLSidebar from '../components/GLSidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let glParametresCache = null;
let glParametresCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchGLParametresData() {
  const now = Date.now();
  if (glParametresCache && now - glParametresCacheTime < CACHE_TTL_MS) {
    return glParametresCache;
  }

  const [{ data: userData }] = await Promise.all([
    api.get('/accounts/users/me/'),
  ]);

  const result = { user: userData };
  glParametresCache = result;
  glParametresCacheTime = now;
  return result;
}

export async function glParametresLoader() {
  return fetchGLParametresData();
}

export function GLParametresError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement des paramètres:', error);
  return (
    <div className="parametres-body">
      <div className="app">
        <GLSidebar />
        <main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
          <h2 style={{ color: 'red' }}>Erreur</h2>
          <p>Impossible de charger les paramètres. Veuillez réessayer.</p>
          <button className="btn-sm primary" onClick={() => window.location.reload()}>Réessayer</button>
        </main>
      </div>
    </div>
  );
}

const GLParametres = () => {
  const { user: initialUser } = useLoaderData();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brigadeName = initialUser?.brigade?.nom || 'N/A';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    setIsSubmitting(true);

    if (newPassword !== confirmPassword) {
      setUpdateError('Les mots de passe ne correspondent pas');
      setIsSubmitting(false);
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setUpdateError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post('/accounts/change-password/', {
        old_password: currentPassword,
        new_password: newPassword,
      });
      setUpdateSuccess('✅ Mot de passe mis à jour avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Erreur lors du changement de mot de passe';
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

        .parametres-body {
          font-family: 'Inter', sans-serif;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
          color: #0f172a;
          min-height: 100vh;
        }
        .parametres-body::before {
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
        .form-grid .field .help {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 2px;
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
        }
      `}</style>

      <div className="parametres-body">
        <div className="app">
          <GLSidebar />
          <main className="main">
            <div className="page-header">
              <div>
                <h1>Paramètres</h1>
                <div className="sub">Gestion du compte — <span className="brigade-badge">{brigadeName}</span></div>
              </div>
              <div className="user-badge">
                <div className="avatar">{initialUser?.prenom?.[0] || 'G'}</div>
                <div>
                  <div className="name">{initialUser?.prenom || 'Garde'} {initialUser?.nom || 'Ligne'}</div>
                  <div className="role">Garde Ligne</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>🔐 Changer le mot de passe</h3>

              {updateSuccess && <div className="success-message">{updateSuccess}</div>}
              {updateError && <div className="error-message">{updateError}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="field full">
                    <label htmlFor="current_password">Mot de passe actuel</label>
                    <input
                      type="password"
                      id="current_password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field full">
                    <label htmlFor="new_password">Nouveau mot de passe</label>
                    <input
                      type="password"
                      id="new_password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength="8"
                    />
                    <span className="help">Minimum 8 caractères.</span>
                  </div>
                  <div className="field full">
                    <label htmlFor="confirm_password">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      id="confirm_password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-sm primary" style={{ padding: '10px 28px' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Enregistrement...' : '💾 Changer le mot de passe'}
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

export default GLParametres;