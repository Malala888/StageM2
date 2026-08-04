import React, { useState } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import SectionSidebar from '../components/SectionSidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let sectionParametresCache = null;
let sectionParametresCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchSectionParametresData() {
  const now = Date.now();
  if (sectionParametresCache && now - sectionParametresCacheTime < CACHE_TTL_MS) {
    return sectionParametresCache;
  }

  const [{ data: userData }] = await Promise.all([
    api.get('/accounts/users/me/'),
  ]);

  const result = { user: userData };
  sectionParametresCache = result;
  sectionParametresCacheTime = now;
  return result;
}

// ─── Loader ───
export async function sectionParametresLoader() {
  return fetchSectionParametresData();
}

// ─── ErrorElement ───
export function SectionParametresError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement des paramètres:', error);
  return (
    <div className="parametres-body">
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
const SectionParametres = () => {
  const { user: initialUser } = useLoaderData();

  // ─── États du formulaire ───
  const [nom, setNom] = useState(initialUser?.nom || '');
  const [prenom, setPrenom] = useState(initialUser?.prenom || '');
  const [email, setEmail] = useState(initialUser?.email || '');
  const [telephone, setTelephone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Handlers ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    setIsSubmitting(true);

    if (newPassword && newPassword !== confirmPassword) {
      setUpdateError('Les mots de passe ne correspondent pas');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Mettre à jour le profil (nom, prénom, email)
      const payload = { nom, prenom, email };
      await api.patch(`/accounts/users/${initialUser.id}/`, payload);

      // 2. Changer le mot de passe si demandé
      if (newPassword && currentPassword) {
        await api.post('/accounts/change-password/', {
          old_password: currentPassword,
          new_password: newPassword,
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      setUpdateSuccess('✅ Profil mis à jour avec succès !');

      // Mettre à jour l'utilisateur dans le cache local
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
          .main { padding: 20px 24px; max-width: calc(100% - 200px); margin-left: 200px; }
        }
        @media (max-width: 768px) {
          .app { flex-direction: column; }
          .main { max-width: 100%; padding: 16px; margin-left: 0; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .form-grid { grid-template-columns: 1fr; }
          .form-grid .field.full { grid-column: span 1; }
        }
      `}</style>

      <div className="parametres-body">
        <div className="app">

          <SectionSidebar />

          <main className="main">

            <div className="page-header">
              <div>
                <h1>Paramètres du compte</h1>
                <div className="sub">
                  Modifiez vos informations personnelles — Section <span className="section-badge">{initialUser?.section?.nom || 'N/A'}</span>
                </div>
              </div>
              <div className="user-badge">
                <div className="avatar">{initialUser?.nom ? initialUser.nom[0] : 'CS'}</div>
                <div>
                  <div className="name">{initialUser?.nom || 'Chef'}</div>
                  <div className="role">Chef de Section</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>👤 Modifier mon profil</h3>

              {updateSuccess && <div className="success-message">{updateSuccess}</div>}
              {updateError && <div className="error-message">{updateError}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="nom">Nom</label>
                    <input
                      type="text"
                      id="nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="prenom">Prénom</label>
                    <input
                      type="text"
                      id="prenom"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="email">Email / Nom d'utilisateur</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <span className="help">L'email vous sert d'identifiant pour la connexion.</span>
                  </div>
                  <div className="field">
                    <label htmlFor="telephone">Téléphone</label>
                    <input
                      type="text"
                      id="telephone"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      placeholder="+261 XX XXX XX XX"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="role">Rôle</label>
                    <input type="text" id="role" value={initialUser?.role || 'CHEF_SECTION'} disabled />
                    <span className="help">Le rôle ne peut pas être modifié ici.</span>
                  </div>
                  <div className="field">
                    <label htmlFor="section">Section</label>
                    <input type="text" id="section" value={initialUser?.section?.nom || 'N/A'} disabled />
                    <span className="help">La section est attribuée par le Chef de Service.</span>
                  </div>
                  <div className="field full">
                    <label htmlFor="statut">Statut du compte</label>
                    <input type="text" id="statut" value={initialUser?.statut || 'ACTIF'} disabled />
                  </div>

                  {/* ─── Changement de mot de passe ─── */}
                  <div className="field full">
                    <hr style={{ margin: '8px 0', borderColor: '#e2e8f0' }} />
                    <label style={{ fontSize: '1rem', textTransform: 'none', color: '#0f172a', fontWeight: 600 }}>
                      🔐 Changer le mot de passe
                    </label>
                  </div>
                  <div className="field">
                    <label htmlFor="current_password">Mot de passe actuel</label>
                    <input
                      type="password"
                      id="current_password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="new_password">Nouveau mot de passe</label>
                    <input
                      type="password"
                      id="new_password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="field full">
                    <label htmlFor="confirm_password">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      id="confirm_password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <span className="help">Laissez les champs de mot de passe vides pour ne pas le modifier.</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-sm primary" style={{ padding: '10px 28px' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Enregistrement...' : '💾 Mettre à jour le profil'}
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

export default SectionParametres;