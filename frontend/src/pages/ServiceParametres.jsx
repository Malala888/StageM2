import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

const ServiceParametres = () => {
  const [nomService, setNomService] = useState('Gestion des Matériels FCE');
  const [emailContact, setEmailContact] = useState('contact@fce.mg');
  const [telephone, setTelephone] = useState('+261 34 12 345 67');
  const [siteWeb, setSiteWeb] = useState('');
  const [adresse, setAdresse] = useState('Fianarantsoa, Madagascar');
  const [couleurPrincipale, setCouleurPrincipale] = useState('#2563eb');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Paramètres enregistrés avec succès !');
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

        /* ─── Sidebar fixe ─── */
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

        /* ─── Contenu principal avec marge ─── */
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
        .form-grid .field textarea {
          resize: vertical;
          min-height: 80px;
        }
        .form-grid .field .help {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 2px;
        }

        .logo-upload {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .logo-upload .preview {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          border: 2px dashed #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: #94a3b8;
          background: rgba(255,255,255,0.4);
          overflow: hidden;
        }
        .logo-upload .preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .logo-upload input[type="file"] {
          padding: 8px 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: rgba(255,255,255,0.6);
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          cursor: pointer;
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
        .btn-sm.danger { background: #dc2626; color: #fff; }
        .btn-sm.danger:hover { background: #b91c1c; }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .config-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        .config-row .config-item {
          flex: 1;
          min-width: 200px;
        }
        .config-row .config-item label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
          display: block;
          margin-bottom: 4px;
        }
        .config-row .config-item select {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: rgba(255,255,255,0.7);
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .config-row .config-item select:focus {
          border-color: #2563eb;
        }
        .config-row .config-item .btn-sm {
          width: 100%;
        }

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
          .form-grid { grid-template-columns: 1fr; }
          .form-grid .field.full { grid-column: span 1; }
          .logo-upload { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="parametres-body">
        <div className="app">

          <Sidebar />

          <main className="main">

            <div className="page-header">
              <div>
                <h1>Paramètres</h1>
                <div className="sub">Configuration générale du service</div>
              </div>
              <div className="user-badge">
                <div className="avatar">AD</div>
                <div>
                  <div className="name">Admin</div>
                  <div className="role">Chef Service</div>
                </div>
              </div>
            </div>

            {/* Informations générales */}
            <div className="card">
              <h3>⚙️ Informations générales</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="nom_service">Nom du service</label>
                    <input
                      type="text"
                      id="nom_service"
                      value={nomService}
                      onChange={(e) => setNomService(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="email_contact">Email de contact</label>
                    <input
                      type="email"
                      id="email_contact"
                      value={emailContact}
                      onChange={(e) => setEmailContact(e.target.value)}
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

                  <div className="field">
                    <label htmlFor="site_web">Site web (optionnel)</label>
                    <input
                      type="text"
                      id="site_web"
                      placeholder="www.fce.mg"
                      value={siteWeb}
                      onChange={(e) => setSiteWeb(e.target.value)}
                    />
                  </div>

                  <div className="field full">
                    <label htmlFor="adresse">Adresse</label>
                    <textarea
                      id="adresse"
                      rows="2"
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="field full">
                    <label>Logo du service</label>
                    <div className="logo-upload">
                      <div className="preview">
                        <span>📷</span>
                      </div>
                      <input type="file" accept="image/*" />
                      <span className="help">Format PNG ou JPG, max 2 Mo</span>
                    </div>
                  </div>

                  <div className="field full">
                    <label htmlFor="couleur_principale">Couleur principale (optionnel)</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="color"
                        id="couleur_principale"
                        value={couleurPrincipale}
                        onChange={(e) => setCouleurPrincipale(e.target.value)}
                        style={{
                          width: '50px',
                          height: '40px',
                          padding: '2px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>{couleurPrincipale}</span>
                    </div>
                    <span className="help">Cette couleur sera utilisée pour les boutons et les accents de l'interface.</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-sm primary" style={{ padding: '10px 28px' }}>
                    💾 Enregistrer les modifications
                  </button>
                  <button
                    type="reset"
                    className="btn-sm"
                    style={{ background: '#f1f5f9', color: '#475569', padding: '10px 20px' }}
                    onClick={() => {
                      setNomService('Gestion des Matériels FCE');
                      setEmailContact('contact@fce.mg');
                      setTelephone('+261 34 12 345 67');
                      setSiteWeb('');
                      setAdresse('Fianarantsoa, Madagascar');
                      setCouleurPrincipale('#2563eb');
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>

            {/* Sécurité & maintenance */}
            <div className="card">
              <h3>🔐 Sécurité & maintenance</h3>
              <div className="config-row">
                <div className="config-item">
                  <label htmlFor="nettoyage_logs">Nettoyage des logs</label>
                  <select id="nettoyage_logs">
                    <option>Conserver 30 jours</option>
                    <option>Conserver 90 jours</option>
                    <option>Conserver 1 an</option>
                  </select>
                </div>
                <div className="config-item">
                  <label htmlFor="sauvegarde">Sauvegarde automatique</label>
                  <select id="sauvegarde">
                    <option>Quotidienne</option>
                    <option>Hebdomadaire</option>
                    <option>Mensuelle</option>
                  </select>
                </div>
                <div className="config-item" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button className="btn-sm danger" style={{ padding: '8px 20px', width: '100%' }}>
                    🗑️ Vider le cache
                  </button>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </>
  );
};

export default ServiceParametres;