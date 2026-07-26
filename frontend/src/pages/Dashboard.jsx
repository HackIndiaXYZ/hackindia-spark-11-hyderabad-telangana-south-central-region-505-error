import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAudits, fetchAnalytics, runAudit } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [audits, setAudits] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showRecentUpload, setShowRecentUpload] = useState(false);
  const [latestFilename, setLatestFilename] = useState('');

  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('ca_user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        return JSON.parse(userStr);
      }
    } catch (e) {}
    return { name: 'Alex Sterling', email: 'alex.sterling@enterprise.com' };
  };

  const currentUser = getUserData();
  const firstName = (currentUser.name || currentUser.fullName || 'Alex Sterling').split(' ')[0];

  useEffect(() => {
    async function loadData() {
      try {
        const [auditsRes, analyticsRes] = await Promise.all([
          fetchAudits(),
          fetchAnalytics(),
        ]);
        if (auditsRes && auditsRes.audits) setAudits(auditsRes.audits);
        if (analyticsRes) setAnalytics(analyticsRes);
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Check if a document was recently uploaded
    try {
      const lastUpload = localStorage.getItem('ca_last_upload');
      if (lastUpload) {
        const parsed = JSON.parse(lastUpload);
        if (parsed.filename) {
          setLatestFilename(parsed.filename);
          setShowRecentUpload(true);
        }
      }
    } catch (e) {}
  }, []);

  const handleBrowseFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      setLatestFilename(file.name);
      setShowRecentUpload(true);
      try {
        const res = await runAudit(file);
        setUploading(false);
        navigate(`/report-details?id=${res.audit_id || ''}`);
      } catch (err) {
        setUploading(false);
        alert(err.message || 'Audit execution failed.');
      }
    }
  };

  const totalAudits = analytics?.total_audits ?? (audits.length > 0 ? audits.length : 1284);
  const avgScore = analytics?.average_risk_score ? `${analytics.average_risk_score}%` : '12.8%';
  const criticalCount = analytics?.critical_findings_count ?? (audits.filter(a => (a.overall_risk || '').toUpperCase() === 'CRITICAL').length || 24);

  return (
    <div className="space-y-8 pb-12">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.docx,.xlsx,.sol,.py,.js"
      />

      {/* Upload Success Banner */}
      {showRecentUpload && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-secondary flex justify-between items-center shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>
              Document <span className="font-black underline">{latestFilename || 'Corporate_Document.pdf'}</span> was uploaded successfully! Multi-agent audit analysis is ready.
            </span>
          </div>
          <button
            onClick={() => {
              setShowRecentUpload(false);
              localStorage.removeItem('ca_last_upload');
            }}
            className="text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Welcome Header */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/30 custom-shadow">
        <div>
          <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-1">
            Good Morning, {firstName}
          </h2>
          <p className="text-sm text-on-surface-variant max-w-2xl">
            Your AI agents detected {criticalCount} anomalies. Audit readiness is currently at <span className="font-bold text-secondary">98.4%</span>.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/processing')}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-on-primary-fixed-variant transition-colors shadow-md active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span> New Audit
          </button>
          <button
            onClick={handleBrowseFiles}
            className="px-6 py-2.5 border border-outline-variant bg-surface text-primary rounded-xl text-xs font-bold hover:bg-surface-variant transition-colors active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">file_upload</span> Import Report
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat Card 1 */}
        <div
          className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow hover:-translate-y-1 transition-all cursor-pointer"
          onClick={() => navigate('/history')}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-primary p-2.5 bg-blue-50 rounded-xl">
              assignment
            </span>
            <span className="text-xs font-bold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +12%
            </span>
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Total Audits</p>
          <h3 className="font-headline-md text-3xl font-black text-on-surface">{totalAudits}</h3>
        </div>

        {/* Stat Card 2 */}
        <div
          className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow hover:-translate-y-1 transition-all cursor-pointer"
          onClick={() => navigate('/history')}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-secondary p-2.5 bg-emerald-50 rounded-xl">
              check_circle
            </span>
            <span className="text-xs font-bold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +4%
            </span>
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Successful Reviews</p>
          <h3 className="font-headline-md text-3xl font-black text-on-surface">
            {Math.max(0, totalAudits - criticalCount)}
          </h3>
        </div>

        {/* Stat Card 3 */}
        <div
          className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow hover:-translate-y-1 transition-all border-l-4 border-l-error cursor-pointer"
          onClick={() => navigate('/report')}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-error p-2.5 bg-red-50 rounded-xl">
              warning
            </span>
            <span className="text-xs font-bold text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +2
            </span>
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Critical Findings</p>
          <h3 className="font-headline-md text-3xl font-black text-error">{criticalCount}</h3>
        </div>

        {/* Stat Card 4 */}
        <div
          className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow hover:-translate-y-1 transition-all cursor-pointer"
          onClick={() => navigate('/agent-details')}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-tertiary p-2.5 bg-amber-50 rounded-xl">
              analytics
            </span>
            <span className="text-xs font-bold text-on-surface-variant">Neutral</span>
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Avg. Risk Score</p>
          <h3 className="font-headline-md text-3xl font-black text-on-surface">{avgScore}</h3>
        </div>
      </section>

      {/* Main Layout Grid: Document Upload & AI Agent Status */}
      <section className="grid grid-cols-12 gap-6">
        {/* Upload Zone (Col 8) */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          <div
            onClick={handleBrowseFiles}
            className="bg-white p-8 rounded-2xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center group hover:border-primary transition-all cursor-pointer min-h-[300px] custom-shadow"
          >
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
              <span className="material-symbols-outlined text-3xl text-outline group-hover:text-primary">
                upload_file
              </span>
            </div>
            <h4 className="font-headline-md text-xl font-bold text-on-surface mb-2">
              Upload Corporate Document
            </h4>
            <p className="text-xs text-on-surface-variant mb-6 max-w-md leading-relaxed">
              Drag and drop documents here or click to browse. Supports PDF, DOCX, and XLSX up to 100MB.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseFiles();
              }}
              className="px-8 py-2.5 border border-outline-variant text-on-surface text-xs font-bold rounded-xl hover:bg-surface-variant transition-colors"
            >
              Browse Files
            </button>
          </div>

          {/* Recent Upload Preview */}
          {showRecentUpload && (
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 custom-shadow">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">description</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-on-surface">{latestFilename || 'Q3_Financial_Forecast_v2.pdf'}</span>
                    <span className="text-[10px] text-on-surface-variant">
                      {uploading ? 'Processing Audit...' : 'Audit Complete'}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${uploading ? 'bg-primary animate-pulse w-[65%]' : 'bg-emerald-500 w-full'}`}
                    ></div>
                  </div>
                </div>
                <button
                  onClick={() => setShowRecentUpload(false)}
                  className="text-outline hover:text-error transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Agent Status (Col 4) */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-sm text-on-surface">AI Agent Status</h4>
                <span
                  className="material-symbols-outlined text-outline text-sm cursor-pointer hover:text-on-surface"
                  onClick={() => navigate('/report-details')}
                >
                  more_vert
                </span>
              </div>
              <div className="space-y-4">
                {/* Agent 1 */}
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-surface p-2.5 rounded-xl transition-colors"
                  onClick={() => navigate('/agent-details')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">payments</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Financial Agent</p>
                      <p className="text-[9px] text-secondary font-bold">READY</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                </div>

                {/* Agent 2 */}
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-surface p-2.5 rounded-xl transition-colors"
                  onClick={() => navigate('/report')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">gavel</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Legal Agent</p>
                      <p className="text-[9px] text-primary font-bold">ANALYZING</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                </div>

                {/* Agent 3 */}
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-surface p-2.5 rounded-xl transition-colors"
                  onClick={() => navigate('/report')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">trending_up</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Market Agent</p>
                      <p className="text-[9px] text-on-surface-variant font-bold">IDLE</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                </div>

                {/* Agent 4 */}
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-surface p-2.5 rounded-xl transition-colors"
                  onClick={() => navigate('/report-details')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-error flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">shield_lock</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Security Agent</p>
                      <p className="text-[9px] text-error font-bold">BUSY</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-error animate-ping"></div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant/30 mt-6">
              <button
                onClick={() => navigate('/report-details')}
                className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high rounded-xl text-primary text-xs font-bold transition-colors"
              >
                Open Agent Topology Hub
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Audits Table Section */}
      <section className="bg-white rounded-2xl border border-outline-variant/40 custom-shadow overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
          <h4 className="font-bold text-base text-on-surface">Recent Audits</h4>
          <Link to="/history" className="text-primary text-xs font-bold hover:underline">
            View All Logs
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Document</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-center">Risk Level</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-xs">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-2xl text-outline">description</span>
                      <p className="text-xs font-bold text-on-surface">No recent audit logs in database.</p>
                      <button
                        onClick={() => navigate('/processing')}
                        className="mt-1 px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-on-primary-fixed-variant transition-colors"
                      >
                        + Launch New Audit
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (

                audits.slice(0, 5).map((a) => {
                  const name = a.document?.filename || a.filename || `Audit_${a.id}.pdf`;

                  return (
                    <tr key={a.id} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4 font-bold text-on-surface">
                        {name}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Today'}
                      </td>


                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                          (a.overall_risk || '').toUpperCase() === 'CRITICAL'
                            ? 'bg-red-50 text-error'
                            : (a.overall_risk || '').toUpperCase() === 'HIGH'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-secondary'
                        }`}
                      >
                        {a.overall_risk || 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-secondary font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span> Completed
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/report?id=${a.id}`)}
                        className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-on-primary-fixed-variant transition-colors"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                );
              })

              )}

            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
