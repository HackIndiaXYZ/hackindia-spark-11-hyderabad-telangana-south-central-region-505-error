import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const isAuthenticated = () => {
    return !!(localStorage.getItem('token') || localStorage.getItem('user'));
  };

  const handleCtaClick = (targetPath) => {
    if (isAuthenticated()) {
      navigate(targetPath);
    } else {
      navigate('/login');
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does the Adversarial AI stress-test corporate documents?',
      a: 'Our platform deploys four specialized autonomous agents (Financial, Legal, Market, and Security) that perform multi-vector adversarial analysis. They challenge assumptions, cross-reference data against regulatory frameworks, and identify hidden vulnerabilities before auditors or regulators do.',
    },
    {
      q: 'Is my corporate data secure and private?',
      a: 'Yes. All document processing can be configured to run on air-gapped local LLMs (such as Ollama and Qwen2.5) with zero data leaving your corporate perimeter. Data in transit is encrypted using TLS 1.3 and at rest with AES-256.',
    },
    {
      q: 'Which document formats are supported?',
      a: 'Adversarial Auditor supports PDF (with automatic OCR), Microsoft Word (DOCX), Excel spreadsheets (XLSX), CSV files, and smart contract source code (.sol, .py, .js).',
    },
    {
      q: 'Can we integrate Adversarial Auditor with existing GRC tools?',
      a: 'Absolutely. We provide REST API webhooks and export integrations for GRC platforms such as ServiceNow, RSA Archer, and SAP GRC.',
    },
  ];

  return (
    <div className="bg-background text-on-surface font-sans selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-container-padding overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-primary-fixed/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <div className="max-w-5xl mx-auto text-center space-y-stack-md">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-bold shadow-sm">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>Enterprise AI Audit Suite 4.2</span>
          </div>

          <h1 className="font-headline-lg text-4xl sm:text-5xl md:text-6xl font-black text-on-surface tracking-tight leading-none">
            Adversarial Corporate Audit <br className="hidden sm:inline" />
            <span className="text-primary">Powered by Multi-Agent AI</span>
          </h1>

          <p className="text-body-lg text-on-surface-variant max-w-3xl mx-auto leading-relaxed">
            Stress-test financial projections, legal contracts, market positioning, and security policies with autonomous AI agents before regulators and auditors do.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleCtaClick('/processing')}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-on-primary-fixed-variant transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              Start New Audit
            </button>
            <button
              onClick={() => handleCtaClick('/dashboard')}
              className="w-full sm:w-auto px-8 py-4 bg-surface-container-high border border-outline-variant text-on-surface rounded-xl font-bold hover:bg-surface-variant transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">dashboard</span>
              Explore Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Enterprise Logos */}
      <section className="py-10 border-y border-outline-variant/30 bg-surface-container-low/50">
        <div className="max-w-7xl mx-auto px-container-padding text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-6">
            Trusted by Fortune 500 Risk Officers & Compliance Teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all">
            <span className="font-headline-md font-black text-on-surface text-xl">GLOBAL CORP</span>
            <span className="font-headline-md font-black text-on-surface text-xl">FINTECH ALLIANCE</span>
            <span className="font-headline-md font-black text-on-surface text-xl">NEXUS LEGAL</span>
            <span className="font-headline-md font-black text-on-surface text-xl">SECURE SHIELD</span>
            <span className="font-headline-md font-black text-on-surface text-xl">APEX VENTURES</span>
          </div>
        </div>
      </section>

      {/* Multi-Agent Vectoring Feature Grid */}
      <section className="py-24 px-container-padding max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-on-surface">
            Autonomous Multi-Agent Architecture
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            Four specialized AI agents analyze every dimension of your corporate assets simultaneously.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {/* Agent 1 */}
          <div className="bento-card bg-white p-8 rounded-2xl border border-outline-variant/40 custom-shadow flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-xl bg-blue-100 text-primary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">payments</span>
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">Financial Agent</h3>
              <p className="text-body-md text-on-surface-variant text-sm leading-relaxed mb-6">
                Audit P&L consistency, financial forecasting models, revenue multiples, and cash flow irregularities.
              </p>
            </div>
            <Link to="/agent-details" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
              View Agent Specs <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {/* Agent 2 */}
          <div className="bento-card bg-white p-8 rounded-2xl border border-outline-variant/40 custom-shadow flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-xl bg-amber-100 text-tertiary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">gavel</span>
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">Legal Agent</h3>
              <p className="text-body-md text-on-surface-variant text-sm leading-relaxed mb-6">
                Screen contracts for regulatory compliance, GDPR drift, indemnification risks, and adversarial clauses.
              </p>
            </div>
            <Link to="/report" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
              View Agent Specs <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {/* Agent 3 */}
          <div className="bento-card bg-white p-8 rounded-2xl border border-outline-variant/40 custom-shadow flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-xl bg-emerald-100 text-secondary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">trending_up</span>
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">Market Agent</h3>
              <p className="text-body-md text-on-surface-variant text-sm leading-relaxed mb-6">
                Benchmark competitor pricing, validate growth assumptions against real-world economic indicators.
              </p>
            </div>
            <Link to="/report" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
              View Agent Specs <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {/* Agent 4 */}
          <div className="bento-card bg-white p-8 rounded-2xl border border-outline-variant/40 custom-shadow flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-xl bg-red-100 text-error flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">shield_lock</span>
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">Security Agent</h3>
              <p className="text-body-md text-on-surface-variant text-sm leading-relaxed mb-6">
                Stress-test data leak vulnerabilities, prompt injection paths, and operational security controls.
              </p>
            </div>
            <Link to="/report-details" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
              View Agent Specs <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Pipeline */}
      <section className="py-20 bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-container-padding">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-headline-lg text-3xl font-bold text-on-surface mb-3">End-to-End Audit Pipeline</h2>
            <p className="text-body-lg text-on-surface-variant">From raw document upload to executive risk clearance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="bg-white p-6 rounded-xl border border-outline-variant/40 text-center relative z-10">
              <div className="w-12 h-12 bg-primary/10 text-primary font-black rounded-full flex items-center justify-center mx-auto mb-4 text-lg">
                1
              </div>
              <h4 className="font-bold text-on-surface mb-2">Document Ingestion</h4>
              <p className="text-xs text-on-surface-variant">Upload PDF, DOCX, XLSX, or code files for OCR extraction.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant/40 text-center relative z-10">
              <div className="w-12 h-12 bg-primary/10 text-primary font-black rounded-full flex items-center justify-center mx-auto mb-4 text-lg">
                2
              </div>
              <h4 className="font-bold text-on-surface mb-2">Central Coordinator</h4>
              <p className="text-xs text-on-surface-variant">Orchestrates parallel task distribution across sub-agents.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant/40 text-center relative z-10">
              <div className="w-12 h-12 bg-primary/10 text-primary font-black rounded-full flex items-center justify-center mx-auto mb-4 text-lg">
                3
              </div>
              <h4 className="font-bold text-on-surface mb-2">Adversarial Stress Test</h4>
              <p className="text-xs text-on-surface-variant">AI agents probe for anomalies, liabilities, and edge risks.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-outline-variant/40 text-center relative z-10">
              <div className="w-12 h-12 bg-secondary-container text-on-secondary-container font-black rounded-full flex items-center justify-center mx-auto mb-4 text-lg">
                4
              </div>
              <h4 className="font-bold text-on-surface mb-2">Executive Clearance</h4>
              <p className="text-xs text-on-surface-variant">Detailed findings report with actionable recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable FAQ Accordion */}
      <section className="py-24 px-container-padding max-w-4xl mx-auto">
        <h2 className="font-headline-lg text-3xl font-bold text-center text-on-surface mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-outline-variant/40 rounded-xl overflow-hidden custom-shadow transition-all"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-6 text-left font-bold text-on-surface flex justify-between items-center outline-none"
              >
                <span>{faq.q}</span>
                <span className="material-symbols-outlined text-primary">
                  {openFaq === index ? 'remove' : 'add'}
                </span>
              </button>
              {openFaq === index && (
                <div className="px-6 pb-6 text-on-surface-variant text-sm leading-relaxed border-t border-outline-variant/20 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 bg-primary-container text-white text-center px-container-padding">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold">Ready to Stress-Test Your Assets?</h2>
          <p className="text-body-lg opacity-90">
            Join enterprise compliance teams using Adversarial AI to ensure flawless audit readiness.
          </p>
          <button
            onClick={() => navigate('/processing')}
            className="px-10 py-4 bg-white text-primary rounded-xl font-bold shadow-xl hover:bg-surface transition-all hover:scale-105 active:scale-95"
          >
            Launch Audit System
          </button>
        </div>
      </section>

      {/* Footer Links */}
      <footer className="py-12 border-t border-outline-variant/40 bg-surface text-on-surface-variant text-sm">
        <div className="max-w-7xl mx-auto px-container-padding flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">security</span>
            <span className="font-bold text-on-surface">Adversarial Auditor AI</span>
          </div>
          <div className="flex gap-8 text-xs">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link to="/history" className="hover:text-primary transition-colors">
              Audit History
            </Link>
            <Link to="/settings" className="hover:text-primary transition-colors">
              Settings
            </Link>
            <Link to="/help" className="hover:text-primary transition-colors">
              Help Center
            </Link>
          </div>
          <p className="text-xs text-outline">© 2024 Adversarial Auditor AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
