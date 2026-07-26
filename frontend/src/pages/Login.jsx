import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, googleAuthUser } from '../services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '307733103923-gj9trio9cijg9bd3ids1ilk57hg5rke9.apps.googleusercontent.com';

export default function Login() {
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Initialize Google Identity Services (GSI)
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
            text: 'continue_with',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await loginUser(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.warn('Backend login error:', err.message);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-outline-variant/30 custom-shadow overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        {/* Left Side Branding */}
        <div className="md:col-span-5 bg-primary p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 text-white mb-8">
              <span className="material-symbols-outlined text-3xl">security</span>
              <span className="font-headline-md font-bold text-xl tracking-tight">Adversarial Auditor</span>
            </Link>
            <h2 className="font-headline-lg text-2xl font-bold mb-4">Autonomous Multi-Agent AI Audit Suite</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Stress-test financial, legal, and operational compliance with adversarial AI models.
            </p>
          </div>
          <div className="relative z-10 text-xs text-white/60">
            Enterprise Security Tier 4.2 • Google OAuth 2.0 Active
          </div>
        </div>

        {/* Right Side Form */}
        <div className="md:col-span-7 p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <h3 className="font-headline-lg text-2xl font-bold text-on-surface mb-1">Welcome back</h3>
              <p className="text-sm text-on-surface-variant">Sign in to access your audit reports and agent status</p>
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
              <span className="text-[10px] uppercase font-bold text-outline">or sign in with email</span>
              <div className="h-px bg-outline-variant/40 flex-1"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.sterling@enterprise.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Password
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Password reset link sent to your email.');
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded border-outline-variant text-primary" defaultChecked />
                <label htmlFor="remember" className="text-xs text-on-surface-variant">
                  Remember this device
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Platform'}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </form>

            <div className="text-center text-xs text-on-surface-variant">
              Don't have an enterprise account?{' '}
              <Link to="/signup" className="text-primary font-bold hover:underline">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
