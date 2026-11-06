import React, { useState, useEffect } from 'react';
import { useLoaderData, useRouteError } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

// ─── Cache mémoire ───
let rapportsCache = null;
let rapportsCacheTime = 0;
const CACHE_TTL_MS = 15000;

async function fetchRapportsData() {
  const now = Date.now();
  if (rapportsCache && now - rapportsCacheTime < CACHE_TTL_MS) {
    return rapportsCache;
  }

  const [
    { data: userData },
    { data: mouvementsData },
    { data: stockData },
    { data: materielsData },
    { data: brigadesData },
  ] = await Promise.all([
    api.get('/accounts/users/me/'),
    api.get('/materiaux/mouvements/'),
    api.get('/materiaux/stock/'),
    api.get('/materiaux/materiels/'),
    api.get('/personnel/brigades/'),
  ]);

  // Statistiques globales
  const totalMouvements = mouvementsData.length;
  const empruntsEnCours = mouvementsData.filter(m => m.type === 'EMPRUNT' && m.statut === 'EN_COURS').length;
  const retards = mouvementsData.filter(m => m.statut === 'EN_RETARD').length;

  // Matériels abîmés (état MAUVAIS ou HORS_SERVICE)
  const materielsAbimes = stockData.filter(s => s.etat === 'MAUVAIS' || s.etat === 'HORS_SERVICE')
    .reduce((acc, s) => acc + s.quantite, 0);

  // Stock total
  const stockTotal = stockData.reduce((acc, s) => acc + s.quantite, 0);

  // Statistiques par brigade (nombre de mouvements par brigade)
  const statsParBrigade = brigadesData.map(b => {
    const count = mouvementsData.filter(m => m.brigade === b.id).length;
    return { ...b, count };
  }).sort((a, b) => b.count - a.count);

  // Top 5 des matériels les plus empruntés (via les mouvements EMPRUNT)
  const empruntsParMateriel = {};
  mouvementsData
    .filter(m => m.type === 'EMPRUNT')
    .forEach(m => {
      const id = m.materiel;
      if (!empruntsParMateriel[id]) empruntsParMateriel[id] = 0;
      empruntsParMateriel[id] += m.quantite;
    });
  const topMateriels = Object.entries(empruntsParMateriel)
    .map(([id, qte]) => ({ id: parseInt(id), qte }))
    .sort((a, b) => b.qte - a.qte)
    .slice(0, 5)
    .map(item => {
      const m = materielsData.find(mat => mat.id === item.id);
      return m ? { nom: m.nom, qte: item.qte } : null;
    })
    .filter(Boolean);

  const result = {
    user: userData,
    mouvements: mouvementsData,
    stock: stockData,
    materiels: materielsData,
    brigades: brigadesData,
    totalMouvements,
    empruntsEnCours,
    retards,
    materielsAbimes,
    stockTotal,
    statsParBrigade,
    topMateriels,
  };

  rapportsCache = result;
  rapportsCacheTime = now;
  return result;
}

// ─── Loader ───
export async function serviceRapportsLoader() {
  return fetchRapportsData();
}

