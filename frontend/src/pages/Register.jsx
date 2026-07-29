import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import backgroundImage from '../assets/Fianarantsoa_03.jpg';

const Register = () => {
  const navigate = useNavigate();

  // ─── States ───
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [section, setSection] = useState('');
  const [brigade, setBrigade] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // ─── Données dynamiques ───
  const [sections, setSections] = useState([]);
  const [brigades, setBrigades] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── Force du mot de passe ───
  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState('');
  const s1Ref = useRef(null);
  const s2Ref = useRef(null);
  const s3Ref = useRef(null);
  const s4Ref = useRef(null);
  const [matchMessage, setMatchMessage] = useState('');

  // ─── Charger les sections et brigades ───
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectionsRes, brigadesRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/personnel/sections/'),
          axios.get('http://127.0.0.1:8000/api/personnel/brigades/'),
        ]);
        setSections(sectionsRes.data);
        setBrigades(brigadesRes.data);
      } catch (err) {
        console.error('Erreur de chargement des données:', err);
        // On peut utiliser des données par défaut si nécessaire
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Brigades filtrées par section ───
  const filteredBrigades = section
    ? brigades.filter(b => b.section === parseInt(section))
    : [];

  // ─── Fonctions ───
  const checkStrength = (value) => {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    setStrength(score);
    const levels = ['Très faible', 'Faible', 'Moyen', 'Fort'];
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    setStrengthLabel(score > 0 ? levels[score - 1] : '');
    const bars = [s1Ref.current, s2Ref.current, s3Ref.current, s4Ref.current];
    bars.forEach((bar, i) => {
      if (bar) {
        bar.style.background = i < score ? colors[score - 1] : '#e2e8f0';
      }
    });
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    checkStrength(value);
    if (passwordConfirm) {
      setMatchMessage(value === passwordConfirm);
    }
  };

  const handlePasswordConfirmChange = (e) => {
    const value = e.target.value;
    setPasswordConfirm(value);
    setMatchMessage(password === value);
  };

  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);

    if (!role) {
      setSubmitError('❌ Veuillez sélectionner un poste');
      setIsSubmitting(false);
      return;
    }

    if (password !== passwordConfirm) {
      setSubmitError('Les mots de passe ne correspondent pas');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setSubmitError('Le mot de passe doit contenir au moins 8 caractères');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      nom,
      prenom,
      email,
      role,
      section: (role === 'CHEF_SECTION' && section) ? parseInt(section) : null,
      brigade: (role !== 'CHEF_SECTION' && brigade) ? parseInt(brigade) : null,
      password,
    };

    try {
      await axios.post('http://127.0.0.1:8000/api/accounts/users/', payload);
      setSubmitSuccess('✅ Votre compte a été créé avec succès ! En attente de validation par votre supérieur.');
      setNom('');
      setPrenom('');
      setEmail('');
      setRole('');
      setSection('');
      setBrigade('');
      setPassword('');
      setPasswordConfirm('');
      setMatchMessage('');
      setStrength(0);
      setStrengthLabel('');
      const bars = [s1Ref.current, s2Ref.current, s3Ref.current, s4Ref.current];
      bars.forEach(bar => { if (bar) bar.style.background = '#e2e8f0'; });
      setTimeout(() => navigate('/'), 4000);
    } catch (err) {
      console.error(err);
      const errorData = err.response?.data;
      let errorMsg = 'Erreur lors de la création du compte';
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (typeof errorData === 'object') {
          errorMsg = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(' | ');
        }
      }
      setSubmitError(`❌ ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="register-body">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

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
          overflow-y: auto;
        }

        #root {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          min-height: 100vh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: none !important;
          padding: 0 !important;
        }

        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

        .register-body {
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          min-height: 100vh;
          width: 100%;
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: relative;
        }

        .register-body::before {
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
          max-width: 460px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 24px;
          padding: 28px 36px 32px;
          box-shadow: 0 20px 50px -12px rgba(0, 20, 40, 0.15);
          margin: 16px 0;
        }

        .card-title {
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .card-sub {
          font-size: 0.9rem;
          color: #475569;
          font-weight: 400;
          margin-bottom: 28px;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .field-group {
          display: flex;
          gap: 12px;
        }
        .field-group .field { flex: 1; }

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
          left: 16px;
          width: 20px;
          height: 20px;
          stroke: #94a3b8;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          pointer-events: none;
          transition: stroke 0.2s;
        }
        .input-wrap:focus-within .ico { stroke: #2563eb; }

        input[type="text"],
        input[type="email"],
        input[type="password"],
        select {
          width: 100%;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          padding: 12px 16px 12px 48px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: rgba(255, 255, 255, 0.7);
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          appearance: none;
          -webkit-appearance: none;
        }
        select {
          padding-right: 40px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          cursor: pointer;
        }
        input::placeholder { color: #94a3b8; }
        input:hover, select:hover {
          border-color: #94a3b8;
          background: #ffffff;
        }
        input:focus, select:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .toggle-pwd {
          position: absolute;
          right: 14px;
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
        .toggle-pwd:hover { color: #0f172a; }
        .toggle-pwd svg {
          width: 20px;
          height: 20px;
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
          margin-top: 5px;
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
          margin-top: 3px;
          transition: color 0.25s;
        }

        .match-message {
          font-size: 0.7rem;
          font-weight: 600;
          min-height: 16px;
          margin-top: 3px;
          transition: color 0.25s;
        }
        .match-message.valid { color: #22c55e; }
        .match-message.invalid { color: #ef4444; }

        .submit-message {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .submit-message.success {
          background: #dcfce7;
          color: #16a34a;
        }
        .submit-message.error {
          background: #fee2e2;
          color: #dc2626;
        }

        .btn-primary {
          margin-top: 4px;
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
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          margin-top: 18px;
        }
        .footer-text a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }
        .footer-text a:hover { text-decoration: underline; }

        @media (max-width: 480px) {
          .register-body { padding: 16px 12px; }
          .card {
            padding: 20px 18px 24px;
            border-radius: 18px;
            max-width: 100%;
          }
          .card-title { font-size: 1.6rem; }
          .field-group { flex-direction: column; gap: 0; }
          input[type="text"],
          input[type="email"],
          input[type="password"],
          select {
            padding: 10px 14px 10px 40px;
            font-size: 0.85rem;
          }
          .input-wrap .ico { left: 12px; width: 17px; height: 17px; }
          .toggle-pwd svg { width: 17px; height: 17px; }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="register-body">
        <main className="card">
          <h1 className="card-title">Inscription</h1>
          <p className="card-sub">Créez votre compte pour accéder à l'application</p>

          {submitSuccess && <div className="submit-message success">{submitSuccess}</div>}
          {submitError && <div className="submit-message error">{submitError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <div className="field">
                <label className="field-label" htmlFor="nom">Nom</label>
                <div className="input-wrap">
                  <svg className="ico" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    id="nom"
                    placeholder="Dupont"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="prenom">Prénom</label>
                <div className="input-wrap">
                  <svg className="ico" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    id="prenom"
                    placeholder="Jean"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="email">Adresse email</label>
              <div className="input-wrap">
                <svg className="ico" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  id="email"
                  placeholder="jean.dupont@fce.mg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="role">Poste / Rôle</label>
              <div className="input-wrap">
                <svg className="ico" viewBox="0 0 24 24">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">Sélectionnez votre poste</option>
                  <option value="GL">GL – Garde Ligne</option>
                  <option value="CN">CN – Cantonnier</option>
                  <option value="CHEF_BRIGADE">CHEF_BRIGADE – Chef de Brigade</option>
                  <option value="CHEF_SECTION">CHEF_SECTION – Chef de Section</option>
                </select>
              </div>
            </div>

            {role === 'CHEF_SECTION' && (
              <div className="field">
                <label className="field-label" htmlFor="section">Section</label>
                <div className="input-wrap">
                  <svg className="ico" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <select
                    id="section"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    required
                  >
                    <option value="">Sélectionnez votre section</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {role && role !== 'CHEF_SECTION' && (
              <>
                <div className="field">
                  <label className="field-label" htmlFor="section">Section</label>
                  <div className="input-wrap">
                    <svg className="ico" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <select
                      id="section"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      required
                    >
                      <option value="">Sélectionnez votre section</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.id}>{s.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="brigade">Brigade</label>
                  <div className="input-wrap">
                    <svg className="ico" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <select
                      id="brigade"
                      value={brigade}
                      onChange={(e) => setBrigade(e.target.value)}
                      required
                      disabled={!section}
                    >
                      <option value="">Sélectionnez votre brigade</option>
                      {filteredBrigades.map(b => (
                        <option key={b.id} value={b.id}>{b.nom} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

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
                  minLength="8"
                />
                <button type="button" className="toggle-pwd" onClick={togglePassword}>
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
                <span ref={s1Ref}></span>
                <span ref={s2Ref}></span>
                <span ref={s3Ref}></span>
                <span ref={s4Ref}></span>
              </div>
              <div className="strength-label">{strengthLabel}</div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="password_confirm">Confirmer le mot de passe</label>
              <div className="input-wrap">
                <svg className="ico" viewBox="0 0 24 24">
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password_confirm"
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={handlePasswordConfirmChange}
                  required
                />
              </div>
              <div className={`match-message ${matchMessage ? 'valid' : passwordConfirm ? 'invalid' : ''}`}>
                {passwordConfirm && (matchMessage ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas')}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="divider">ou</div>
          <button className="btn-google" type="button">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            S'inscrire avec Google
          </button>

          <p className="footer-text">
            Déjà un compte ? <a href="/">Se connecter</a>
          </p>
        </main>
      </div>
    </>
  );
};

export default Register;