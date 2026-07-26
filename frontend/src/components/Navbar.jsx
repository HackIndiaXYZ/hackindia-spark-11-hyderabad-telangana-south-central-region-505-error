import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const isAuthenticated = () => {
    return !!(localStorage.getItem('token') || localStorage.getItem('user'));
  };

  const handleCtaClick = (e, targetPath = '/dashboard') => {
    e.preventDefault();
    if (isAuthenticated()) {
      navigate(targetPath);
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-effect border-b border-outline-variant/30 px-container-padding h-20 flex justify-between items-center">
      <Link to="/" className="flex items-center gap-stack-sm">
        <span className="material-symbols-outlined text-primary text-[32px]">security</span>
        <span className="font-headline-md text-headline-md font-bold tracking-tight text-primary">
          Adversarial Auditor
        </span>
      </Link>

      <nav className="hidden lg:flex items-center gap-8">
        <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#product">
          Product
        </a>
        <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#features">
          Features
        </a>
        <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#architecture">
          Architecture
        </a>
        <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#pricing">
          Pricing
        </a>
        <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#contact">
          Contact
        </a>
      </nav>

      <div className="flex items-center gap-4">
        {isAuthenticated() ? (
          <button
            onClick={(e) => handleCtaClick(e, '/dashboard')}
            className="px-6 py-2.5 bg-primary text-white font-label-md text-label-md rounded-xl font-bold hover:brightness-90 transition-all active:scale-95 shadow-sm inline-block"
          >
            Open Dashboard
          </button>
        ) : (
          <>
            <Link
              to="/login"
              className="hidden sm:inline-block px-6 py-2.5 font-label-md text-label-md text-primary hover:bg-surface-variant rounded-xl transition-colors font-bold"
            >
              Sign In
            </Link>
            <button
              onClick={(e) => handleCtaClick(e, '/login')}
              className="px-6 py-2.5 bg-primary text-white font-label-md text-label-md rounded-xl font-bold hover:brightness-90 transition-all active:scale-95 shadow-sm inline-block"
            >
              Get Started
            </button>
          </>
        )}

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[28px]">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b border-outline-variant p-6 flex flex-col gap-4 lg:hidden shadow-lg">
          <a
            onClick={() => setMobileMenuOpen(false)}
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary"
            href="#product"
          >
            Product
          </a>
          <a
            onClick={() => setMobileMenuOpen(false)}
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary"
            href="#features"
          >
            Features
          </a>
          <a
            onClick={() => setMobileMenuOpen(false)}
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary"
            href="#architecture"
          >
            Architecture
          </a>
          <a
            onClick={() => setMobileMenuOpen(false)}
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary"
            href="#pricing"
          >
            Pricing
          </a>
          <a
            onClick={() => setMobileMenuOpen(false)}
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary"
            href="#contact"
          >
            Contact
          </a>
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="px-6 py-2.5 font-label-md text-label-md text-primary hover:bg-surface-variant rounded-lg transition-colors w-full text-left inline-block"
          >
            Sign In
          </Link>
        </div>
      )}
    </header>
  );
}
