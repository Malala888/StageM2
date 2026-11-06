import React, { useEffect, useState, useCallback, useRef } from 'react';
import MessageModal from './MessageModal';

const STORE_KEY = 'app_pending_message';

// Déduit le type (succès / erreur / info) et nettoie le texte d'un ancien alert()
const parseAlert = (raw) => {
  let text = String(raw ?? '').trim();
  let type = 'info';
  let title;
  if (text.startsWith('✅')) { type = 'success'; text = text.replace(/^✅\s*/, ''); }
  else if (/^(❌|⚠️|⛔)/.test(text)) { type = 'error'; text = text.replace(/^(❌|⚠️|⛔)\s*/, ''); }
  else if (/^(📤|📊|📄|📥|ℹ️)/.test(text)) { type = 'info'; text = text.replace(/^(📤|📊|📄|📥|ℹ️)\s*/, ''); }
  if (/rejet/i.test(text) && type === 'error') title = 'Rejeté';
  return { type, title, text, autoClose: type === 'success' ? 2800 : undefined };
};

/**
 * Remplace TOUS les alert() / confirm() du navigateur par de jolies fenêtres :
 *  - window.alert(msg)        -> popup succès / erreur / info
 *  - window.appConfirm(msg)   -> popup de confirmation (renvoie une Promise<boolean>)
 * Le message d'un alert() suivi d'un rechargement de page est conservé et réaffiché.
 */
const AppDialogs = () => {
  const [message, setMessage] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const resolver = useRef(null);

  const show = useCallback((msg, persist = true) => {
    setMessage(msg);
    if (persist) {
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ msg, ts: Date.now() })); } catch (e) { /* ignoré */ }
    }
  }, []);

  const clearStore = () => { try { sessionStorage.removeItem(STORE_KEY); } catch (e) { /* ignoré */ } };

  useEffect(() => {
    // Message laissé par la page précédente (ex. alert() suivi d'un rechargement)
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const { msg, ts } = JSON.parse(raw);
        if (Date.now() - ts < 8000) setMessage(msg);
        sessionStorage.removeItem(STORE_KEY);
      }
    } catch (e) { /* ignoré */ }

    const nativeAlert = window.alert;
    window.alert = (raw) => show(parseAlert(raw));
    window.appConfirm = (question, opts = {}) => new Promise((resolve) => {
      resolver.current = resolve;
      setConfirmState({ question: String(question ?? ''), ...opts });
    });
    return () => { window.alert = nativeAlert; };
  }, [show]);

  const answer = (v) => {
    setConfirmState(null);
    if (resolver.current) { resolver.current(v); resolver.current = null; }
  };

  const danger = confirmState && /supprim|rejet|annul/i.test(confirmState.question);

  return (
    <>
      <MessageModal message={message} onClose={() => { setMessage(null); clearStore(); }} />
      {confirmState && (
        <>
          <style>{`
            .cf-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2100; padding: 16px; font-family: 'Inter', sans-serif; }
            .cf-card { background: #fff; border-radius: 18px; width: 100%; max-width: 400px; padding: 28px 26px 22px; text-align: center; box-shadow: 0 24px 60px -12px rgba(15,23,42,0.35); }
            .cf-icon { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 16px; }
            .cf-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
            .cf-text { font-size: 0.88rem; color: #475569; line-height: 1.55; margin-bottom: 22px; word-break: break-word; white-space: pre-line; }
            .cf-row { display: flex; gap: 10px; }
            .cf-btn { flex: 1; padding: 11px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 600; cursor: pointer; font-family: inherit; border: none; }
            .cf-btn.cancel { background: #f1f5f9; color: #475569; }
            .cf-btn.ok { color: #fff; }
          `}</style>
          <div className="cf-overlay" onClick={() => answer(false)} role="alertdialog" aria-modal="true">
            <div className="cf-card" onClick={(e) => e.stopPropagation()}>
              <div className="cf-icon" style={{ background: danger ? '#fee2e2' : '#dbeafe', color: danger ? '#dc2626' : '#2563eb' }}>
                {danger ? '!' : '?'}
              </div>
              <div className="cf-title">{confirmState.title || 'Confirmation'}</div>
              <div className="cf-text">{confirmState.question}</div>
              <div className="cf-row">
                <button className="cf-btn cancel" onClick={() => answer(false)}>Annuler</button>
                <button className="cf-btn ok" style={{ background: danger ? '#dc2626' : '#2563eb' }} onClick={() => answer(true)} autoFocus>
                  {confirmState.okLabel || 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AppDialogs;