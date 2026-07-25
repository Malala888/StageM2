import React, { useState } from 'react';
import CNSidebar from '../components/CNSidebar';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

const CNMateriels = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categorie, setCategorie] = useState('');
  const [etat, setEtat] = useState('');

  const handleFilter = (e) => {
    e.preventDefault();
    alert('Filtres appliqués !');
  };

  const handleReset = () => {
    setSearchTerm('');
    setCategorie('');
    setEtat('');
  };

  const handleDemander = (materiel) => {
    alert(`📤 Demande d'emprunt : ${materiel}`);
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

        .materiels-body {
          font-family: 'Inter', sans-serif;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
          color: #0f172a;
          min-height: 100vh;
        }

        .materiels-body::before {
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
          padding: 20px 24px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          margin-bottom: 24px;
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
        .btn-sm.outline:disabled { opacity: 0.5; cursor: not-allowed; }

        .stock-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .stock-badge.low { background: #fee2e2; color: #dc2626; }
        .stock-badge.medium { background: #fef9c3; color: #ca8a04; }
        .stock-badge.high { background: #dcfce7; color: #16a34a; }

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
        }
      `}</style>

      <div className="materiels-body">
        <div className="app">
          {/* Sidebar fixed, importée depuis le composant séparé */}
          <CNSidebar />

          <main className="main">
            <div className="page-header">
              <div>
                <h1>Mes Matériels</h1>
                <div className="sub">
                  Matériels assignés à votre personne — <span className="role-badge">CN</span>
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

            {/* Filtres */}
            <div className="filters">
              <input
                type="text"
                placeholder="🔍 Rechercher un matériel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
                <option value="">Catégorie</option>
                <option value="Outillage">Outillage</option>
                <option value="Jardinage">Jardinage</option>
                <option value="Transport">Transport</option>
                <option value="BTP">BTP</option>
              </select>
              <select value={etat} onChange={(e) => setEtat(e.target.value)}>
                <option value="">État</option>
                <option value="NEUF">NEUF</option>
                <option value="BON">BON</option>
                <option value="MOYEN">MOYEN</option>
                <option value="MAUVAIS">MAUVAIS</option>
                <option value="HORS_SERVICE">HORS_SERVICE</option>
              </select>
              <button className="btn-sm primary" style={{ padding: '8px 20px' }} onClick={handleFilter}>
                Filtrer
              </button>
              <button className="btn-sm outline" style={{ padding: '8px 20px' }} onClick={handleReset}>
                Réinitialiser
              </button>
            </div>

            {/* Tableau */}
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Catégorie</th>
                      <th>Quantité</th>
                      <th>État</th>
                      <th>Disponibilité</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Râteau 5 dents</strong></td>
                      <td>Jardinage</td>
                      <td>2</td>
                      <td><span className="badge green">BON</span></td>
                      <td><span className="stock-badge high">✅ Disponible</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm primary" onClick={() => handleDemander('Râteau 5 dents')}>
                          Demander
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Brouette 45L</strong></td>
                      <td>Transport</td>
                      <td>1</td>
                      <td><span className="badge yellow">MOYEN</span></td>
                      <td><span className="stock-badge high">✅ Disponible</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm primary" onClick={() => handleDemander('Brouette 45L')}>
                          Demander
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Pioche 2kg</strong></td>
                      <td>Outillage</td>
                      <td>1</td>
                      <td><span className="badge green">NEUF</span></td>
                      <td><span className="stock-badge medium">🔴 Déjà emprunté</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" disabled style={{ opacity: 0.5 }}>
                          Indisponible
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Pelle ronde</strong></td>
                      <td>Outillage</td>
                      <td>3</td>
                      <td><span className="badge green">BON</span></td>
                      <td><span className="stock-badge high">✅ Disponible</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm primary" onClick={() => handleDemander('Pelle ronde')}>
                          Demander
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note */}
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#f1f5f9', padding: '12px 16px', borderRadius: '10px' }}>
              💡 Pour emprunter un matériel, cliquez sur "Demander". Votre chef de brigade validera la demande.
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default CNMateriels;