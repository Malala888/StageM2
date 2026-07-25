import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

const ServiceMateriels = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categorie, setCategorie] = useState('');
  const [etat, setEtat] = useState('');

  const handleFilter = (e) => {
    e.preventDefault();
    alert('Filtres appliqués !');
  };

  const handleAdd = () => {
    alert('Ajouter un nouveau matériel');
  };

  const handleEdit = (nom) => {
    alert(`Modifier : ${nom}`);
  };

  const handleDelete = (nom) => {
    alert(`Supprimer : ${nom}`);
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

        .actions-cell {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
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
        }
      `}</style>

      <div className="materiels-body">
        <div className="app">

          <Sidebar />

          <main className="main">

            <div className="page-header">
              <div>
                <h1>Catalogue Matériels</h1>
                <div className="sub">Gestion du stock et des références</div>
              </div>
              <div className="user-badge">
                <div className="avatar">AD</div>
                <div>
                  <div className="name">Admin</div>
                  <div className="role">Chef Service</div>
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
                <option value="Électrique">Électrique</option>
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
              <button
                className="btn-sm success"
                style={{ padding: '8px 20px', marginLeft: 'auto' }}
                onClick={handleAdd}
              >
                + Ajouter un matériel
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
                      <th>Seuil</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Pelle DS-12</strong></td>
                      <td>Outillage</td>
                      <td>15</td>
                      <td><span className="badge green">BON</span></td>
                      <td><span className="stock-badge high">✅ OK</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleEdit('Pelle DS-12')}>✏️</button>
                        <button className="btn-sm danger" onClick={() => handleDelete('Pelle DS-12')}>🗑️</button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Brouette 45L</strong></td>
                      <td>BTP</td>
                      <td>3</td>
                      <td><span className="badge yellow">MOYEN</span></td>
                      <td><span className="stock-badge low">⚠️ Stock bas</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleEdit('Brouette 45L')}>✏️</button>
                        <button className="btn-sm danger" onClick={() => handleDelete('Brouette 45L')}>🗑️</button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Perceuse Bosh</strong></td>
                      <td>Électrique</td>
                      <td>8</td>
                      <td><span className="badge green">NEUF</span></td>
                      <td><span className="stock-badge high">✅ OK</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleEdit('Perceuse Bosh')}>✏️</button>
                        <button className="btn-sm danger" onClick={() => handleDelete('Perceuse Bosh')}>🗑️</button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Groupe électrogène</strong></td>
                      <td>Électrique</td>
                      <td>2</td>
                      <td><span className="badge red">HORS_SERVICE</span></td>
                      <td><span className="stock-badge low">⚠️ Hors service</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleEdit('Groupe électrogène')}>✏️</button>
                        <button className="btn-sm danger" onClick={() => handleDelete('Groupe électrogène')}>🗑️</button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Échelle 6m</strong></td>
                      <td>BTP</td>
                      <td>5</td>
                      <td><span className="badge yellow">MOYEN</span></td>
                      <td><span className="stock-badge medium">⚠️ Seuil atteint</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleEdit('Échelle 6m')}>✏️</button>
                        <button className="btn-sm danger" onClick={() => handleDelete('Échelle 6m')}>🗑️</button>
                      </td>
                    </tr>
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

export default ServiceMateriels;