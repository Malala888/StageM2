import React, { useState, useEffect, useRef } from 'react';
import BrigadeSidebar from '../components/BrigadeSidebar';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

const BrigadeMouvements = () => {
  // ─── States pour le formulaire ───
  const [type, setType] = useState('');
  const [materiel, setMateriel] = useState('');
  const [agent, setAgent] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [date, setDate] = useState('');
  const [commentaire, setCommentaire] = useState('');

  // ─── States pour les filtres ───
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // ─── Référence pour le champ date ───
  const dateInputRef = useRef(null);

  // ─── Initialiser la date du jour ───
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    if (dateInputRef.current) {
      dateInputRef.current.value = today;
    }
  }, []);

  // ─── Handlers ───
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('✅ Mouvement enregistré avec succès !');
    // Réinitialiser le formulaire
    setType('');
    setMateriel('');
    setAgent('');
    setQuantite(1);
    setCommentaire('');
  };

  const handleFilter = (e) => {
    e.preventDefault();
    alert('Filtres appliqués !');
  };

  const handleDetail = (numero) => {
    alert(`📄 Détail du mouvement : ${numero}`);
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

        .mouvements-body {
          font-family: 'Inter', sans-serif;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
          color: #0f172a;
          min-height: 100vh;
        }

        .mouvements-body::before {
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
          display: block;        /* plus de flex, car sidebar fixed */
          min-height: 100vh;
        }

        /* ─── Le main est décalé pour la sidebar fixed ─── */
        .main {
          margin-left: 240px;   /* largeur de la sidebar */
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
          margin-bottom: 16px;
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

        .type-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .type-badge.appro { background: #dbeafe; color: #2563eb; }
        .type-badge.emprunt { background: #fef3c7; color: #d97706; }
        .type-badge.retour { background: #dcfce7; color: #16a34a; }
        .type-badge.transfert { background: #e0e7ff; color: #4f46e5; }
        .type-badge.reparation { background: #fce4ec; color: #dc2626; }
        .type-badge.rebut { background: #fee2e2; color: #b91c1c; }

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

        .actions-cell {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }
        .form-row .field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-row .field label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
        }
        .form-row .field input, .form-row .field select {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: rgba(255,255,255,0.7);
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-row .field input:focus, .form-row .field select:focus {
          border-color: #2563eb;
        }

        /* ─── Responsive ─── */
        @media (max-width: 1024px) {
          .main { margin-left: 200px; padding: 20px 24px; }
        }
        @media (max-width: 768px) {
          .main {
            margin-left: 0;        /* la sidebar devient fixe en haut ? 
                                    on peut aussi la rendre relative sur mobile,
                                    mais ici on garde le fixed et on laisse le padding */
            padding: 16px;
          }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="mouvements-body">
        <div className="app">
          {/* Sidebar fixed, importée depuis le composant séparé */}
          <BrigadeSidebar />

          <main className="main">
            <div className="page-header">
              <div>
                <h1>Mouvements</h1>
                <div className="sub">
                  Enregistrer et consulter l'historique — Brigade <span className="brigade-badge">BR FI</span>
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

            {/* ─── Formulaire d'enregistrement ─── */}
            <div className="card">
              <h3>📝 Nouveau mouvement</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="type">Type de mouvement</label>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="APPROVISIONNEMENT">📦 APPROVISIONNEMENT</option>
                      <option value="EMPRUNT">📤 EMPRUNT</option>
                      <option value="RETOUR">📥 RETOUR</option>
                      <option value="TRANSFERT">🔄 TRANSFERT</option>
                      <option value="REPARATION">🔧 RÉPARATION</option>
                      <option value="REBUT">🗑️ REBUT</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="materiel">Matériel</label>
                    <select
                      id="materiel"
                      value={materiel}
                      onChange={(e) => setMateriel(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="1">Pelle DS-12</option>
                      <option value="2">Brouette 45L</option>
                      <option value="3">Perceuse Bosh</option>
                      <option value="4">Échelle 6m</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="agent">Agent concerné</label>
                    <select
                      id="agent"
                      value={agent}
                      onChange={(e) => setAgent(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="1">Rakoto Jean (GL)</option>
                      <option value="2">Ranaivo Marie (CN)</option>
                      <option value="3">Andry R. (GL)</option>
                      <option value="4">Razafy L. (CN)</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="quantite">Quantité</label>
                    <input
                      type="number"
                      id="quantite"
                      value={quantite}
                      onChange={(e) => setQuantite(parseInt(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="date">Date</label>
                    <input
                      type="date"
                      id="date"
                      ref={dateInputRef}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="commentaire">Commentaire (optionnel)</label>
                    <input
                      type="text"
                      id="commentaire"
                      placeholder="Motif, remarque..."
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-sm primary"
                  style={{ padding: '10px 24px', fontSize: '0.85rem' }}
                >
                  ✅ Enregistrer le mouvement
                </button>
              </form>
            </div>

            {/* ─── Historique ─── */}
            <div className="card">
              <h3>📋 Historique des mouvements</h3>
              <div className="filters">
                <input
                  type="text"
                  placeholder="🔍 Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Tous les types</option>
                  <option value="APPROVISIONNEMENT">APPROVISIONNEMENT</option>
                  <option value="EMPRUNT">EMPRUNT</option>
                  <option value="RETOUR">RETOUR</option>
                  <option value="TRANSFERT">TRANSFERT</option>
                  <option value="RÉPARATION">RÉPARATION</option>
                  <option value="REBUT">REBUT</option>
                </select>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                <button
                  className="btn-sm primary"
                  style={{ padding: '8px 20px' }}
                  onClick={handleFilter}
                >
                  Filtrer
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Matériel</th>
                      <th>Type</th>
                      <th>Agent</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>MVT-2026-0001</strong></td>
                      <td>Pelle DS-12</td>
                      <td><span className="type-badge emprunt">EMPRUNT</span></td>
                      <td>Rakoto J.</td>
                      <td>24/07/2026</td>
                      <td><span className="badge yellow">En cours</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleDetail('MVT-2026-0001')}>📄</button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>MVT-2026-0002</strong></td>
                      <td>Brouette 45L</td>
                      <td><span className="type-badge retour">RETOUR</span></td>
                      <td>Ranaivo M.</td>
                      <td>23/07/2026</td>
                      <td><span className="badge green">Retourné</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleDetail('MVT-2026-0002')}>📄</button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>MVT-2026-0003</strong></td>
                      <td>Perceuse Bosh</td>
                      <td><span className="type-badge reparation">RÉPARATION</span></td>
                      <td>Andry R.</td>
                      <td>22/07/2026</td>
                      <td><span className="badge blue">En réparation</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleDetail('MVT-2026-0003')}>📄</button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>MVT-2026-0004</strong></td>
                      <td>Échelle 6m</td>
                      <td><span className="type-badge emprunt">EMPRUNT</span></td>
                      <td>Rakotomalala</td>
                      <td>20/07/2026</td>
                      <td><span className="badge red">En retard</span></td>
                      <td className="actions-cell">
                        <button className="btn-sm outline" onClick={() => handleDetail('MVT-2026-0004')}>📄</button>
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

export default BrigadeMouvements;