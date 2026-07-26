import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Help() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      q: 'How long does an audit take?',
      a: 'Typical audits take between 10 to 15 seconds across our parallel sub-agent fan-out architecture.',
    },
    {
      q: 'What file types are supported?',
      a: 'We support PDF (with PyMuPDF OCR text extraction), DOCX, XLSX, CSV, and Smart Contract source files (.sol, .py, .js).',
    },
    {
      q: 'How is data secured?',
      a: 'All model inference can run on air-gapped local hardware via Ollama and Qwen2.5:7B. Data in transit is encrypted via TLS 1.3 and stored in MongoDB Atlas.',
    },
    {
      q: 'Does the AI send data to external third-party APIs?',
      a: 'No. Adversarial Auditor AI utilizes local model runners (Ollama + Qwen2.5) by default. Zero corporate text leaves your designated environment.',
    },
    {
      q: 'Can I export reports?',
      a: 'Yes, reports can be exported in executive PDF, raw JSON payload, or CSV format.',
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-primary text-white p-8 rounded-2xl custom-shadow space-y-4 relative overflow-hidden">
        <div className="relative z-10">
          <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
            Documentation & Support Hub
          </span>
          <h2 className="font-headline-lg text-3xl font-bold mt-2">How can we help your audit today?</h2>
          <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
            Search developer documentation, domain agent specifications, or read FAQ guides.
          </p>

          <div className="mt-4 relative max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documentation topics..."
              className="w-full bg-white text-on-surface border border-outline-variant/40 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-2">
          <span className="material-symbols-outlined text-primary text-2xl">rocket_launch</span>
          <h3 className="font-bold text-sm text-on-surface">Getting Started</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Learn how to upload corporate documents and run multi-agent adversarial audits.
          </p>
          <button
            onClick={() => navigate('/processing')}
            className="text-primary text-xs font-bold hover:underline pt-2 inline-block"
          >
            Start New Audit →
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-2">
          <span className="material-symbols-outlined text-purple-600 text-2xl">smart_toy</span>
          <h3 className="font-bold text-sm text-on-surface">Agent Architecture</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Understand how Financial, Legal, Market, and Security agents analyze risk vectors.
          </p>
          <button
            onClick={() => navigate('/report-details')}
            className="text-primary text-xs font-bold hover:underline pt-2 inline-block"
          >
            View Live Topology →
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-2">
          <span className="material-symbols-outlined text-emerald-600 text-2xl">settings</span>
          <h3 className="font-bold text-sm text-on-surface">Model Settings</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Configure local Ollama inference models, temperature parameters, and API keys.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="text-primary text-xs font-bold hover:underline pt-2 inline-block"
          >
            Configure Settings →
          </button>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-4">
        <h3 className="font-bold text-base text-on-surface">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 bg-surface rounded-xl border border-outline-variant/30 space-y-1">
              <h4 className="font-bold text-xs text-on-surface">{faq.q}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
