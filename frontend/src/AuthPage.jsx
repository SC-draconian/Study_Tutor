import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Brain, CheckCircle2,
  ChevronDown, Layers2, LoaderCircle, LogOut, Mail,
  Phone, Shield, Smartphone, Sparkles, User, X,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  hasConfig,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from './firebase.js';

/* ── Google "G" SVG logo ──────────────────────────────────── */
function GoogleLogo() {
  return (
    <svg className="google-icon" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

/* ── Custom hook: Firebase Auth state ─────────────────────── */
export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('studywise-profile')); } catch { return null; }
  });

  useEffect(() => {
    // If Firebase is not configured, treat as "no user" immediately
    if (!auth) { setUser(null); return; }
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return unsub;
  }, []);

  const saveProfile = useCallback((data) => {
    setProfile(data);
    try { localStorage.setItem('studywise-profile', JSON.stringify(data)); } catch {}
  }, []);

  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
    setProfile(null);
    try { localStorage.removeItem('studywise-profile'); } catch {}
  }, []);

  // Profile is "complete" if we have a name
  const needsProfile = user && !profile?.name;

  return { user, profile, needsProfile, saveProfile, logout };
}

/* ── Auth Page Component ──────────────────────────────────── */
export default function AuthPage({ onAuth, theme, onToggleTheme }) {
  const [view, setView] = useState('methods'); // methods | email | phone | otp | profile
  const [isSignUp, setIsSignUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Email fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone fields
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmResult, setConfirmResult] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [resendTimer, setResendTimer] = useState(0);

  // Profile fields (post-phone-signup)
  const [profileData, setProfileData] = useState({ name: '', email: '', age: '' });

  const recaptchaRef = useRef(null);
  const verifyingRef = useRef(false); // Guard against double auto-verify

  const clearError = () => setError('');

  /* ── Guard: Firebase not configured ───────────────────────── */
  if (!hasConfig) {
    return (
      <div className="auth-page">
        <div className="auth-brand-panel">
          <div className="auth-brand-logo">
            <span><BookOpen size={20} /></span>
            studywise
          </div>
          <div className="auth-brand-tagline">
            Study with<br />a little more <em>wonder.</em>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-card auth-animate-in">
            <div className="auth-card-header">
              <div className="eyebrow"><span /> SETUP REQUIRED</div>
              <h1>Firebase not <em>configured.</em></h1>
              <p>Add your Firebase credentials to <code>frontend/.env</code> and restart the dev server. See <code>.env.example</code> for the required variables.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Google Sign-in ───────────────────────────────────────── */
  const handleGoogle = async () => {
    setBusy(true); clearError();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      onAuth(u, { name: u.displayName || '', email: u.email || '', age: '' });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err));
      }
    } finally { setBusy(false); }
  };

  /* ── Email Sign-in / Sign-up ──────────────────────────────── */
  const handleEmail = async (evt) => {
    evt.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setBusy(true); clearError();
    try {
      const fn = isSignUp ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      const result = await fn(auth, email.trim(), password);
      onAuth(result.user, { name: result.user.displayName || '', email: result.user.email || email.trim(), age: '' });
    } catch (err) { setError(friendlyError(err)); }
    finally { setBusy(false); }
  };

  /* ── Phone: setup recaptcha ───────────────────────────────── */
  const setupRecaptcha = () => {
    // Always clear old verifier first to avoid stale DOM references
    if (recaptchaRef.current) {
      try { recaptchaRef.current.clear(); } catch {}
      recaptchaRef.current = null;
    }
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'normal',
      callback: () => {},
      'expired-callback': () => {
        if (recaptchaRef.current) {
          try { recaptchaRef.current.clear(); } catch {}
          recaptchaRef.current = null;
        }
      },
    });
  };

  /* ── Phone: send OTP ──────────────────────────────────────── */
  const handleSendOtp = async (evt) => {
    evt.preventDefault();
    if (!phoneNumber.trim()) return;
    setBusy(true); clearError();
    try {
      setupRecaptcha();
      const fullNumber = `${countryCode}${phoneNumber.trim().replace(/^0+/, '')}`;
      const confirmation = await signInWithPhoneNumber(auth, fullNumber, recaptchaRef.current);
      setConfirmResult(confirmation);
      setView('otp');
      setResendTimer(30);
    } catch (err) {
      setError(friendlyError(err));
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch {}
        recaptchaRef.current = null;
      }
    } finally { setBusy(false); }
  };

  /* ── Phone: verify OTP ────────────────────────────────────── */
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6 || !confirmResult) return;
    // Guard against double calls (React StrictMode / auto-verify race)
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setBusy(true); clearError();
    try {
      const result = await confirmResult.confirm(code);
      const u = result.user;
      if (!u.displayName) {
        setView('profile');
      } else {
        onAuth(u, { name: u.displayName || '', email: u.email || '', age: '' });
      }
    } catch (err) {
      setError(friendlyError(err));
      setOtp(['', '', '', '', '', '']);
    } finally {
      setBusy(false);
      verifyingRef.current = false;
    }
  };

  /* ── Profile completion (phone users) ─────────────────────── */
  const handleProfileComplete = async (evt) => {
    evt.preventDefault();
    if (!profileData.name.trim()) { setError('Please enter your name.'); return; }
    setBusy(true); clearError();
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: profileData.name.trim() });
      }
      onAuth(auth.currentUser, {
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        age: profileData.age,
      });
    } catch (err) { setError(friendlyError(err)); }
    finally { setBusy(false); }
  };

  /* ── OTP input handling ───────────────────────────────────── */
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };
  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      otpRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  // Auto-verify when all 6 digits entered (guarded against double-fire)
  useEffect(() => {
    if (otp.every(d => d) && confirmResult && !busy && !verifyingRef.current) {
      handleVerifyOtp();
    }
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  /* ── Resend OTP ───────────────────────────────────────────── */
  const handleResend = async () => {
    setOtp(['', '', '', '', '', '']);
    clearError();
    setResendTimer(30);
    // Clear old recaptcha
    if (recaptchaRef.current) {
      try { recaptchaRef.current.clear(); } catch {}
      recaptchaRef.current = null;
    }
    setBusy(true);
    try {
      // Create fresh recaptcha on the container in the OTP view
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible', // Use invisible for resend since container is small in OTP view
        callback: () => {},
      });
      const fullNumber = `${countryCode}${phoneNumber.trim().replace(/^0+/, '')}`;
      const confirmation = await signInWithPhoneNumber(auth, fullNumber, recaptchaRef.current);
      setConfirmResult(confirmation);
    } catch (err) { setError(friendlyError(err)); }
    finally { setBusy(false); }
  };

  /* ── Navigation helpers ───────────────────────────────────── */
  const goBack = () => {
    clearError();
    // Clean up recaptcha when leaving phone/OTP views
    if (recaptchaRef.current) {
      try { recaptchaRef.current.clear(); } catch {}
      recaptchaRef.current = null;
    }
    if (view === 'otp') setView('phone');
    else if (view === 'profile') {} // Can't go back from profile
    else setView('methods');
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="auth-page">
      {/* Left brand panel */}
      <div className="auth-brand-panel">
        <span className="auth-decor-star">✳</span>
        <span className="auth-decor-star">✴</span>
        <div className="auth-brand-logo">
          <span><BookOpen size={20} /></span>
          studywise
        </div>
        <div className="auth-brand-tagline">
          Study with<br />a little more <em>wonder.</em>
        </div>
        <p className="auth-brand-sub">
          Turn your notes into real understanding. Ask questions, build flashcards, and practice — all grounded in your own materials.
        </p>
        <div className="auth-brand-features">
          <span><Brain size={14} /> Smart Q&A</span>
          <span><Layers2 size={14} /> Flashcards</span>
          <span><Shield size={14} /> Private</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-card auth-animate-in" key={view}>
          {/* ── Methods view ──────────────────────────────────── */}
          {view === 'methods' && <>
            <div className="auth-card-header">
              <div className="eyebrow"><span /> WELCOME TO STUDYWISE</div>
              <h1>{isSignUp ? 'Create your ' : 'Sign in to your '}<em>study space.</em></h1>
              <p>{isSignUp ? 'Start your learning journey today.' : 'Pick up right where you left off.'}</p>
            </div>

            <div className="auth-methods">
              <button className="auth-method-btn google-btn" onClick={handleGoogle} disabled={busy}>
                <GoogleLogo /> Continue with Google
              </button>
              <button className="auth-method-btn email-btn" onClick={() => { clearError(); setView('email'); }} disabled={busy}>
                <Mail size={18} /> Continue with Email
              </button>
              <button className="auth-method-btn phone-btn" onClick={() => { clearError(); setView('phone'); }} disabled={busy}>
                <Smartphone size={18} /> Continue with Phone
              </button>
            </div>

            {error && <div className="auth-error"><X size={14} />{error}</div>}

            <div className="auth-switch">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button onClick={() => { setIsSignUp(!isSignUp); clearError(); }}>
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </>}

          {/* ── Email view ────────────────────────────────────── */}
          {view === 'email' && <>
            <button className="auth-back-link" onClick={goBack}><ArrowLeft size={14} /> Back to sign-in options</button>
            <div className="auth-card-header">
              <div className="eyebrow"><span /> EMAIL SIGN IN</div>
              <h1>{isSignUp ? 'Create' : 'Welcome '}<em>{isSignUp ? ' an account.' : 'back.'}</em></h1>
              <p>Enter your email and password to continue.</p>
            </div>

            <form className="auth-form" onSubmit={handleEmail}>
              <div className="auth-field">
                <label htmlFor="auth-email">Email address</label>
                <input id="auth-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoFocus required />
              </div>
              <div className="auth-field">
                <label htmlFor="auth-password">Password</label>
                <input id="auth-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isSignUp ? 'Create a password (6+ chars)' : 'Enter your password'} minLength={6} required />
              </div>
              {error && <div className="auth-error"><X size={14} />{error}</div>}
              <button className="auth-submit" type="submit" disabled={busy || !email.trim() || !password.trim()}>
                {busy ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={16} />}
                {isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <div className="auth-switch">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button onClick={() => { setIsSignUp(!isSignUp); clearError(); }}>
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </>}

          {/* ── Phone view ────────────────────────────────────── */}
          {view === 'phone' && <>
            <button className="auth-back-link" onClick={goBack}><ArrowLeft size={14} /> Back to sign-in options</button>
            <div className="auth-card-header">
              <div className="eyebrow"><span /> PHONE SIGN IN</div>
              <h1>Enter your <em>phone number.</em></h1>
              <p>We'll send a 6-digit verification code via SMS.</p>
            </div>

            <form className="auth-form" onSubmit={handleSendOtp}>
              <div className="auth-field">
                <label>Phone number</label>
                <div className="phone-input-row">
                  <input
                    className="country-code"
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    placeholder="+91"
                  />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div id="recaptcha-container" />
              {error && <div className="auth-error"><X size={14} />{error}</div>}
              <button className="auth-submit" type="submit" disabled={busy || !phoneNumber.trim()}>
                {busy ? <LoaderCircle className="spin" size={16} /> : <Phone size={16} />}
                Send verification code
              </button>
            </form>
          </>}

          {/* ── OTP view ──────────────────────────────────────── */}
          {view === 'otp' && <>
            <button className="auth-back-link" onClick={goBack}><ArrowLeft size={14} /> Change phone number</button>
            <div className="auth-card-header">
              <div className="eyebrow"><span /> VERIFY YOUR NUMBER</div>
              <h1>Enter the <em>code.</em></h1>
            </div>

            <div className="otp-info">
              We sent a 6-digit code to <b>{countryCode} {phoneNumber}</b>
            </div>

            <div className="otp-group" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  className={digit ? 'filled' : ''}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && <div className="auth-error"><X size={14} />{error}</div>}

            <button className="auth-submit" onClick={handleVerifyOtp} disabled={busy || otp.join('').length !== 6}>
              {busy ? <LoaderCircle className="spin" size={16} /> : <CheckCircle2 size={16} />}
              Verify and continue
            </button>

            <div className="otp-resend">
              <button onClick={handleResend} disabled={resendTimer > 0 || busy}>
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
              </button>
            </div>
            {/* Hidden container for invisible recaptcha during resend */}
            <div id="recaptcha-container" />
          </>}

          {/* ── Profile completion view ───────────────────────── */}
          {view === 'profile' && <>
            <div className="profile-completion">
              <div className="auth-card-header">
                <div className="eyebrow"><span /> ALMOST THERE</div>
                <h1>Tell us about <em>yourself.</em></h1>
                <p>Just a few details to personalize your study space.</p>
              </div>

              <div className="profile-avatar-circle">
                <User size={30} />
              </div>

              <div className="profile-step-indicator">
                <span className="active" />
                <span className="active" />
                <span className="active" />
              </div>

              <form className="auth-form" onSubmit={handleProfileComplete}>
                <div className="auth-field">
                  <label htmlFor="profile-name">Full name *</label>
                  <input
                    id="profile-name"
                    type="text"
                    value={profileData.name}
                    onChange={e => setProfileData(d => ({ ...d, name: e.target.value }))}
                    placeholder="Your full name"
                    autoFocus
                    required
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="profile-email">Email address</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={profileData.email}
                    onChange={e => setProfileData(d => ({ ...d, email: e.target.value }))}
                    placeholder="you@example.com (optional)"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="profile-age">Age</label>
                  <input
                    id="profile-age"
                    type="number"
                    min="10"
                    max="100"
                    value={profileData.age}
                    onChange={e => setProfileData(d => ({ ...d, age: e.target.value }))}
                    placeholder="Your age"
                  />
                </div>

                {error && <div className="auth-error"><X size={14} />{error}</div>}

                <button className="auth-submit" type="submit" disabled={busy || !profileData.name.trim()}>
                  {busy ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
                  Start studying
                </button>

                <div className="profile-note">
                  <Shield size={12} /> Your data stays private and secure.
                </div>
              </form>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

/* ── User Menu (for topbar / sidebar) ─────────────────────── */
export function UserMenu({ user, profile, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = profile?.name || user?.displayName || user?.email || user?.phoneNumber || 'Student';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="user-menu-chip" ref={ref} onClick={() => setOpen(!open)}>
      {user?.photoURL
        ? <img src={user.photoURL} alt="" />
        : <div className="user-initial">{initial}</div>
      }
      <span>{displayName.split(' ')[0]}</span>
      {open && (
        <div className="user-dropdown" onClick={e => e.stopPropagation()}>
          <button onClick={() => { setOpen(false); }}>
            <User size={14} /> {displayName}
          </button>
          <button className="logout-btn" onClick={() => { setOpen(false); onLogout(); }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Friendly error messages ──────────────────────────────── */
function friendlyError(e) {
  const map = {
    'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email. Try signing up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/invalid-phone-number': 'Please enter a valid phone number with country code.',
    'auth/invalid-verification-code': 'Invalid verification code. Please check and try again.',
    'auth/code-expired': 'The verification code has expired. Please request a new one.',
    'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups and try again.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
  };
  return map[e.code] || e.message || 'Something went wrong. Please try again.';
}
