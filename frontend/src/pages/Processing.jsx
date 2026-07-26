import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditApi } from '../api/audit';
import { fetchUserDocuments, fetchAudits } from '../services/api';

export default function Processing() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Configuration state
  const [auditName, setAuditName] = useState('Q3 Strategy Integrity Check');
  const [department, setDepartment] = useState('Finance');
  const [priorityLevel, setPriorityLevel] = useState('Critical');
  const [isLaunching, setIsLaunching] = useState(false);
  const [clientId] = useState(() => `client_${Math.random().toString(36).substring(2, 9)}`);

  // Document upload & selection state
  const [uploadedFile, setUploadedFile] = useState({
    name: 'proposal.pdf',
    size: '1.2 MB',
    pages: 12,
    rawFile: null,
  });
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Real-time audit progress state
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Ready for Audit');
  const [stepMessage, setStepMessage] = useState('Select document and click Launch to start multi-agent analysis');
  const [agentStatuses, setAgentStatuses] = useState({
    CFO: 'waiting',
    Legal: 'waiting',
    Security: 'waiting',
    Market: 'waiting',
    Coordinator: 'waiting',
  });
  const [logs, setLogs] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch available documents
  useEffect(() => {
    async function loadDocs() {
      setLoadingDocs(true);
      try {
        const docsRes = await fetchUserDocuments().catch(() => []);
        const auditsRes = await fetchAudits().catch(() => ({ audits: [] }));
        
        const docsList = [];
        const seenNames = new Set();

        let lastUploadFilename = null;
        try {
          const lastUpload = localStorage.getItem('ca_last_upload');
          if (lastUpload) {
            const parsed = JSON.parse(lastUpload);
            if (parsed.filename) lastUploadFilename = parsed.filename;
          }
        } catch (e) {}

        if (Array.isArray(docsRes)) {
          docsRes.forEach((d) => {
            if (d.filename && !seenNames.has(d.filename)) {
              seenNames.add(d.filename);
              docsList.push({
                id: d.id,
                name: d.filename,
                size: d.file_size ? `${(d.file_size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB',
                pages: 12,
                uploaded_at: d.uploaded_at
              });
            }
          });
        }

        if (auditsRes && Array.isArray(auditsRes.audits)) {
          auditsRes.audits.forEach((a) => {
            const fname = a.document?.filename || a.filename;
            if (fname && !seenNames.has(fname)) {
              seenNames.add(fname);
              docsList.push({
                id: a.id,
                name: fname,
                size: '2.4 MB',
                pages: 14,
                uploaded_at: a.created_at
              });
            }
          });
        }

        const defaultSamples = [
          { id: 'sample-1', name: 'proposal.pdf', size: '1.05 MB', pages: 12 },
          { id: 'sample-2', name: 'Q3_Financial_Forecast.pdf', size: '2.4 MB', pages: 14 },
          { id: 'sample-3', name: 'EU_Regulatory_Compliance_2024.pdf', size: '3.1 MB', pages: 18 },
          { id: 'sample-4', name: 'Corporate_Acquisition_Agreement.pdf', size: '1.9 MB', pages: 10 }
        ];

        defaultSamples.forEach((s) => {
          if (!seenNames.has(s.name)) {
            docsList.push(s);
          }
        });

        setAvailableDocuments(docsList);

        if (lastUploadFilename && seenNames.has(lastUploadFilename)) {
          const match = docsList.find((d) => d.name === lastUploadFilename);
          if (match) {
            setUploadedFile({
              id: match.id,
              name: match.name,
              size: match.size || '1.8 MB',
              pages: 12,
              rawFile: null,
            });
          }
        } else if (docsList.length > 0) {
          setUploadedFile({
            id: docsList[0].id,
            name: docsList[0].name,
            size: docsList[0].size || '1.8 MB',
            pages: 12,
            rawFile: null,
          });
        }
      } catch (e) {
        console.warn('Document loading error:', e);
      } finally {
        setLoadingDocs(false);
      }
    }
    loadDocs();
  }, []);


  // WebSocket Connection Lifecycle
  useEffect(() => {
    let ws = null;
    let heartbeat = null;

    if (isLaunching) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//127.0.0.1:8000/ws/audit/${clientId}`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log(`WebSocket connected to ${wsUrl}`);
          // Send ping heartbeat every 15s
          heartbeat = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          if (event.data === 'pong') return;
          try {
            const data = JSON.parse(event.data);
            if (data.progress !== undefined) setProgress(data.progress);
            if (data.step) setCurrentStep(data.step);
            if (data.message) setStepMessage(data.message);

            // Update Agent Statuses
            if (data.agent) {
              setAgentStatuses((prev) => ({
                ...prev,
                [data.agent]: data.status || 'running',
              }));
            }

            // Append Log Entry
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLogs((prev) => [
              { time: timestamp, step: data.step, message: data.message || data.step },
              ...prev,
            ]);

            // Handle Failures
            if (data.status === 'failed') {
              setErrorMsg(data.error || 'Agent execution failed.');
            }

            // Handle Completion Redirect
            if (data.progress === 100 || data.step === 'Completed') {
              setTimeout(() => {
                navigate(`/report?id=${data.audit_id || ''}`);
              }, 1200);
            }
          } catch (e) {
            console.warn('Malformed WebSocket message:', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('WebSocket error connection fallback active:', err);
        };

        ws.onclose = () => {
          if (heartbeat) clearInterval(heartbeat);
        };
      } catch (err) {
        console.warn('WebSocket initialization failed:', err);
      }
    }

    return () => {
      if (ws) ws.close();
      if (heartbeat) clearInterval(heartbeat);
    };
  }, [isLaunching, clientId, navigate]);

  const handleLaunchAudit = async () => {
    setIsLaunching(true);
    setErrorMsg('');
    setProgress(5);
    setCurrentStep('Uploading PDF');
    setStepMessage('Transferring encrypted document to security vault...');

    try {
      const activeFilename = uploadedFile.name || 'proposal.pdf';
      localStorage.setItem('ca_last_upload', JSON.stringify({
        filename: activeFilename,
        timestamp: new Date().toISOString()
      }));

      if (uploadedFile.rawFile) {
        const res = await auditApi.uploadAndAudit(uploadedFile.rawFile, clientId);
        setCurrentStep('Background Task Enqueued');
        setStepMessage(`Task [${res.task_id}] queued. Streaming background execution...`);
        localStorage.setItem('ca_last_upload', JSON.stringify({
          filename: activeFilename,
          audit_id: res.audit_id,
          timestamp: new Date().toISOString()
        }));
      } else if (uploadedFile.id) {
        const res = await auditApi.auditExistingDocument(uploadedFile.id, clientId);
        setCurrentStep('Background Task Enqueued');
        setStepMessage(`Task [${res.task_id}] queued. Streaming background execution for '${activeFilename}'...`);
        localStorage.setItem('ca_last_upload', JSON.stringify({
          filename: activeFilename,
          audit_id: res.audit_id,
          timestamp: new Date().toISOString()
        }));
      } else {
        // Simulated progress sequence fallback
        const steps = [
          { p: 15, step: 'Extracting Text', msg: 'Running OCR text extraction...', agent: 'CFO', status: 'running' },
          { p: 35, step: 'Running CFO Agent', msg: 'Auditing ROI & margin projections...', agent: 'CFO', status: 'completed' },
          { p: 50, step: 'Running Legal Agent', msg: 'Scanning GDPR Art 17 & contract risks...', agent: 'Legal', status: 'completed' },
          { p: 65, step: 'Running Security Agent', msg: 'Testing prompt injection & PII leak paths...', agent: 'Security', status: 'completed' },
          { p: 80, step: 'Running Market Agent', msg: 'Benchmarking regional competitor prices...', agent: 'Market', status: 'completed' },
          { p: 95, step: 'Coordinator Agent', msg: 'Synthesizing multi-agent findings into verdict...', agent: 'Coordinator', status: 'completed' },
          { p: 100, step: 'Completed', msg: 'Audit complete! Redirecting to report...', agent: 'Coordinator', status: 'completed' },
        ];

        let idx = 0;
        const interval = setInterval(() => {
          if (idx < steps.length) {
            const item = steps[idx];
            setProgress(item.p);
            setCurrentStep(item.step);
            setStepMessage(item.msg);
            setAgentStatuses((prev) => ({ ...prev, [item.agent]: item.status }));
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLogs((prev) => [{ time: timestamp, step: item.step, message: item.msg }, ...prev]);
            idx++;
          } else {
            clearInterval(interval);
            setTimeout(() => navigate('/report'), 1000);
          }
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || err.message || 'Audit execution failed. Please check server status.');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const selectedDoc = {
        id: `upload_${Date.now()}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        pages: 12,
        rawFile: file,
      };
      setUploadedFile(selectedDoc);
      setAvailableDocuments((prev) => [
        selectedDoc,
        ...prev.filter((d) => d.name !== file.name)
      ]);
    }
  };


  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.docx,.xlsx"
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/30 custom-shadow">
        <div>
          <span className="px-3 py-1 bg-blue-50 text-primary text-[10px] font-bold uppercase rounded-full tracking-wider">
            {isLaunching ? 'Step 2 of 3 • Real-Time Audit Execution' : 'Step 1 of 3 • Audit Configuration'}
          </span>
          <h2 className="font-headline-lg text-2xl font-bold text-on-surface mt-2">
            {isLaunching ? 'AI Audit In Progress' : 'New Audit Setup'}
          </h2>
          <p className="text-xs text-on-surface-variant">
            {isLaunching ? 'Streaming real-time LangGraph agent state updates...' : 'Configure target scope and select AI vector agents'}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 border border-outline-variant text-on-surface-variant text-xs font-bold rounded-xl hover:bg-surface-variant transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-error text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={handleLaunchAudit}
            className="px-3 py-1 bg-error text-white rounded-lg text-xs font-bold hover:brightness-110"
          >
            Retry Execution
          </button>
        </div>
      )}

      {/* Live Audit Progress View */}
      {isLaunching ? (
        <div className="space-y-6 animate-fade-in">
          {/* Main Progress Bar Card */}
          <div className="bg-white p-8 rounded-2xl border border-outline-variant/40 custom-shadow space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-on-surface">{currentStep}</h3>
                <p className="text-xs text-on-surface-variant">{stepMessage}</p>
              </div>
              <span className="text-3xl font-black text-primary">{progress}%</span>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden relative">
              <div
                className="bg-primary h-full rounded-full transition-all duration-700 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Agent Status Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* CFO Agent Card */}
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 custom-shadow space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">payments</span>
                  <span className="text-xs font-bold text-on-surface">CFO Agent</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    agentStatuses.CFO === 'completed'
                      ? 'bg-emerald-50 text-secondary'
                      : agentStatuses.CFO === 'running'
                      ? 'bg-blue-50 text-primary'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {agentStatuses.CFO}
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant">ROI & Revenue Margin Audit</p>
            </div>

            {/* Legal Agent Card */}
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 custom-shadow space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-600 text-base">gavel</span>
                  <span className="text-xs font-bold text-on-surface">Legal Agent</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    agentStatuses.Legal === 'completed'
                      ? 'bg-emerald-50 text-secondary'
                      : agentStatuses.Legal === 'running'
                      ? 'bg-purple-50 text-purple-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {agentStatuses.Legal}
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant">GDPR & Contract Risks</p>
            </div>

            {/* Security Agent Card */}
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 custom-shadow space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-base">shield_lock</span>
                  <span className="text-xs font-bold text-on-surface">Security Agent</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    agentStatuses.Security === 'completed'
                      ? 'bg-emerald-50 text-secondary'
                      : agentStatuses.Security === 'running'
                      ? 'bg-red-50 text-error'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {agentStatuses.Security}
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant">Prompt Injection & PII Exposure</p>
            </div>

            {/* Market Agent Card */}
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/40 custom-shadow space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-base">trending_up</span>
                  <span className="text-xs font-bold text-on-surface">Market Agent</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    agentStatuses.Market === 'completed'
                      ? 'bg-emerald-50 text-secondary'
                      : agentStatuses.Market === 'running'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {agentStatuses.Market}
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant">Competitor Pricing Benchmark</p>
            </div>
          </div>

          {/* Live Activity Feed Log */}
          <div className="bg-white rounded-2xl border border-outline-variant/40 custom-shadow p-6 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Live Execution Activity Feed</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto font-mono text-xs">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-surface rounded-lg border border-outline-variant/20">
                  <span className="text-[10px] text-primary font-bold">{log.time}</span>
                  <span className="font-bold text-on-surface">{log.step}:</span>
                  <span className="text-on-surface-variant">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Configuration Setup View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-4">
              <h3 className="font-bold text-sm text-on-surface">1. Audit Scope & Identity</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Audit Title
                  </label>
                  <input
                    type="text"
                    value={auditName}
                    onChange={(e) => setAuditName(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                      Department Scope
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    >
                      <option value="Finance">Financial Services</option>
                      <option value="Legal">Legal & Regulatory</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Operations">Executive Ops</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                      Priority Tier
                    </label>
                    <select
                      value={priorityLevel}
                      onChange={(e) => setPriorityLevel(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    >
                      <option value="Critical">Critical Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-on-surface">2. Select Document to Audit</h3>
                  <p className="text-[11px] text-on-surface-variant">Choose from uploaded PDF files or upload a new document</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  <span>Upload New PDF</span>
                </button>
              </div>

              {/* Currently Selected Active Target */}
              <div className="p-4 bg-blue-50/60 border-2 border-primary rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-on-surface">{uploadedFile.name}</span>
                      <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-bold rounded-full uppercase">Active Target</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">{uploadedFile.size} • OCR Vectorized & Ready for Multi-Agent Audit</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-secondary text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span> Ready
                </span>
              </div>

              {/* Uploaded Documents Selection Grid */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Uploaded PDF Repository ({availableDocuments.length} Documents)
                </p>
                
                {loadingDocs ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-surface-container-high/50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {availableDocuments.map((doc) => {
                      const isSelected = uploadedFile.name === doc.name;
                      return (
                        <div
                          key={doc.id || doc.name}
                          onClick={() => {
                            setUploadedFile({
                              id: doc.id,
                              name: doc.name,
                              size: doc.size || '2.1 MB',
                              pages: doc.pages || 12,
                              rawFile: doc.rawFile || null,
                            });
                          }}

                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50/80 border-primary shadow-xs'
                              : 'bg-white border-outline-variant/40 hover:border-primary/40 hover:bg-surface-variant/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'
                            }`}>
                              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${isSelected ? 'text-primary font-black' : 'text-on-surface'}`}>
                                {doc.name}
                              </p>
                              <p className="text-[10px] text-on-surface-variant">
                                {doc.size || '2.1 MB'} {doc.uploaded_at ? `• Uploaded ${new Date(doc.uploaded_at).toLocaleDateString()}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <span className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">check</span> Selected
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="px-2.5 py-1 border border-outline-variant/60 text-on-surface-variant text-[10px] font-bold rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors"
                              >
                                Select
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-4">
              <h3 className="font-bold text-sm text-on-surface">3. Launch Execution</h3>
              <button
                onClick={handleLaunchAudit}
                className="w-full py-3.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg hover:bg-on-primary-fixed-variant transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                <span>Launch Multi-Agent Audit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
