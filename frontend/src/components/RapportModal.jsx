import React, { useState } from 'react';
import { TYPES, STATUTS, ROLES, fmtDate, fmtDateTime, concerneTexte } from './MouvementDetail';

/**
 * Construit un « instantané » de rapport à afficher dans <RapportModal />.
 *  mouvements : liste déjà filtrée
 *  stock      : liste du stock à afficher (ou null pour ne pas afficher la section stock)
 *  filtres    : étiquettes des filtres appliqués (tableau de texte)
 */
export const buildReport = ({ mouvements, stock = null, filtres = [], titre }) => {
  const list = [...mouvements].sort((a, b) => (b.date_mouvement || '').localeCompare(a.date_mouvement || '') || b.id - a.id);
  const parType = {};
  list.forEach(m => { parType[m.type] = (parType[m.type] || 0) + 1; });
  const parBrigade = {};
  list.forEach(m => {
    const k = m.brigade_nom ? `Brigade ${m.brigade_nom}` : 'Sans brigade (Service / Section)';
    parBrigade[k] = (parBrigade[k] || 0) + 1;
  });
  const st = stock || [];
  return {
    titre,
    generatedAt: new Date(),
    filtres: filtres.length ? filtres : ["Aucun filtre (tout l'historique)"],
    mouvements: list,
    stock,
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
  };
};

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


const RapportModal = ({ report, user, onClose }) => {
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


  if (!report) return null;

  return (
    <>
      <style>{`
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
      `}</style>

        <div className="rp-overlay" onClick={() => onClose()}>
          <div className="rp-card" onClick={(e) => e.stopPropagation()}>
            <div className="rp-head">
              <div>
                <h2>{report.titre || "Rapport d'activité du matériel"}</h2>
                <div className="rp-sub">Généré le {fmtDateTime(report.generatedAt)} par {user?.nom || ''} {user?.prenom || ''}</div>
                <div className="rp-chips">
                  {report.filtres.map((l, i) => <span key={i} className="rp-chip">{l}</span>)}
                </div>
              </div>
              <button className="rp-close" onClick={() => onClose()} aria-label="Fermer">✕</button>
            </div>

            <div className="rp-body">
              <div className="rp-kpis">
                <div className="rp-kpi"><div className="n">{report.stats.total}</div><div className="l">Mouvements</div></div>
                <div className="rp-kpi"><div className="n">{report.stats.quantite}</div><div className="l">Unités concernées</div></div>
                <div className="rp-kpi"><div className="n">{report.stats.emprunts}</div><div className="l">Emprunts en cours</div></div>
                <div className="rp-kpi"><div className="n">{report.stats.retards}</div><div className="l">Retards</div></div>
                {report.stock && <div className="rp-kpi"><div className="n">{report.stats.stockTotal}</div><div className="l">Stock total</div></div>}
                {report.stock && <div className="rp-kpi"><div className="n">{report.stats.abimes}</div><div className="l">Abîmés / HS</div></div>}
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
                          <td>{concerneTexte(m)}
                            {m.date_retour_prevue && <div className="sub">Retour prévu : {fmtDate(m.date_retour_prevue)}{m.date_retour_effective ? ` · rendu le ${fmtDate(m.date_retour_effective)}` : ''}</div>}
                          </td>
                          <td>{STATUTS[m.statut] || m.statut}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {report.stock && (
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
              )}
            </div>

            <div className="rp-foot" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#475569', flex: 1 }}>{pdfNotice}</div>
              <div style={{ display: 'flex' }}>
              <button className="btn-sm success" style={{ padding: '8px 22px', marginRight: '10px' }} onClick={handlePDF} disabled={pdfLoading}>{pdfLoading ? 'Création…' : '📄 PDF'}</button>
              <button className="btn-sm primary" style={{ padding: '8px 22px' }} onClick={() => onClose()}>Fermer</button>
              </div>
            </div>
          </div>
        </div>

    </>
  );
};

export default RapportModal;