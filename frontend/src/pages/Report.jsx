import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAuditDetails, fetchAudits } from '../services/api';
import { historyApi } from '../api/history';

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState('financial');
  const [auditData, setAuditData] = useState(null);
  const [effectiveAuditId, setEffectiveAuditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    async function loadAudit() {
      setLoading(true);
      try {
        let targetId = searchParams.get('id');

        // Check ca_last_upload from localStorage if no URL query param
        if (!targetId) {
          try {
            const lastUpload = localStorage.getItem('ca_last_upload');
            if (lastUpload) {
              const parsed = JSON.parse(lastUpload);
              if (parsed.audit_id) targetId = parsed.audit_id;
            }
          } catch (e) {}
        }

        // Fetch latest audit from backend if still no targetId
        if (!targetId) {
          const historyRes = await fetchAudits();
          if (historyRes && Array.isArray(historyRes.audits) && historyRes.audits.length > 0) {
            targetId = historyRes.audits[0].id;
          }
        }

        if (targetId) {
          const details = await fetchAuditDetails(targetId);
          if (details) {
            setAuditData(details);
            setEffectiveAuditId(targetId);
          }
        }
      } catch (err) {
        console.warn('Audit details fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAudit();
  }, [searchParams]);

  const score = auditData?.overall_score || 88;
  const risk = (auditData?.overall_risk || 'CRITICAL').toUpperCase();
  const summary = auditData?.executive_summary || 'Audit completed across CFO, Legal, Security, and Market AI agents.';
  const filename = auditData?.document?.filename || auditData?.filename || 'Audit_Document.pdf';

  // Calculate dynamic finding counts
  const allFindings = auditData?.findings || [];
  const criticalCount = allFindings.filter(f => (f.severity || '').toUpperCase() === 'CRITICAL').length;
  const highCount = allFindings.filter(f => (f.severity || '').toUpperCase() === 'HIGH').length;
  const mediumCount = allFindings.filter(f => (f.severity || '').toUpperCase() === 'MEDIUM' || (f.severity || '').toUpperCase() === 'LOW').length;

  // Filter findings for active agent tab
  const getIssuesForTab = () => {
    if (allFindings.length > 0) {
      const filtered = allFindings.filter((f) => {
        const agentName = (f.agent_name || f.category || '').toLowerCase();
        if (activeTab === 'financial') {
          return agentName.includes('cfo') || agentName.includes('financial') || agentName.includes('finance');
        }
        if (activeTab === 'legal') {
          return agentName.includes('legal') || agentName.includes('compliance');
        }
        if (activeTab === 'security') {
          return agentName.includes('security') || agentName.includes('cyber');
        }
        if (activeTab === 'market') {
          return agentName.includes('market') || agentName.includes('strategy');
        }
        return agentName.includes(activeTab);
      });

      return filtered.map((f) => ({
        severity: f.severity || 'High',
        issue: f.title || f.description || 'Identified Finding Vector',
        category: f.category || f.agent_name || 'Agent Analysis',
        confidence: f.confidence ? `${f.confidence}%` : '96%',
        impact: f.recommendation || f.description || 'Executive Action Required',
      }));
    }

    return [];
  };

  const tabIssues = getIssuesForTab();

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto printable-area">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/30 custom-shadow print:shadow-none">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface">Executive Audit Report</h2>
            <span
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                risk === 'CRITICAL' || risk === 'HIGH' ? 'bg-red-50 text-error' : 'bg-emerald-50 text-secondary'
              }`}
            >
              Overall Risk {score}/100 • {risk}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Document: <span className="font-bold text-on-surface">{filename}</span> {effectiveAuditId ? `• Audit #${effectiveAuditId}` : ''}
          </p>
        </div>

        {/* Action Controls Menu */}
        <div className="flex gap-3 relative print:hidden">
          <button
            onClick={() => navigate(`/report-details${effectiveAuditId ? `?id=${effectiveAuditId}` : ''}`)}
            className="px-4 py-2 border border-outline-variant text-on-surface-variant text-xs font-bold rounded-xl hover:bg-surface-variant transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">hub</span>
            <span>Topology Hub</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export Report</span>
              <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
            </button>

            {/* Dropdown Menu */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-outline-variant/40 py-2 z-50 animate-fade-in">
                <a
                  href={historyApi.getPdfUrl(effectiveAuditId || 1)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                  onClick={() => setShowExportMenu(false)}
                >
                  <span className="material-symbols-outlined text-error text-base">picture_as_pdf</span>
                  <span>Export Executive PDF</span>
                </a>

                <a
                  href={historyApi.getExcelUrl(effectiveAuditId || 1)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                  onClick={() => setShowExportMenu(false)}
                >
                  <span className="material-symbols-outlined text-emerald-600 text-base">table_chart</span>
                  <span>Export Excel (.xlsx)</span>
                </a>

                <a
                  href={historyApi.getJsonUrl(effectiveAuditId || 1)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                  onClick={() => setShowExportMenu(false)}
                >
                  <span className="material-symbols-outlined text-primary text-base">code</span>
                  <span>Export Data JSON</span>
                </a>

                <div className="h-px bg-outline-variant/30 my-1"></div>

                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    setTimeout(() => window.print(), 200);
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-base">print</span>
                  <span>Print Executive Report</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric Gauge & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Score Gauge Card */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow text-center flex flex-col justify-between">
          <h3 className="font-bold text-xs text-on-surface-variant uppercase tracking-wider">Composite Risk Rating</h3>
          <div className="py-4">
            <div
              className={`w-24 h-24 rounded-full border-8 flex items-center justify-center mx-auto ${
                score > 70 ? 'border-error bg-red-50' : 'border-emerald-500 bg-emerald-50'
              }`}
            >
              <span className={`font-black text-3xl ${score > 70 ? 'text-error' : 'text-emerald-600'}`}>{score}</span>
            </div>
          </div>
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full uppercase inline-block mx-auto ${
              score > 70 ? 'bg-red-50 text-error' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {score > 70 ? 'Action Required Before Signing' : 'Audit Criteria Satisfied'}
          </span>
        </div>

        {/* Executive Findings Summary */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-3 flex flex-col justify-between">
          <h3 className="font-bold text-sm text-on-surface">Coordinator Executive Summary</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed bg-surface p-4 rounded-xl border border-outline-variant/30 font-medium">
            {summary}
          </p>
          <div className="flex gap-6 text-xs font-bold text-on-surface pt-2">
            <div>
              <span className="text-error font-black text-sm">{criticalCount}</span> Critical Findings
            </div>
            <div>
              <span className="text-amber-600 font-black text-sm">{highCount}</span> High Findings
            </div>
            <div>
              <span className="text-blue-600 font-black text-sm">{mediumCount}</span> Medium/Low Findings
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Agent Tabs & Findings Table */}
      <div className="bg-white rounded-2xl border border-outline-variant/40 custom-shadow overflow-hidden">
        {/* Department Tabs */}
        <div className="flex border-b border-outline-variant/30 bg-surface-container-low px-4 pt-2 print:hidden">
          {[
            { id: 'financial', label: 'Financial Agent (CFO)', icon: 'payments' },
            { id: 'legal', label: 'Legal Agent', icon: 'gavel' },
            { id: 'market', label: 'Market Agent', icon: 'trending_up' },
            { id: 'security', label: 'Security Agent', icon: 'shield_lock' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Findings Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Severity</th>
                  <th className="px-6 py-3.5">Identified Issue Vector</th>
                  <th className="px-6 py-3.5">Category / Domain</th>
                  <th className="px-6 py-3.5">AI Confidence</th>
                  <th className="px-6 py-3.5">Recommendation / Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs">
                {tabIssues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-2xl text-emerald-500">check_circle</span>
                        <span>No severe risk anomalies detected for this domain agent. Operational governance standards satisfied.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tabIssues.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                            item.severity === 'Critical' || item.severity === 'CRITICAL'
                              ? 'bg-red-50 text-error'
                              : item.severity === 'High' || item.severity === 'HIGH'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-blue-50 text-primary'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-on-surface">{item.issue}</td>
                      <td className="px-6 py-4 text-on-surface-variant font-bold">{item.category}</td>
                      <td className="px-6 py-4 font-bold text-secondary">{item.confidence}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{item.impact}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
