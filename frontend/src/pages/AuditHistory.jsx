import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAudits } from '../services/api';
import { historyApi } from '../api/history';

export default function AuditHistory() {
  const navigate = useNavigate();

  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [selectedAudits, setSelectedAudits] = useState([]);
  const [activeDrawerAudit, setActiveDrawerAudit] = useState(null);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchAudits();
        if (res && res.audits) {
          setAudits(res.audits);
        }
      } catch (err) {
        console.warn('History fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    try {
      const lastUpload = localStorage.getItem('ca_last_upload');
      if (lastUpload) {
        const parsed = JSON.parse(lastUpload);
        if (parsed.filename) {
          setUploadedFilename(parsed.filename);
          setShowUploadSuccess(true);
        }
      }
    } catch (e) {}
  }, []);

  const displayList = audits;


  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAudits(displayList.map((a) => a.id));
    } else {
      setSelectedAudits([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedAudits.includes(id)) {
      setSelectedAudits(selectedAudits.filter((item) => item !== id));
    } else {
      setSelectedAudits([...selectedAudits, id]);
    }
  };

  const filteredAudits = displayList.filter((audit) => {
    const filename = audit.document?.filename || audit.filename || `AUD-${audit.id}`;
    const matchesSearch =
      filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `#${audit.id}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk =
      riskFilter === 'All' || (audit.overall_risk || '').toUpperCase() === riskFilter.toUpperCase();
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Upload Success Banner */}
      {showUploadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-secondary flex justify-between items-center shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>
              Document <span className="font-black underline">{uploadedFilename || 'Corporate_Document.pdf'}</span> was uploaded & audited successfully! Audit history logs updated.
            </span>
          </div>
          <button
            onClick={() => {
              setShowUploadSuccess(false);
              localStorage.removeItem('ca_last_upload');
            }}
            className="text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/30 custom-shadow">
        <div>
          <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-1">Audit History Logs</h2>
          <p className="text-xs text-on-surface-variant">Review, search, and bulk export historical audit reports in PDF, Excel, & JSON</p>
        </div>
        <button
          onClick={() => navigate('/processing')}
          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span> New Audit
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 custom-shadow flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name or ID..."
              className="w-full bg-surface border border-outline-variant/40 rounded-xl py-2 pl-9 pr-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-bold outline-none"
          >
            <option value="All">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {selectedAudits.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-primary">{selectedAudits.length} selected</span>
            <button
              onClick={() => alert(`Exporting ${selectedAudits.length} reports...`)}
              className="px-3.5 py-1.5 bg-surface-container-high border border-outline-variant/40 text-on-surface font-bold rounded-lg hover:bg-surface-variant"
            >
              Export Selected
            </button>
          </div>
        )}
      </div>

      {/* Main Logs Table */}
      <div className="bg-white rounded-2xl border border-outline-variant/40 custom-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedAudits.length === displayList.length}
                    className="rounded text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3.5 whitespace-nowrap">Audit ID & Document</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Department</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Timestamp</th>
                <th className="px-6 py-3.5 text-center whitespace-nowrap">Risk Score</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-xs">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-outline">inbox</span>
                      <p className="text-xs font-bold text-on-surface">No audit logs found in the database.</p>
                      <p className="text-[11px] text-on-surface-variant">Upload a PDF document to run multi-agent AI audit analysis.</p>
                      <button
                        onClick={() => navigate('/processing')}
                        className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>Start New Audit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAudits.map((audit) => {
                  const name = audit.document?.filename || audit.filename || `Audit_${audit.id}.pdf`;
                  const score = audit.overall_score || 50;
                  const dateStr = audit.created_at
                    ? new Date(audit.created_at).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                      })
                    : 'Today';
                  const riskLevel = (audit.overall_risk || 'CRITICAL').toUpperCase();

                  return (
                    <tr key={audit.id} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedAudits.includes(audit.id)}
                          onChange={() => handleSelectOne(audit.id)}
                          className="rounded text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-on-surface">{name}</p>
                        <p className="text-[10px] text-outline">Audit ID #{audit.id}</p>
                      </td>

                      <td className="px-6 py-4 font-bold text-on-surface-variant whitespace-nowrap">Finance & Risk</td>
                      <td className="px-6 py-4 text-on-surface-variant whitespace-nowrap">{dateStr}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase whitespace-nowrap inline-block ${
                            riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
                              ? 'bg-red-50 text-error border border-red-200'
                              : 'bg-emerald-50 text-secondary border border-emerald-200'
                          }`}
                        >
                          {score}/100 • {riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-secondary font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check_circle</span> Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setActiveDrawerAudit(audit)}
                            className="px-3 py-1.5 border border-outline-variant text-on-surface-variant font-bold rounded-lg hover:bg-surface-variant transition-colors whitespace-nowrap"
                          >
                            Quick Preview
                          </button>
                          <button
                            onClick={() => navigate(`/report?id=${audit.id}`)}
                            className="px-3.5 py-1.5 bg-primary text-white font-bold rounded-lg hover:bg-on-primary-fixed-variant transition-colors whitespace-nowrap"
                          >
                            View Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Preview Slide-out Drawer */}
      {activeDrawerAudit && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant/40 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-outline uppercase">#{activeDrawerAudit.id}</span>
                  <h3 className="font-bold text-base text-on-surface">
                    {activeDrawerAudit.document?.filename || activeDrawerAudit.filename || `Audit_${activeDrawerAudit.id}.pdf`}
                  </h3>
                </div>
                <button onClick={() => setActiveDrawerAudit(null)} className="text-outline hover:text-on-surface p-1">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-surface rounded-xl border border-outline-variant/30 flex justify-between items-center">
                  <span className="font-bold text-on-surface-variant">Overall Risk Score</span>
                  <span className="font-black text-error">{activeDrawerAudit.overall_score || 88}/100</span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-on-surface">Sub-Agents Executed</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Financial', 'Legal', 'Market', 'Security'].map((agent) => (
                      <span key={agent} className="px-2.5 py-1 bg-blue-50 text-primary text-[10px] font-bold rounded-lg">
                        {agent} Agent
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-on-surface">Executive Exports</h4>
                  <div className="flex gap-2">
                    <a
                      href={historyApi.getPdfUrl(activeDrawerAudit.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-red-50 text-error rounded-xl font-bold text-[10px] uppercase text-center border border-red-200 hover:bg-red-100"
                    >
                      📄 PDF Report
                    </a>
                    <a
                      href={historyApi.getExcelUrl(activeDrawerAudit.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-[10px] uppercase text-center border border-emerald-200 hover:bg-emerald-100"
                    >
                      📊 Excel
                    </a>
                    <a
                      href={historyApi.getJsonUrl(activeDrawerAudit.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-blue-50 text-primary rounded-xl font-bold text-[10px] uppercase text-center border border-blue-200 hover:bg-blue-100"
                    >
                      📋 JSON
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant/40 flex gap-3">
              <button
                onClick={() => navigate(`/report?id=${activeDrawerAudit.id}`)}
                className="flex-1 py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-on-primary-fixed-variant transition-colors"
              >
                Open Full Executive Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
