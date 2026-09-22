import React, { useEffect } from 'react';

/**
 * Popup de message réutilisable (succès / erreur / info).
 *
 * Usage :
 *   const [message, setMessage] = useState(null);
 *   setMessage({ type: 'error', text: 'Email déjà utilisé' });
 *   setMessage({ type: 'success', text: 'Compte créé !', autoClose: 3000, onClose: () => navigate('/') });
 *
 *   <MessageModal message={message} onClose={() => setMessage(null)} />
 *
 * Props :
 *   message : null | { type: 'success'|'error'|'info', title?, text, autoClose?, onClose? }
 *   onClose : appelée à la fermeture (clic extérieur, bouton, ou fermeture auto)
 */
const MessageModal = ({ message, onClose }) => {
  const autoClose = message?.autoClose;

  // Fermeture automatique (utile pour les messages de succès avant une redirection)
  useEffect(() => {
    if (!message || !autoClose) return;
    const timer = setTimeout(() => {
      if (message.onClose) message.onClose();
      if (onClose) onClose();
    }, autoClose);
    return () => clearTimeout(timer);
  }, [message, autoClose, onClose]);

  // Fermeture avec la touche Échap
  useEffect(() => {
    if (!message) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [message]);

  if (!message) return null;

  const handleClose = () => {
    if (message.onClose) message.onClose();
    if (onClose) onClose();
  };

  const type = message.type || 'info';
  const config = {
    success: { icon: '✓', color: '#16a34a', bg: '#dcfce7', titre: 'Succès' },
    error: { icon: '✕', color: '#dc2626', bg: '#fee2e2', titre: 'Erreur' },
    info: { icon: 'i', color: '#2563eb', bg: '#dbeafe', titre: 'Information' },
  }[type];

  return (
    <>
      <style>{`
        @keyframes msgFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes msgPopIn {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .msg-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 16px;
          animation: msgFadeIn 0.15s ease-out;
          font-family: 'Inter', sans-serif;
        }
        .msg-card {
          background: #ffffff;
          border-radius: 18px;
          width: 100%;
          max-width: 400px;
          padding: 28px 26px 22px;
          text-align: center;
          box-shadow: 0 24px 60px -12px rgba(15, 23, 42, 0.35);
          animation: msgPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .msg-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 auto 16px;
        }
        .msg-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .msg-text {
          font-size: 0.88rem;
          color: #475569;
          line-height: 1.55;
          margin-bottom: 22px;
          word-break: break-word;
        }
        .msg-btn {
          width: 100%;
          padding: 11px 20px;
          border: none;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          font-family: inherit;
          transition: filter 0.15s, transform 0.1s;
        }
        .msg-btn:hover { filter: brightness(0.93); }
        .msg-btn:active { transform: scale(0.98); }
      `}</style>

      <div className="msg-overlay" onClick={handleClose} role="alertdialog" aria-modal="true">
        <div className="msg-card" onClick={(e) => e.stopPropagation()}>
          <div className="msg-icon" style={{ background: config.bg, color: config.color }}>
            {config.icon}
          </div>
          <div className="msg-title">{message.title || config.titre}</div>
          <div className="msg-text">{message.text}</div>
          <button className="msg-btn" style={{ background: config.color }} onClick={handleClose}>
            {type === 'success' ? 'Continuer' : 'Fermer'}
          </button>
        </div>
      </div>
    </>
  );
};

export default MessageModal;