// ─── ErrorElement ───
export function ServiceRapportsError() {
  const error = useRouteError();
  console.error('Erreur lors du chargement des rapports:', error);
  return (
    <div className="rapports-body">
      <div className="app">
        <Sidebar />
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
const ServiceRapports = () => {
  const {
    user,
    mouvements,
    stock,
    materiels,
    brigades,
    totalMouvements,
    empruntsEnCours,
    retards,
    materielsAbimes,
    stockTotal,
    statsParBrigade,
    topMateriels,
  } = useLoaderData();

  // États pour les filtres
  const [periode, setPeriode] = useState('');
  const [brigade, setBrigade] = useState('');
  const [dateDu, setDateDu] = useState('');
  const [dateAu, setDateAu] = useState('');
  const [typeF, setTypeF] = useState('');
  const [statutF, setStatutF] = useState('');
  const [materielF, setMaterielF] = useState('');
  const [showAdv, setShowAdv] = useState(false);
  const [report, setReport] = useState(null); // rapport généré (affiché en popup)

  // ─── Mouvements filtrés selon la période et la brigade choisies ───
  const getDateLimite = (p) => {
    const now = new Date();
    if (p === 'mois') return new Date(now.getFullYear(), now.getMonth(), 1);
    if (p === 'trimestre') return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    if (p === 'annee') return new Date(now.getFullYear(), 0, 1);
    return null;
  };

  const mouvementsFiltres = mouvements.filter(m => {
    if (brigade && m.brigade !== parseInt(brigade)) return false;
    if (typeF && m.type !== typeF) return false;
    if (statutF && m.statut !== statutF) return false;
    if (materielF && m.materiel !== parseInt(materielF)) return false;
    if (periode) {
      const limite = getDateLimite(periode);
      if (limite && new Date(m.date_mouvement) < limite) return false;
    }
    if (dateDu && m.date_mouvement < dateDu) return false;
    if (dateAu && m.date_mouvement > dateAu) return false;
    return true;
  });

  // ─── Statistiques recalculées à partir des mouvements filtrés ───
  const totalMouvementsF = mouvementsFiltres.length;
  const empruntsEnCoursF = mouvementsFiltres.filter(m => m.type === 'EMPRUNT' && m.statut === 'EN_COURS').length;
  const retardsF = mouvementsFiltres.filter(m => m.statut === 'EN_RETARD').length;

  const statsParBrigadeF = brigades
    .filter(b => !brigade || b.id === parseInt(brigade))
    .map(b => ({ ...b, count: mouvementsFiltres.filter(m => m.brigade === b.id).length }))
    .sort((a, b2) => b2.count - a.count);

  const empruntsParMaterielF = {};
  mouvementsFiltres
    .filter(m => m.type === 'EMPRUNT')
    .forEach(m => {
      const id = m.materiel;
      empruntsParMaterielF[id] = (empruntsParMaterielF[id] || 0) + m.quantite;
    });
  const topMaterielsF = Object.entries(empruntsParMaterielF)
    .map(([id, qte]) => ({ id: parseInt(id), qte }))
    .sort((a, b2) => b2.qte - a.qte)
    .slice(0, 5)
    .map(item => {
      const m = materiels.find(mat => mat.id === item.id);
      return m ? { nom: m.nom, qte: item.qte } : null;
    })
    .filter(Boolean);

  // Le stock n'a pas de date : le filtre "période" ne s'y applique pas.
  // On filtre par brigade seulement si les lignes de stock portent bien un champ brigade.
  const stockFiltre = brigade ? stock.filter(s => s.brigade == null || s.brigade === parseInt(brigade)) : stock;
  const materielsAbimesF = stockFiltre.filter(s => s.etat === 'MAUVAIS' || s.etat === 'HORS_SERVICE').reduce((acc, s) => acc + s.quantite, 0);
  const stockTotalF = stockFiltre.reduce((acc, s) => acc + s.quantite, 0);

  // ─── Libellés ───
  const ROLES = { ADMIN: 'Chef de Service', CHEF_SECTION: 'Chef de Section', CHEF_BRIGADE: 'Chef de Brigade', GL: 'GL', CN: 'CN' };
  const TYPES = {
    APPROVISIONNEMENT: 'Approvisionnement', EMPRUNT: 'Emprunt', RETOUR: 'Retour', TRANSFERT: 'Transfert',
    REPARATION: 'Réparation', REBUT: 'Mise au rebut', INVENTAIRE: 'Inventaire',
  };
  const STATUTS = {
    DEMANDE: 'Demande en attente', EN_COURS: 'En cours', RETOURNE: 'Retourné', EN_RETARD: 'En retard',
    REJETEE: 'Rejetée', PERDU: 'Perdu', ANNULE: 'Annulé',
  };
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
  const fmtDateTime = (d) => d.toLocaleString('fr-FR');

  const getConcerne = (m) => {
    if (m.type === 'TRANSFERT') return `Brigade ${m.brigade_nom || '—'} → Brigade ${m.brigade_destination_nom || '—'}`;
    if (m.agent_concerner_nom) {
      const r = m.agent_concerner_brigade_nom ? ` · Brigade ${m.agent_concerner_brigade_nom}`
        : (m.agent_concerner_section_nom ? ` · Section ${m.agent_concerner_section_nom}` : '');
      return `${m.agent_concerner_nom} (${ROLES[m.agent_concerner_role] || 'Agent'}${r})`;
    }
    if (m.brigade_nom) return `Brigade ${m.brigade_nom}${m.brigade_section_nom ? ` (Section ${m.brigade_section_nom})` : ''}`;
    if (m.createur_role === 'CHEF_SECTION' && m.createur_section_nom) return `Section ${m.createur_section_nom}`;
    return 'Chef de Service (niveau Service)';
  };

  const getPhrase = (m) => {
    const qui = m.createur_nom ? `${m.createur_nom} (${ROLES[m.createur_role] || 'Utilisateur'})` : 'Un utilisateur';
    const q = `${m.quantite} × ${m.materiel_nom || 'matériel'}${m.etat ? ` [${m.etat}]` : ''}`;
    const c = getConcerne(m);
    switch (m.type) {
      case 'APPROVISIONNEMENT': return `${qui} a ajouté ${q} au stock : ${c}.`;
      case 'EMPRUNT': return `${qui} a enregistré l'emprunt de ${q} par ${c}.`;
      case 'RETOUR': return `${qui} a enregistré le retour de ${q} par ${c}.`;
      case 'TRANSFERT': return `${qui} a transféré ${q} : ${c}.`;
      case 'REPARATION': return `${qui} a envoyé ${q} en réparation (${c}).`;
      case 'REBUT': return `${qui} a mis au rebut ${q} (${c}).`;
      case 'INVENTAIRE': return `${qui} a fixé le stock à ${q} (${c}).`;
      default: return `${qui} a effectué un mouvement : ${q}.`;
    }
  };

  const resetFiltres = () => {
    setPeriode(''); setBrigade(''); setDateDu(''); setDateAu('');
    setTypeF(''); setStatutF(''); setMaterielF('');
  };

  // ─── Générer : fige un instantané du rapport et l'affiche en popup ───
  const handleGenerer = (override) => {
    const f = {
      periode, brigade, dateDu, dateAu, typeF, statutF, materielF, ...(override || {}),
    };
    const limite = getDateLimite(f.periode);
    const list = mouvements
      .filter(m => {
        if (f.brigade && m.brigade !== parseInt(f.brigade)) return false;
        if (f.typeF && m.type !== f.typeF) return false;
        if (f.statutF && m.statut !== f.statutF) return false;
        if (f.materielF && m.materiel !== parseInt(f.materielF)) return false;
        if (limite && new Date(m.date_mouvement) < limite) return false;
        if (f.dateDu && m.date_mouvement < f.dateDu) return false;
        if (f.dateAu && m.date_mouvement > f.dateAu) return false;
        return true;
      })
      .sort((a, b) => (b.date_mouvement || '').localeCompare(a.date_mouvement || '') || b.id - a.id);

    const st = stock.filter(x => {
      if (f.brigade && x.brigade != null && x.brigade !== parseInt(f.brigade)) return false;
      if (f.brigade && x.brigade == null) return false;
      if (f.materielF && x.materiel !== parseInt(f.materielF)) return false;
      return true;
    });

    const parType = {};
    list.forEach(m => { parType[m.type] = (parType[m.type] || 0) + 1; });
    const parBrigade = {};
    list.forEach(m => {
      const k = m.brigade_nom ? `Brigade ${m.brigade_nom}` : 'Sans brigade (Service / Section)';
      parBrigade[k] = (parBrigade[k] || 0) + 1;
    });

    const labels = [];
    if (f.periode) labels.push({ mois: 'Ce mois', trimestre: 'Ce trimestre', annee: 'Cette année' }[f.periode]);
    if (f.dateDu || f.dateAu) labels.push(`Du ${f.dateDu ? fmtDate(f.dateDu) : '…'} au ${f.dateAu ? fmtDate(f.dateAu) : '…'}`);
    if (f.brigade) labels.push(`Brigade ${brigades.find(b => b.id === parseInt(f.brigade))?.nom || ''}`);
    if (f.typeF) labels.push(TYPES[f.typeF]);
    if (f.statutF) labels.push(STATUTS[f.statutF]);
    if (f.materielF) labels.push(materiels.find(mm => mm.id === parseInt(f.materielF))?.nom || 'Matériel');

    setPdfNotice('');
    setReport({
      generatedAt: new Date(),
      filtres: labels.length ? labels : ['Aucun filtre (tout l\'historique)'],
      mouvements: list,
      stock: st,
      stats: {
        total: list.length,
        emprunts: list.filter(m => m.type === 'EMPRUNT' && m.statut === 'EN_COURS').length,
        retards: list.filter(m => m.statut === 'EN_RETARD').length,
        quantite: list.reduce((a, m) => a + (m.quantite || 0), 0),
        stockTotal: st.reduce((a, x) => a + x.quantite, 0),
        abimes: st.filter(x => x.etat === 'MAUVAIS' || x.etat === 'HORS_SERVICE').reduce((a, x) => a + x.quantite, 0),
      },
      parType: Object.entries(parType).sort((a, b) => b[1] - a[1]),
      parBrigade: Object.entries(parBrigade).sort((a, b) => b[1] - a[1]),
    });
  };

  // ─── PDF : reproduit exactement ce qui est affiché dans le popup ───
  // HTML mis en page du rapport (même rendu pour l'impression Firefox et le PDF direct)
  const buildReportHtml = (headHtml, bodyHtml, titre) => `<!doctype html><html><head><meta charset="utf-8"><title>${titre}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; padding: 8px; font-size: 12px; margin: 0; }
          h2 { font-size: 20px; margin: 0 0 4px; } h4 { font-size: 14px; margin: 18px 0 8px; }
          .rp-sub { color: #64748b; font-size: 11px; } .rp-chips { margin: 8px 0 14px; }
          .rp-chip { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 2px 9px; border-radius: 999px; font-size: 11px; margin-right: 5px; }
          .rp-kpis { display: flex; gap: 10px; margin: 14px 0; flex-wrap: wrap; }
          .rp-kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; min-width: 110px; }
          .rp-kpi .n { font-size: 18px; font-weight: bold; } .rp-kpi .l { font-size: 10px; color: #64748b; text-transform: uppercase; }
          .rp-two { display: flex; gap: 20px; } .rp-two > div { flex: 1; }
          table { width: 100%; border-collapse: collapse; } th { text-align: left; background: #f1f5f9; padding: 6px 8px; font-size: 10px; text-transform: uppercase; }
          td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; } .sub { color: #64748b; font-size: 10px; }
          tr { page-break-inside: avoid; } thead { display: table-header-group; } .rp-close { display: none; }
          @page { margin: 12mm; }
        </style></head><body>${headHtml}${bodyHtml}</body></html>`;

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfNotice, setPdfNotice] = useState('');
  const handlePDF = async () => {
    if (!report || pdfLoading) return;
    const d = report.generatedAt;
    const pad = (n) => String(n).padStart(2, '0');
    const nom = `rapport-materiel-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.pdf`;

    // 1) Chrome / Edge : on demande l'emplacement TOUT DE SUITE (au clic).
    //    Le navigateur n'autorise cette fenêtre que juste après un clic ;
    //    si on attend la fin de la génération du PDF, elle est refusée.
    let fileHandle = null;
    if (window.showSaveFilePicker) {
      try {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: nom,
          types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
        });
      } catch (e) {
        if (e && e.name === 'AbortError') return; // annulé par l'utilisateur
        fileHandle = null; // sinon : téléchargement classique
      }
    }

    // Firefox : pas de fenêtre "Enregistrer sous" pour les sites -> on passe par la
    // fenêtre d'enregistrement PDF du navigateur (où l'on choisit le dossier).
    if (!window.showSaveFilePicker) {
      const hd = document.querySelector('.rp-head > div');
      const bd = document.querySelector('.rp-body');
      if (!hd || !bd) return;
      const win = window.open('', '_blank');
      if (!win) { alert('Autorise les fenêtres pop-up pour générer le PDF.'); return; }
      win.document.write(buildReportHtml(hd.innerHTML, bd.innerHTML, nom.replace('.pdf', '')));
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
      setPdfNotice('Dans la fenêtre qui s\'ouvre, choisis « Enregistrer au format PDF » puis l\'emplacement.');
      return;
    }

    setPdfLoading(true);
    setPdfNotice('');
    let box = null;
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Mise en page "rapport" (celle de l'impression) rendue dans un cadre invisible
      const head = document.querySelector('.rp-head > div');
      const body = document.querySelector('.rp-body');
      if (!head || !body) return;
      box = document.createElement('iframe');
      box.style.cssText = 'position:fixed;left:-10000px;top:0;width:720px;height:600px;border:0;';
      document.body.appendChild(box);
      const idoc = box.contentDocument;
      idoc.open();
      idoc.write(buildReportHtml(head.innerHTML, body.innerHTML, nom.replace('.pdf', '')));
      idoc.close();
      await new Promise(r => setTimeout(r, 150));
      const target = idoc.body;
      box.style.height = target.scrollHeight + 20 + 'px';

      const boxW = target.offsetWidth;
      const boxH = target.scrollHeight;
      const top0 = target.getBoundingClientRect().top;

      // Points de coupure autorisés (bas des lignes / blocs) pour ne pas couper une ligne en deux
      const cuts = new Set([0]);
      idoc.querySelectorAll('tr, .rp-kpis, .rp-two').forEach(el => {
        cuts.add(Math.round(el.getBoundingClientRect().bottom - top0));
      });
      idoc.querySelectorAll('h4').forEach(el => {
        cuts.add(Math.round(el.getBoundingClientRect().top - top0)); // couper juste avant un titre
      });
      const cutList = [...cuts].sort((a, b) => a - b);

      const canvas = await html2canvas(target, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false, windowWidth: boxW });

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 12;
      const mmPerPx = (pageW - margin * 2) / boxW;
      const pagePx = Math.floor((pageH - margin * 2 - 6) / mmPerPx); // hauteur utile d'une page (px écran)

      let start = 0;
      let pageNo = 0;
      const slices = [];
      while (start < boxH - 1) {
        const limit = start + pagePx;
        let end;
        if (limit >= boxH) {
          end = boxH;
        } else {
          const candidates = cutList.filter(c => c > start + pagePx * 0.4 && c <= limit);
          end = candidates.length ? candidates[candidates.length - 1] : limit;
        }
        slices.push([start, end]);
        start = end;
      }

      slices.forEach(([a, b], idx) => {
        const sliceH = Math.max(1, Math.round((b - a) * 2));
        const part = document.createElement('canvas');
        part.width = canvas.width;
        part.height = sliceH;
        const ctx = part.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, part.width, part.height);
        ctx.drawImage(canvas, 0, Math.round(a * 2), canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        if (idx > 0) doc.addPage();
        doc.addImage(part.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, pageW - margin * 2, (b - a) * mmPerPx);
        pageNo = idx + 1;
        doc.setFontSize(8); doc.setTextColor(130);
        doc.text(`Page ${pageNo} / ${slices.length}`, pageW - margin, pageH - 4, { align: 'right' });
      });

      const blob = doc.output('blob');

      if (fileHandle) {
        const w = await fileHandle.createWritable();
        await w.write(blob);
        await w.close();
        setPdfNotice('✅ PDF enregistré à l\'emplacement choisi.');
        return;
      }
      // Firefox et autres : téléchargement (l'emplacement dépend du réglage du navigateur)
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = nom;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setPdfNotice(`✅ PDF téléchargé (${nom}). Ton navigateur ne permet pas de choisir le dossier depuis le site : dans Firefox, active Paramètres > Général > « Toujours demander où enregistrer les fichiers », ou utilise Chrome / Edge.`);
    } catch (err) {
      console.error(err);
      alert("Impossible de générer le PDF. Vérifie que 'jspdf' et 'html2canvas' sont installés (npm install jspdf html2canvas).");
    } finally {
      if (box && box.parentNode) box.parentNode.removeChild(box);
      setPdfLoading(false);
    }
  };

  // Cliquer sur une carte = générer le rapport correspondant
  const handleCardClick = (preset) => {
    setTypeF(preset?.typeF || '');
    setStatutF(preset?.statutF || '');
    handleGenerer({ typeF: '', statutF: '', ...(preset || {}) });
  };

  // Fonction pour obtenir le nombre de mouvements par brigade
  const getMouvementsByBrigade = (brigadeId) => {
    return mouvementsFiltres.filter(m => m.brigade === brigadeId).length;
  };

  // Fonction pour obtenir le top des matériels
  const getTopMateriels = () => {
    return topMaterielsF.map((m, i) => `${i+1}. ${m.nom} (${m.qte})`).join('\n');
  };

  // Stats par état du stock (filtré)
  const statsParEtat = stockFiltre.reduce((acc, s) => {
    acc[s.etat] = (acc[s.etat] || 0) + s.quantite;
    return acc;
  }, {});

  const totalAbimes = (statsParEtat['MAUVAIS'] || 0) + (statsParEtat['HORS_SERVICE'] || 0);


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
          display: flex;
          min-height: 100vh;
        }

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
        .badge.orange { background: #fef3c7; color: #ca8a04; }

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

        .f-date { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #475569; }
        .rp-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
        .rp-card { background: #fff; border-radius: 18px; width: 100%; max-width: 1100px; max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.3); }
        .rp-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 26px; border-bottom: 1px solid #e2e8f0; }
        .rp-head h2 { font-size: 1.25rem; }
        .rp-sub { font-size: 0.8rem; color: #64748b; margin-top: 4px; }
        .rp-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .rp-chip { background: #eff6ff; color: #1d4ed8; padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
        .rp-close { background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #64748b; }
        .rp-body { overflow-y: auto; padding: 20px 26px 26px; }
        .rp-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 22px; }
        .rp-kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; }
        .rp-kpi .n { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
        .rp-kpi .l { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
        .rp-section { margin-bottom: 26px; }
        .rp-section h4 { font-size: 0.95rem; margin-bottom: 10px; color: #0f172a; }
        .rp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .rp-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .rp-table th { text-align: left; padding: 8px 10px; background: #f1f5f9; color: #475569; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .rp-table td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        .rp-table .sub { font-size: 0.72rem; color: #64748b; margin-top: 2px; }
        .rp-phrase { font-size: 0.78rem; color: #334155; margin-top: 4px; font-style: italic; }
        .rp-empty { padding: 24px; text-align: center; color: #94a3b8; }
        .rp-foot { padding: 14px 26px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; }
        @media (max-width: 800px) { .rp-two { grid-template-columns: 1fr; } }
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
          .report-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .report-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rapports-body">
        <div className="app">

          <Sidebar />

          <main className="main">

            <div className="page-header">
              <div>
                <h1>Rapports</h1>
                <div className="sub">Analyses et statistiques</div>
              </div>
              <div className="user-badge">
                <div className="avatar">{user?.nom ? user.nom[0] : 'AD'}</div>
                <div>
                  <div className="name">{user?.nom || 'Admin'}</div>
                  <div className="role">{user?.role || '—'}</div>
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
              <select value={brigade} onChange={(e) => setBrigade(e.target.value)}>
                <option value="">Toutes les brigades</option>
                {brigades.map(b => (
                  <option key={b.id} value={b.id}>{b.nom}</option>
                ))}
              </select>
              <button className="btn-sm outline" style={{ padding: '8px 16px' }} onClick={() => setShowAdv(v => !v)}>
                {showAdv ? '− Moins de filtres' : '＋ Plus de filtres'}
              </button>
              <button className="btn-sm primary" style={{ padding: '8px 20px' }} onClick={() => handleGenerer()}>
                Générer
              </button>
            </div>

            {showAdv && (
              <div className="filters">
                <label className="f-date">Du <input type="date" value={dateDu} onChange={(e) => setDateDu(e.target.value)} /></label>
                <label className="f-date">Au <input type="date" value={dateAu} onChange={(e) => setDateAu(e.target.value)} /></label>
                <select value={typeF} onChange={(e) => setTypeF(e.target.value)}>
                  <option value="">Tous les types</option>
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={statutF} onChange={(e) => setStatutF(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={materielF} onChange={(e) => setMaterielF(e.target.value)}>
                  <option value="">Tous les matériels</option>
                  {materiels.map(mm => <option key={mm.id} value={mm.id}>{mm.nom}</option>)}
                </select>
                <button className="btn-sm outline" style={{ padding: '8px 16px' }} onClick={resetFiltres}>Réinitialiser</button>
              </div>
            )}

            {/* ─── Cartes de rapports ─── */}
            <div className="report-grid">
              <div className="report-card" onClick={() => handleCardClick({ typeF: 'EMPRUNT', statutF: 'EN_COURS' })}>
                <div className="icon">📊</div>
                <div className="title">Emprunts en cours</div>
                <div className="desc">{empruntsEnCoursF} matériels actuellement empruntés</div>
                <span className="badge yellow">{empruntsEnCoursF > 0 ? `+${empruntsEnCoursF} en cours` : 'Aucun'}</span>
              </div>
              <div className="report-card" onClick={() => handleCardClick({ statutF: 'EN_RETARD' })}>
                <div className="icon">⏰</div>
                <div className="title">Retards</div>
                <div className="desc">{retardsF} retards signalés</div>
                <span className="badge red">{retardsF > 0 ? `${retardsF} à traiter` : '✅ Aucun'}</span>
              </div>
              <div className="report-card" onClick={() => handleCardClick()}>
                <div className="icon">🏢</div>
                <div className="title">Par Brigade</div>
                <div className="desc">{statsParBrigadeF.slice(0, 3).map(b => `${b.nom} : ${b.count}`).join(' | ')}</div>
                <span className="badge blue">Voir détails</span>
              </div>
              <div className="report-card" onClick={() => handleCardClick({ typeF: 'REPARATION' })}>
                <div className="icon">🔧</div>
                <div className="title">Matériels abîmés</div>
                <div className="desc">{materielsAbimesF} en mauvais état</div>
                <span className="badge orange">{materielsAbimesF > 0 ? `+${materielsAbimesF} à réparer` : '✅ Bon état'}</span>
              </div>
              <div className="report-card" onClick={() => handleCardClick()}>
                <div className="icon">📦</div>
                <div className="title">Stock total</div>
                <div className="desc">{stockTotalF} unités en stock</div>
                <span className="badge green">{stockTotalF > 0 ? `${stockTotalF} disponibles` : 'Stock vide'}</span>
              </div>
              <div className="report-card" onClick={() => handleCardClick()}>
                <div className="icon">🔄</div>
                <div className="title">Mouvements</div>
                <div className="desc">{totalMouvementsF} opérations au total</div>
                <span className="badge blue">{totalMouvementsF > 0 ? `+${totalMouvementsF} enregistrés` : 'Aucun'}</span>
              </div>
            </div>

            {/* ─── Détails supplémentaires ─── */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px' }}>📋 Top 5 des matériels les plus empruntés</h3>
              {topMaterielsF.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {topMaterielsF.map((m, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span><strong>{i+1}.</strong> {m.nom}</span>
                      <span className="badge blue">{m.qte} emprunts</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#94a3b8' }}>Aucun emprunt enregistré</p>
              )}
            </div>

          </main>
        </div>
      </div>

      {report && (
        <div className="rp-overlay" onClick={() => setReport(null)}>
          <div className="rp-card" onClick={(e) => e.stopPropagation()}>
            <div className="rp-head">
              <div>
                <h2>Rapport d'activité du matériel</h2>
                <div className="rp-sub">Généré le {fmtDateTime(report.generatedAt)} par {user?.nom || 'Chef de Service'} {user?.prenom || ''}</div>
                <div className="rp-chips">
                  {report.filtres.map((l, i) => <span key={i} className="rp-chip">{l}</span>)}
                </div>
              </div>
              <button className="rp-close" onClick={() => setReport(null)} aria-label="Fermer">✕</button>
            </div>

            <div className="rp-body">
              <div className="rp-kpis">
                <div className="rp-kpi"><div className="n">{report.stats.total}</div><div className="l">Mouvements</div></div>
                <div className="rp-kpi"><div className="n">{report.stats.quantite}</div><div className="l">Unités concernées</div></div>
                <div className="rp-kpi"><div className="n">{report.stats.emprunts}</div><div className="l">Emprunts en cours</div></div>
                <div className="rp-kpi"><div className="n">{report.stats.retards}</div><div className="l">Retards</div></div>
                <div className="rp-kpi"><div className="n">{report.stats.stockTotal}</div><div className="l">Stock total</div></div>
                <div className="rp-kpi"><div className="n">{report.stats.abimes}</div><div className="l">Abîmés / HS</div></div>
              </div>

              <div className="rp-section rp-two">
                <div>
                  <h4>Répartition par type</h4>
                  <table className="rp-table"><tbody>
                    {report.parType.length === 0 ? <tr><td className="rp-empty">Aucun mouvement</td></tr> :
                      report.parType.map(([k, n]) => <tr key={k}><td>{TYPES[k] || k}</td><td style={{ textAlign: 'right' }}><strong>{n}</strong></td></tr>)}
                  </tbody></table>
                </div>
                <div>
                  <h4>Répartition par lieu</h4>
                  <table className="rp-table"><tbody>
                    {report.parBrigade.length === 0 ? <tr><td className="rp-empty">Aucun mouvement</td></tr> :
                      report.parBrigade.map(([k, n]) => <tr key={k}><td>{k}</td><td style={{ textAlign: 'right' }}><strong>{n}</strong></td></tr>)}
                  </tbody></table>
                </div>
              </div>

              <div className="rp-section">
                <h4>Historique détaillé des mouvements ({report.mouvements.length})</h4>
                {report.mouvements.length === 0 ? (
                  <div className="rp-empty">Aucun mouvement pour ces filtres.</div>
                ) : (
                  <table className="rp-table">
                    <thead>
                      <tr><th>Date</th><th>Mouvement</th><th>Matériel</th><th>Effectué par</th><th>Concerné / lieu</th><th>Statut</th></tr>
                    </thead>
                    <tbody>
                      {report.mouvements.map(m => (
                        <tr key={m.id}>
                          <td><strong>{fmtDate(m.date_mouvement)}</strong><div className="sub">{m.numero}</div></td>
                          <td>{TYPES[m.type] || m.type}</td>
                          <td><strong>{m.materiel_nom}</strong><div className="sub">× {m.quantite}{m.etat ? ` · ${m.etat}` : ''}</div></td>
                          <td>{m.createur_nom || '—'}<div className="sub">{ROLES[m.createur_role] || ''}</div></td>
                          <td>{getConcerne(m)}
                            {m.date_retour_prevue && <div className="sub">Retour prévu : {fmtDate(m.date_retour_prevue)}{m.date_retour_effective ? ` · rendu le ${fmtDate(m.date_retour_effective)}` : ''}</div>}
                          </td>
                          <td>{STATUTS[m.statut] || m.statut}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="rp-section">
                <h4>Où sont les matériels (stock actuel)</h4>
                {report.stock.length === 0 ? (
                  <div className="rp-empty">Aucun stock pour ces filtres.</div>
                ) : (
                  <table className="rp-table">
                    <thead><tr><th>Matériel</th><th>État</th><th>Lieu</th><th style={{ textAlign: 'right' }}>Quantité</th></tr></thead>
                    <tbody>
                      {[...report.stock].sort((a, b) => (a.materiel_nom || '').localeCompare(b.materiel_nom || '')).map(x => (
                        <tr key={x.id}>
                          <td><strong>{x.materiel_nom}</strong></td>
                          <td>{x.etat}</td>
                          <td>{x.brigade_nom ? `Brigade ${x.brigade_nom}` : 'Niveau Service / Section (sans brigade)'}</td>
                          <td style={{ textAlign: 'right' }}><strong>{x.quantite}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="rp-foot" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#475569', flex: 1 }}>{pdfNotice}</div>
              <div style={{ display: 'flex' }}>
              <button className="btn-sm success" style={{ padding: '8px 22px', marginRight: '10px' }} onClick={handlePDF} disabled={pdfLoading}>{pdfLoading ? 'Création…' : '📄 PDF'}</button>
              <button className="btn-sm primary" style={{ padding: '8px 22px' }} onClick={() => setReport(null)}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceRapports;