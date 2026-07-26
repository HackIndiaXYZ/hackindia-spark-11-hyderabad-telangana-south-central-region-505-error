import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AgentDetails() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/30 custom-shadow">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline-lg text-2xl font-bold text-on-surface">Financial Agent Analysis</h2>
              <span className="px-2.5 py-0.5 bg-red-50 text-error text-[10px] font-bold rounded-full uppercase">
                Risk 82/100 • Critical
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">Deep-dive financial forecasting & P&L deficit investigation</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/report-details')}
            className="px-4 py-2 border border-outline-variant text-on-surface-variant text-xs font-bold rounded-xl hover:bg-surface-variant transition-colors"
          >
            Live Topology Hub
          </button>
          <button
            onClick={() => navigate('/report')}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-on-primary-fixed-variant transition-colors"
          >
            Full Executive Report
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Analysis Findings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Findings Card */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-4">
            <h3 className="font-bold text-sm text-on-surface">Financial Anomaly Findings</h3>
            <div className="p-4 bg-red-50/50 border border-error/20 rounded-xl text-xs space-y-2">
              <div className="flex justify-between items-center text-error font-bold">
                <span>Critical Finding #1: Unrealistic Growth Projections</span>
                <span>82/100 Risk</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                EMEA Region projections indicate an aggressive 42% YoY revenue growth model despite a regional operational deficit of $14.8M.
              </p>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-500/20 rounded-xl text-xs space-y-2">
              <div className="flex justify-between items-center text-amber-600 font-bold">
                <span>Medium Finding #2: Ambiguous Margin Multiples</span>
                <span>45/100 Risk</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                Operating margin multiples in Section 3.2 do not account for inflation adjustment clauses in European supply chain contracts.
              </p>
            </div>
          </div>

          {/* Document Citation Evidence */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-4">
            <h3 className="font-bold text-sm text-on-surface">Extracted Document Evidence</h3>
            <div className="p-4 bg-surface rounded-xl border border-outline-variant/30 font-mono text-xs text-on-surface-variant space-y-2">
              <p className="text-primary font-bold">Document Source: Q3_Financial_Forecast_v2.pdf (Page 4, Line 42)</p>
              <p className="p-3 bg-white rounded border border-outline-variant/20 italic">
                "...assuming constant quarterly revenue expansion of 42.4% across EMEA direct sales channels without additional overhead allocation..."
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-4">
            <h3 className="font-bold text-sm text-on-surface">Remediation Roadmap</h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-surface rounded-xl border border-outline-variant/30">
                <p className="font-bold text-on-surface mb-1">1. Recalibrate YoY Growth Model</p>
                <p className="text-on-surface-variant text-[11px]">
                  Cap Q3 revenue growth projections at conservative 14% industry benchmark.
                </p>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-outline-variant/30">
                <p className="font-bold text-on-surface mb-1">2. Inflation Indexing Clause</p>
                <p className="text-on-surface-variant text-[11px]">
                  Re-index supply chain operating margins against Eurozone CPI indicators.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
