import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser, googleAuthUser } from '../services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '307733103923-gj9trio9cijg9bd3ids1ilk57hg5rke9.apps.googleusercontent.com';

export default function SignUp() {
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const initGoogleAuth = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signup_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: '360',
          });
        }
      }
    };

    initGoogleAuth();
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initGoogleAuth();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleCallback = async (response) => {
    if (!response || !response.credential) {
      setErrorMsg('Google authentication token was not received. Please try again.');
      return;
    }

    setGoogleLoading(true);
    setErrorMsg('');
    try {
      await googleAuthUser(response.credential);
      navigate('/dashboard');
    } catch (err) {
      console.error('Google Auth backend error:', err);
      setErrorMsg(err.message || 'Google authentication failed. Please select your Google account.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCustomGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const btn = googleBtnRef.current?.querySelector('div[role="button"]');
          if (btn) btn.click();
        }
      });
    } else {
      setErrorMsg('Google Identity Service is loading. Please try again in a moment.');
    }
  };

  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await signupUser({
        fullName,
        email,
        password,
        organizationName,
        role: 'Senior Auditor',
        department: 'Risk Intelligence',
      });
      navigate('/dashboard');
    } catch (err) {
      console.warn('Backend signup error:', err.message);
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-outline-variant/30 custom-shadow overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[650px]">
        {/* Left Side Branding */}
        <div className="md:col-span-5 bg-primary p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 text-white mb-8">
              <span className="material-symbols-outlined text-3xl">security</span>
              <span className="font-headline-md font-bold text-xl tracking-tight">Adversarial Auditor</span>
            </Link>
            <h2 className="font-headline-lg text-2xl font-bold mb-4">Enterprise Account Registration</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Deploy autonomous AI agents to audit your corporate data with speed and precision.
            </p>
          </div>
          <div className="relative z-10 text-xs text-white/60">
            SOC 2 Type II Certified • Google OAuth 2.0 Active
          </div>
        </div>

        {/* Right Side Form */}
        <div className="md:col-span-7 p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-4">
            <div>
              <h3 className="font-headline-lg text-2xl font-bold text-on-surface mb-1">Create Account</h3>
              <p className="text-sm text-on-surface-variant">Get started with your enterprise audit portal</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-error/10 border border-error/20 text-error rounded-lg text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {/* Single Official Google GSI Rendered Button */}
            <div className="flex justify-center w-full my-2">
              <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px bg-outline-variant/40 flex-1"></div>
              <span className="text-[10px] uppercase font-bold text-outline">or register with email</span>
              <div className="h-px bg-outline-variant/40 flex-1"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Sterling"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.sterling@enterprise.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Global Security Systems Inc."
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
                <div className="mt-1 space-y-1">
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength <= 25 ? 'bg-error' : strength <= 75 ? 'bg-amber-500' : 'bg-secondary'
                      }`}
                      style={{ width: `${strength}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="tos" required className="rounded border-outline-variant text-primary" defaultChecked />
                <label htmlFor="tos" className="text-xs text-on-surface-variant">
                  I agree to Terms of Service & Privacy Policy
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Registering...' : 'Register & Access Portal'}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </form>

            <div className="text-center text-xs text-on-surface-variant">
              Already registered?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
