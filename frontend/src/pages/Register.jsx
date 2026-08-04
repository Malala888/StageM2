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

    let sectionId = null;
    if (role === 'CHEF_SECTION' && section) {
      sectionId = parseInt(section);
    } else if (brigade) {
      const selectedBrigadeObj = brigades.find(b => b.id === parseInt(brigade));
      if (selectedBrigadeObj) {
        sectionId = selectedBrigadeObj.section;
      }
    }

    const payload = {
      nom,
      prenom,
      email,
      role,
      section: sectionId,
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
          font-family: 'Inter', sans-serif;
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
          background: url(${backgroundImage}) center / cover no-repeat fixed;
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          padding: 24px;
        }

        .register-body::before {
          content: '';
          position: fixed;
          inset: 0;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          z-index: 0;
        }

        .card {
          position: relative;
          z-index: 1;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 36px 40px;
          width: 100%;
          max-width: 460px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          margin: auto;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          background: #2563eb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .logo-text h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
        }

        .logo-text p {
          font-size: 0.8rem;
          color: #475569;
          font-weight: 500;
        }

        .alert {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          margin-bottom: 16px;
          font-weight: 500;
        }
        .alert.error { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .alert.success { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }

        .field {
          margin-bottom: 16px;
        }

        .field-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrap input,
        .input-wrap select {
          width: 100%;
          padding: 10px 14px 10px 40px;
          border-radius: 10px;
          border: 1px solid rgba(203, 213, 225, 0.8);
          background: rgba(255, 255, 255, 0.9);
          font-size: 0.85rem;
          color: #0f172a;
          outline: none;
          transition: all 0.2s;
        }

        .input-wrap input:focus,
        .input-wrap select:focus {
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .input-wrap .ico {
          position: absolute;
          left: 12px;
          width: 18px;
          height: 18px;
          stroke: #64748b;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          pointer-events: none;
        }

        .toggle-pwd {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .toggle-pwd svg {
          width: 18px;
          height: 18px;
          stroke: #64748b;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .strength-bar {
          display: flex;
          gap: 4px;
          margin-top: 6px;
        }
        .strength-bar span {
          flex: 1;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          transition: background 0.3s;
        }
        .strength-label {
          font-size: 0.7rem;
          color: #64748b;
          margin-top: 4px;
          text-align: right;
        }

        .match-message {
          font-size: 0.75rem;
          margin-top: 4px;
          font-weight: 500;
        }
        .match-message.valid { color: #16a34a; }
        .match-message.invalid { color: #dc2626; }

        .btn-primary {
          width: 100%;
          padding: 12px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          margin-top: 8px;
        }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-primary:active { transform: scale(0.99); }
        .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }

        .divider {
          text-align: center;
          margin: 18px 0;
          position: relative;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }
        .divider::before, .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 42%;
          height: 1px;
          background: #e2e8f0;
        }
        .divider::before { left: 0; }
        .divider::after { right: 0; }

        .btn-google {
          width: 100%;
          padding: 10px;
          background: #fff;
          color: #334155;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s;
        }
        .btn-google:hover { background: #f8fafc; }
        .btn-google svg { width: 18px; height: 18px; }

        .footer-text {
          text-align: center;
          font-size: 0.8rem;
          color: #475569;
          margin-top: 20px;
        }
        .footer-text a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }
        .footer-text a:hover { text-decoration: underline; }
      `}</style>

      <div className="register-body">
        <main className="card">
          <div className="logo-area">
            <div className="logo-icon">FCE</div>
            <div className="logo-text">
              <h2>Créer un compte</h2>
              <p>Réseau Ferroviaire Fianarantsoa Côte Est</p>
            </div>
          </div>

          {submitError && <div className="alert error">{submitError}</div>}
          {submitSuccess && <div className="alert success">{submitSuccess}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    placeholder="Votre nom"
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
                    placeholder="Votre prénom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="email">Email</label>
              <div className="input-wrap">
                <svg className="ico" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  id="email"
                  placeholder="votre.email@fce.mg"
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setSection('');
                    setBrigade('');
                  }}
                  required
                >
                  <option value="">Sélectionnez votre rôle</option>
                  <option value="CHEF_SECTION">Chef de Section</option>
                  <option value="CHEF_BRIGADE">Chef de Brigade</option>
                  <option value="GL">Garde Ligne (GL)</option>
                  <option value="CN">Cantonnier (CN)</option>
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
                      <option key={s.id} value={s.id}>{s.nom} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {role && role !== 'CHEF_SECTION' && (
              <>
                <div className="field">
                  <label className="field-label" htmlFor="section_parent">Section de rattachement</label>
                  <div className="input-wrap">
                    <svg className="ico" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <select
                      id="section_parent"
                      value={section}
                      onChange={(e) => {
                        setSection(e.target.value);
                        setBrigade('');
                      }}
                      required
                    >
                      <option value="">Sélectionnez d'abord votre section</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.id}>{s.nom} ({s.code})</option>
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