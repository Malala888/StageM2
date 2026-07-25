import React, { useState } from 'react';
import CNSidebar from '../components/CNSidebar';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

const CNProfil = () => {
  // ─── States pour les champs modifiables ───
  const [email, setEmail] = useState('marie.ranaivo@fce.mg');
  const [telephone, setTelephone] = useState('+261 32 45 678 90');
  const [adresse, setAdresse] = useState('Fianarantsoa, Madagascar');

  // ─── Handlers ───
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('💾 Profil mis à jour avec succès !');
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
          display: block;          /* plus de flex, sidebar fixed */
          min-height: 100vh;
        }

        /* ─── Le main est décalé pour la sidebar fixed ─── */
        .main {
          margin-left: 240px;      /* largeur de la sidebar */
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
        .form-grid .field input,
        .form-grid .field textarea {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: rgba(255,255,255,0.7);
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-grid .field input:focus,
        .form-grid .field textarea:focus {
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

        /* ─── Responsive ─── */
        @media (max-width: 1024px) {
          .main { margin-left: 200px; padding: 20px 24px; }
        }
        @media (max-width: 768px) {
          .main {
            margin-left: 0;        /* la sidebar devient relative ou on garde fixed mais on réduit le padding */
            padding: 16px;
          }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .form-grid { grid-template-columns: 1fr; }
          .form-grid .field.full { grid-column: span 1; }
          .profile-header { flex-direction: column; text-align: center; }
        }
      `}</style>

      <div className="profil-body">
        <div className="app">
          {/* Sidebar fixed, importée depuis le composant séparé */}
          <CNSidebar />

          <main className="main">
            <div className="page-header">
              <div>
                <h1>Mon Profil</h1>
                <div className="sub">
                  Informations personnelles — <span className="role-badge">CN</span>
                </div>
              </div>
              <div className="user-badge">
                <div className="avatar">CN</div>
                <div>
                  <div className="name">Ranaivo Marie</div>
                  <div className="role">Cantonnier • BR FI</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="profile-header">
                <div className="avatar-large">RM</div>
                <div className="info">
                  <h2>Ranaivo Marie</h2>
                  <p>Cantonnier (CN) • Brigade BR FI • Section Fianarantsoa</p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Compte validé le 20/06/2026 • Actif
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="nom">Nom</label>
                    <input type="text" id="nom" value="Ranaivo" disabled />
                  </div>
                  <div className="field">
                    <label htmlFor="prenom">Prénom</label>
                    <input type="text" id="prenom" value="Marie" disabled />
                  </div>
                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="telephone">Téléphone</label>
                    <input
                      type="text"
                      id="telephone"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                    />
                  </div>
                  <div className="field full">
                    <label htmlFor="adresse">Adresse (optionnel)</label>
                    <input
                      type="text"
                      id="adresse"
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Poste</label>
                    <input type="text" value="Cantonnier (CN)" disabled />
                  </div>
                  <div className="field">
                    <label>Brigade</label>
                    <input type="text" value="BR FI – Fianarantsoa" disabled />
                  </div>
                  <div className="field">
                    <label>Statut</label>
                    <input
                      type="text"
                      value="ACTIF"
                      style={{ color: '#16a34a', fontWeight: 600 }}
                      disabled
                    />
                  </div>
                  <div className="field">
                    <label>Date d'adhésion</label>
                    <input type="text" value="20/06/2026" disabled />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-sm primary" style={{ padding: '10px 28px' }}>
                    💾 Mettre à jour
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

export default CNProfil;