import React from 'react';
import BrigadeSidebar from '../components/BrigadeSidebar';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

const BrigadeStock = () => {
  const handleApprovisionner = (materiel) => {
    alert(`📦 Approvisionner : ${materiel}`);
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

        .stock-body {
          font-family: 'Inter', sans-serif;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
          color: #0f172a;
          min-height: 100vh;
        }

        .stock-body::before {
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

        .stock-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stock-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid rgba(255,255,255,0.5);
          text-align: center;
          transition: transform 0.15s;
        }
        .stock-card:hover { transform: translateY(-2px); }
        .stock-card .count { font-size: 2rem; font-weight: 700; color: #0f172a; }
        .stock-card .label { font-size: 0.7rem; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.05em; margin-top: 2px; }
        .stock-card .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-bottom: 4px; }
        .stock-card .dot.neuf { background: #22c55e; }
        .stock-card .dot.bon { background: #3b82f6; }
        .stock-card .dot.moyen { background: #eab308; }
        .stock-card .dot.mauvais { background: #f97316; }
        .stock-card .dot.hs { background: #ef4444; }

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
          .stock-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .stock-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="stock-body">
        <div className="app">
          {/* Sidebar fixed, importée depuis le composant séparé */}
          <BrigadeSidebar />

          <main className="main">
            <div className="page-header">
              <div>
                <h1>État du Stock</h1>
                <div className="sub">
                  Vue globale par état — Brigade <span className="brigade-badge">BR FI</span>
                </div>
              </div>
              <div className="user-badge">
                <div className="avatar">CB</div>
                <div>
                  <div className="name">Chef Brigade</div>
                  <div className="role">Chef de Brigade</div>
                </div>
              </div>
            </div>

            {/* ─── Stock par état ─── */}
            <div className="stock-grid">
              <div className="stock-card">
                <div className="dot neuf"></div>
                <div className="count">87</div>
                <div className="label">NEUF</div>
              </div>
              <div className="stock-card">
                <div className="dot bon"></div>
                <div className="count">62</div>
                <div className="label">BON</div>
              </div>
              <div className="stock-card">
                <div className="dot moyen"></div>
                <div className="count">28</div>
                <div className="label">MOYEN</div>
              </div>
              <div className="stock-card">
                <div className="dot mauvais"></div>
                <div className="count">7</div>
                <div className="label">MAUVAIS</div>
              </div>
              <div className="stock-card">
                <div className="dot hs"></div>
                <div className="count">3</div>
                <div className="label">HORS_SERVICE</div>
              </div>
            </div>

            {/* ─── Alertes stock bas ─── */}
            <div className="card">
              <h3>⚠️ Alertes stock bas</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Matériel</th>
                      <th>Stock actuel</th>
                      <th>Seuil</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Brouette 45L</strong></td>
                      <td>2</td>
                      <td>5</td>
                      <td>
                        <button
                          className="btn-sm primary"
                          onClick={() => handleApprovisionner('Brouette 45L')}
                        >
                          Approvisionner
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Échelle 6m</strong></td>
                      <td>3</td>
                      <td>5</td>
                      <td>
                        <button
                          className="btn-sm primary"
                          onClick={() => handleApprovisionner('Échelle 6m')}
                        >
                          Approvisionner
                        </button>
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

export default BrigadeStock;