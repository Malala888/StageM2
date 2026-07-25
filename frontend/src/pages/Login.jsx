import React, { useState } from 'react';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState(0);
    const [strengthLabel, setStrengthLabel] = useState('');

    const checkStrength = (value) => {
        let score = 0;
        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;
        setStrength(score);
        const levels = ['Très faible', 'Faible', 'Moyen', 'Fort'];
        setStrengthLabel(score > 0 ? levels[score - 1] : '');
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        checkStrength(value);
    };

    const togglePassword = () => setShowPassword(!showPassword);

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Connexion réussie !');
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

        /* ─── Reset ─── */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          height: 100%;
        }

        body {
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
        }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background: rgba(255, 255, 255, 0.30);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          z-index: 0;
        }

        .card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 24px;
          padding: 40px 36px 36px;
          box-shadow: 0 20px 50px -12px rgba(0, 20, 40, 0.15);
          transition: transform 0.2s ease;
        }

        .card-title {
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .card-sub {
          font-size: 0.95rem;
          color: #475569;
          font-weight: 400;
          margin-bottom: 32px;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-wrap .ico {
          position: absolute;
          left: 14px;
          width: 18px;
          height: 18px;
          stroke: #94a3b8;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          pointer-events: none;
          transition: stroke 0.2s;
        }
        .input-wrap:focus-within .ico {
          stroke: #2563eb;
        }

        input[type="text"],
        input[type="password"] {
          width: 100%;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          padding: 12px 14px 12px 44px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: rgba(255, 255, 255, 0.7);
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        input::placeholder {
          color: #94a3b8;
        }
        input:hover {
          border-color: #94a3b8;
          background: #ffffff;
        }
        input:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .toggle-pwd {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          transition: color 0.2s;
        }
        .toggle-pwd:hover {
          color: #0f172a;
        }
        .toggle-pwd svg {
          width: 18px;
          height: 18px;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          display: block;
        }

        .strength-bar {
          display: flex;
          gap: 4px;
          margin-top: 6px;
        }
        .strength-bar span {
          flex: 1;
          height: 3px;
          border-radius: 10px;
          background: #e2e8f0;
          transition: background 0.25s;
        }
        .strength-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #94a3b8;
          min-height: 16px;
          margin-top: 4px;
          transition: color 0.25s;
        }

        .row-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 4px 0 2px;
        }
        .remember {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          user-select: none;
        }
        .remember input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #2563eb;
          cursor: pointer;
          margin: 0;
        }
        a.link {
          font-size: 0.85rem;
          font-weight: 600;
          color: #2563eb;
          text-decoration: none;
          transition: color 0.15s;
        }
        a.link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .btn-primary {
          margin-top: 6px;
          padding: 14px 20px;
          border: none;
          border-radius: 12px;
          background: #2563eb;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          box-shadow: 0 8px 20px -8px rgba(37, 99, 235, 0.3);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
          pointer-events: none;
        }
        .btn-primary:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 12px 28px -8px rgba(37, 99, 235, 0.4);
        }
        .btn-primary:active {
          transform: translateY(0);
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 8px 0 4px;
        }
        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: rgba(255, 255, 255, 0.5);
          color: #1e293b;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .btn-google:hover {
          border-color: #94a3b8;
          background: #ffffff;
          transform: translateY(-1px);
        }
        .btn-google svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .footer-text {
          text-align: center;
          font-size: 0.85rem;
          color: #475569;
          font-weight: 500;
          margin-top: 20px;
        }

        @media (max-width: 480px) {
          .card {
            padding: 28px 20px 24px;
            border-radius: 20px;
          }
          .card-title {
            font-size: 1.6rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

            <main className="card">
                <h1 className="card-title">Connexion</h1>
                <p className="card-sub">Connectez-vous pour accéder à votre espace</p>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="field">
                        <label className="field-label" htmlFor="username">Identifiant</label>
                        <div className="input-wrap">
                            <svg className="ico" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
                            </svg>
                            <input
                                type="text"
                                id="username"
                                placeholder="email ou nom d'utilisateur"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label className="field-label" htmlFor="password">Mot de passe</label>
                        <div className="input-wrap">
                            <svg className="ico" viewBox="0 0 24 24">
                                <rect x="5" y="10" width="14" height="11" rx="2" />
                                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                            </svg>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-pwd"
                                onClick={togglePassword}
                                aria-label="Afficher/masquer le mot de passe"
                            >
                                <svg viewBox="0 0 24 24">
                                    {showPassword ? (
                                        <>
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </>
                                    ) : (
                                        <>
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </>
                                    )}
                                </svg>
                            </button>
                        </div>
                        <div className="strength-bar">
                            <span style={{ background: strength >= 1 ? '#ef4444' : '' }}></span>
                            <span style={{ background: strength >= 2 ? '#f97316' : '' }}></span>
                            <span style={{ background: strength >= 3 ? '#eab308' : '' }}></span>
                            <span style={{ background: strength >= 4 ? '#22c55e' : '' }}></span>
                        </div>
                        <div className="strength-label">{strengthLabel}</div>
                    </div>

                    <div className="row-between">
                        <label className="remember">
                            <input type="checkbox" />
                            Se souvenir de moi
                        </label>
                        <a href="#" className="link">Mot de passe oublié ?</a>
                    </div>

                    <button type="submit" className="btn-primary">Se connecter</button>
                </form>

                <div className="divider">ou</div>

                <button className="btn-google" type="button">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continuer avec Google
                </button>

                <p className="footer-text">
                    Pas encore de compte ? <a href="/register" className="link">Créer un compte</a>
                </p>
            </main>
        </>
    );
};

export default Login;