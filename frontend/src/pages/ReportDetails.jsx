import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAuditDetails, fetchAudits } from '../services/api';

export default function ReportDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auditId = searchParams.get('id');

  // Elapsed timer simulation
  const [seconds, setSeconds] = useState(142);
  const [isolatedNodes, setIsolatedNodes] = useState([]);
  const [auditData, setAuditData] = useState(null);

  useEffect(() => {
    async function loadAudit() {
      try {
        if (auditId) {
          const res = await fetchAuditDetails(auditId);
          if (res) setAuditData(res);
        } else {
          const listRes = await fetchAudits();
          if (listRes && listRes.audits && listRes.audits.length > 0) {
            setAuditData(listRes.audits[0]);
          }
        }
      } catch (e) {
        console.warn('ReportDetails audit fetch fallback:', e);
      }
    }
    loadAudit();
  }, [auditId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  const handleIsolateNode = (agentName) => {
    if (isolatedNodes.includes(agentName)) {
      setIsolatedNodes(isolatedNodes.filter((n) => n !== agentName));
    } else {
      setIsolatedNodes([...isolatedNodes, agentName]);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/30 custom-shadow">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Live Agent Mesh Active</span>
          </div>
          <h2 className="font-headline-lg text-2xl font-bold text-on-surface">Live Topological Execution</h2>
          <p className="text-xs text-on-surface-variant">
            Target Asset: <span className="font-bold text-on-surface">{auditData?.document?.filename || auditData?.filename || 'Uploaded_Document.pdf'}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-surface px-5 py-2 rounded-xl border border-outline-variant/40 text-center">
            <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">Elapsed Time</p>
            <p className="font-mono text-xl font-bold text-primary">{formatTime(seconds)}</p>
          </div>
          <button
            onClick={() => navigate('/report')}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">summarize</span>
            <span>View Executive Report</span>
          </button>
        </div>
      </div>

      {/* SVG Topological Node Visualization Canvas */}
      <div className="bg-white rounded-2xl border border-outline-variant/40 custom-shadow p-8 text-center space-y-4">
        <h3 className="font-bold text-sm text-on-surface">LangGraph StateGraph Topological Mesh</h3>
        <p className="text-xs text-on-surface-variant">Parallel sub-agent fan-out processing with live vector feedback</p>

        {/* SVG Graph Canvas */}
        <div className="relative w-full max-w-3xl mx-auto h-72 bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden flex items-center justify-center p-6">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <line x1="15%" y1="50%" x2="50%" y2="20%" stroke="#004ac6" strokeWidth="2" strokeDasharray="6 6" className="marching-ants" />
            <line x1="15%" y1="50%" x2="50%" y2="40%" stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 6" className="marching-ants" />
            <line x1="15%" y1="50%" x2="50%" y2="60%" stroke="#d97706" strokeWidth="2" strokeDasharray="6 6" className="marching-ants" />
            <line x1="15%" y1="50%" x2="50%" y2="80%" stroke="#ba1a1a" strokeWidth="2" strokeDasharray="6 6" className="marching-ants" />

            <line x1="50%" y1="20%" x2="85%" y2="50%" stroke="#004ac6" strokeWidth="2" />
            <line x1="50%" y1="40%" x2="85%" y2="50%" stroke="#7c3aed" strokeWidth="2" />
            <line x1="50%" y1="60%" x2="85%" y2="50%" stroke="#d97706" strokeWidth="2" />
            <line x1="50%" y1="80%" x2="85%" y2="50%" stroke="#ba1a1a" strokeWidth="2" />
          </svg>

          {/* Node Overlay HTML */}
          <div className="relative z-10 flex justify-between items-center w-full max-w-2xl px-4">
            {/* Start Node */}
            <div className="w-14 h-14 bg-white border-2 border-primary text-primary rounded-full flex flex-col items-center justify-center font-bold text-[10px] shadow-md">
              <span className="material-symbols-outlined text-sm">upload_file</span>
              <span>Input</span>
            </div>

            {/* Middle Parallel Sub-Agent Nodes */}
            <div className="space-y-3">
              <div
                onClick={() => handleIsolateNode('financial')}
                className={`w-32 px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                  isolatedNodes.includes('financial') ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border-blue-200 text-blue-700 shadow-sm'
                }`}
              >
                <span>Financial Node</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              </div>

              <div
                onClick={() => handleIsolateNode('legal')}
                className={`w-32 px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                  isolatedNodes.includes('legal') ? 'bg-purple-600 text-white shadow-lg' : 'bg-white border-purple-200 text-purple-700 shadow-sm'
                }`}
              >
                <span>Legal Node</span>
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              </div>

              <div
                onClick={() => handleIsolateNode('market')}
                className={`w-32 px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                  isolatedNodes.includes('market') ? 'bg-amber-600 text-white shadow-lg' : 'bg-white border-amber-200 text-amber-700 shadow-sm'
                }`}
              >
                <span>Market Node</span>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              </div>

              <div
                onClick={() => handleIsolateNode('security')}
                className={`w-32 px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                  isolatedNodes.includes('security') ? 'bg-red-600 text-white shadow-lg' : 'bg-white border-red-200 text-red-700 shadow-sm'
                }`}
              >
                <span>Security Node</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              </div>
            </div>

            {/* Fan-In Coordinator Node */}
            <div className="w-16 h-16 bg-primary text-white rounded-2xl flex flex-col items-center justify-center font-bold text-[10px] shadow-lg">
              <span className="material-symbols-outlined text-base">hub</span>
              <span>Coordinator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Node Progress & Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 custom-shadow space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-on-surface">
            <span>Financial Agent</span>
            <span className="text-primary">82%</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '82%' }}></div>
          </div>
          <p className="text-[10px] text-on-surface-variant">Analyzing EMEA $14.8M revenue deficit</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 custom-shadow space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-on-surface">
            <span>Legal Agent</span>
            <span className="text-purple-600">65%</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: '65%' }}></div>
          </div>
          <p className="text-[10px] text-on-surface-variant">Screening Section 4.2 liability clauses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 custom-shadow space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-on-surface">
            <span>Market Agent</span>
            <span className="text-amber-600">90%</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-600 h-full rounded-full" style={{ width: '90%' }}></div>
          </div>
          <p className="text-[10px] text-on-surface-variant">Benchmarking regional competitor prices</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 custom-shadow space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-on-surface">
            <span>Security Agent</span>
            <span className="text-error">95%</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
            <div className="bg-error h-full rounded-full" style={{ width: '95%' }}></div>
          </div>
          <p className="text-[10px] text-on-surface-variant">Probing Appendix B prompt injection vulnerability</p>
        </div>
      </div>
    </div>
  );
}
