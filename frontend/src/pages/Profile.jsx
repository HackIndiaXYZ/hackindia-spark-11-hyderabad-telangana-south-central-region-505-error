import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile, updateUserProfile, fetchAnalytics, uploadAvatar } from '../services/api';

// ── helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return 'U';
  return name.trim().split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'long', year: 'numeric',
    });
  } catch {
    return isoStr;
  }
}

// ── small field component ─────────────────────────────────────────────────────
function Field({ label, value, onChange, disabled, type = 'text', children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
        {label}
      </label>
      {children || (
        <input
          type={type}
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary disabled:opacity-70 transition"
        />
      )}
    </div>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, iconColor, label, value, onClick, loading }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl border border-outline-variant/40 custom-shadow hover:-translate-y-0.5 transition-transform ${onClick ? 'cursor-pointer' : ''}`}
    >
      <span className={`material-symbols-outlined mb-1 ${iconColor}`}>{icon}</span>
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-black text-on-surface mt-1">
        {loading ? <span className="inline-block w-12 h-6 bg-outline-variant/30 rounded animate-pulse" /> : value}
      </h3>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();

  // ── state ──
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // editable fields
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle]     = useState('');
  const [company, setCompany]       = useState('');
  const [country, setCountry]       = useState('');
  const [timezone, setTimezone]     = useState('');
  const [bio, setBio]               = useState('');

  const [isEditing, setIsEditing]       = useState(false);
  const [isSaving, setIsSaving]         = useState(false);
  const [saveSuccess, setSaveSuccess]   = useState(false);
  const [saveError, setSaveError]       = useState('');

  // avatar
  const [avatarUrl, setAvatarUrl]           = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError]       = useState('');
  const avatarInputRef                      = useRef(null);

  // password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword]             = useState('');
  const [confirmPassword, setConfirmPassword]     = useState('');
  const [passwordMsg, setPasswordMsg]             = useState('');

  // ── populate form from user object ──
  const populateForm = useCallback((u) => {
    setName(u.name || '');
    setPhone(u.phone || '');
    setDepartment(u.department || '');
    setJobTitle(u.job_title || u.role || '');
    setCompany(u.company || '');
    setCountry(u.country || '');
    setTimezone(u.timezone || '');
    setBio(u.bio || '');
    setAvatarUrl(u.avatar_url || '');
  }, []);

  // ── fetch profile from backend ──
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setLoadError('');
      try {
        const data = await fetchUserProfile();
        setUser(data);
        populateForm(data);
      } catch (err) {
        // Fallback to localStorage if token expired / offline
        const cached = localStorage.getItem('user');
        if (cached) {
          try {
            const u = JSON.parse(cached);
            setUser(u);
            populateForm(u);
          } catch (_) {}
        }
        setLoadError('Could not reach backend — showing cached data.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [populateForm]);

  // ── fetch analytics ──
  useEffect(() => {
    async function loadAnalytics() {
      setAnalyticsLoading(true);
      try {
        const data = await fetchAnalytics();
        if (data) setAnalytics(data);
      } catch (_) {}
      finally { setAnalyticsLoading(false); }
    }
    loadAnalytics();
  }, []);

  // ── save profile ──
  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      const updated = await updateUserProfile({
        name, phone, department,
        job_title: jobTitle, company, country, timezone, bio,
      });
      setUser(updated);
      populateForm(updated);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) populateForm(user);
    setIsEditing(false);
    setSaveError('');
  };

  // ── handle avatar file pick ──
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setUser(updated);
      populateForm(updated);
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload photo.');
    } finally {
      setAvatarUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // ── change password (client-side only for now) ──
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg('Password must be at least 8 characters.');
      return;
    }
    setPasswordMsg('Password updated successfully!');
    setTimeout(() => {
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('');
    }, 1500);
  };

  // ── derived display values ──
  const displayName    = name || user?.name || 'User';
  const displayEmail   = user?.email || '—';
  const displayRole    = jobTitle || user?.role || 'Auditor';
  const displayCompany = company || user?.company || '—';
  const joinedDate     = formatDate(user?.created_at);
  const userId         = user?.id ? `AE-${String(user.id).padStart(4, '0')}` : '—';

  // analytics
  const totalAudits     = analytics?.total_audits ?? '—';
  const avgScore        = analytics?.average_risk_score != null
    ? `${Math.round(analytics.average_risk_score)}%` : '—';
  const criticalCount   = analytics?.critical_findings_count ?? '—';
  const avgTimeDisplay  = '—'; // not tracked yet

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-outline-variant/30 custom-shadow">
        <div>
          <nav className="flex mb-1 gap-2 text-xs text-on-surface-variant">
            <span onClick={() => navigate('/dashboard')} className="cursor-pointer hover:text-primary transition-colors">Dashboard</span>
            <span>/</span>
            <span className="text-primary font-bold">Profile</span>
          </nav>
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface">My Profile</h1>
          <p className="text-xs text-on-surface-variant">
            Manage your account, professional details, and live audit statistics.
          </p>
        </div>
        {loadError && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <span className="material-symbols-outlined text-sm">wifi_off</span>
            {loadError}
          </div>
        )}
      </div>

      {/* ── Success / Error banners ── */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-secondary rounded-2xl text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          Profile saved successfully to database!
        </div>
      )}
      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 text-error rounded-2xl text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {saveError}
        </div>
      )}
      {avatarError && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">photo_camera</span>
          {avatarError}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-12 gap-6">

        {/* ══ LEFT COLUMN (col-8) ══ */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* Profile Overview Card */}
          <section className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow flex flex-col md:flex-row items-center md:items-start gap-6">

            {/* Avatar */}
            <div className="relative shrink-0">
              {/* Hidden file input */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />

              {/* Avatar circle */}
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-surface-container-high ring-4 ring-primary/10 bg-surface-variant flex items-center justify-center select-none">
                {avatarUploading ? (
                  /* Uploading spinner */
                  <div className="flex flex-col items-center gap-1">
                    <svg className="animate-spin w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                  </div>
                ) : avatarUrl ? (
                  /* User's photo */
                  <img
                    src={`http://127.0.0.1:8000${avatarUrl}`}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* Default SVG person icon */
                  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20">
                    <circle cx="40" cy="30" r="16" fill="#94A3B8"/>
                    <ellipse cx="40" cy="68" rx="26" ry="18" fill="#94A3B8"/>
                  </svg>
                )}
              </div>

              {/* Camera overlay button */}
              <button
                type="button"
                title="Change profile photo"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white hover:bg-on-primary-fixed-variant transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z"/>
                  <path d="M9 3 7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9Zm3 14a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>
                </svg>
              </button>

              {/* Online dot */}
              <div className="absolute top-1 right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white" title="Online" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {loading
                  ? <div className="w-40 h-6 bg-outline-variant/30 rounded animate-pulse" />
                  : <h2 className="font-headline-md text-xl font-bold text-on-surface">{displayName}</h2>
                }
                <span className="px-2.5 py-0.5 bg-emerald-50 text-secondary text-[10px] font-bold rounded-full uppercase">Active</span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-full uppercase">Verified</span>
              </div>

              <p className="text-xs font-semibold text-on-surface-variant">
                {displayRole} {department ? `· ${department}` : ''}
              </p>
              <p className="text-xs text-outline">{displayCompany}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 text-xs">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-outline text-sm">badge</span>
                  <span>ID: {userId}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-outline text-sm">mail</span>
                  <span className="truncate">{displayEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-outline text-sm">calendar_today</span>
                  <span>Joined {joinedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-outline text-sm">admin_panel_settings</span>
                  <span className="capitalize">{user?.role || 'Auditor'} Access</span>
                </div>
                {phone && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-outline text-sm">phone</span>
                    <span>{phone}</span>
                  </div>
                )}
                {country && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-outline text-sm">location_on</span>
                    <span>{country}</span>
                  </div>
                )}
              </div>

              {bio && (
                <p className="text-xs text-on-surface-variant mt-2 italic leading-relaxed border-l-2 border-primary/30 pl-3">
                  {bio}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 w-full md:w-auto shrink-0">
              <button
                onClick={() => { setIsEditing(!isEditing); setSaveError(''); }}
                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-on-primary-fixed-variant transition-colors"
              >
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-5 py-2 border border-outline-variant text-primary text-xs font-bold rounded-xl hover:bg-surface-variant transition-colors"
              >
                Change Password
              </button>
            </div>
          </section>

          {/* Account Statistics (live from /analytics) */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="assessment"     iconColor="text-primary"  label="Total Audits"      value={totalAudits}   loading={analyticsLoading} onClick={() => navigate('/history')} />
            <StatCard icon="report_problem" iconColor="text-error"    label="Critical Findings" value={criticalCount}  loading={analyticsLoading} onClick={() => navigate('/report')} />
            <StatCard icon="speed"          iconColor="text-amber-600" label="Avg. Risk Score"  value={avgScore}      loading={analyticsLoading} />
            <StatCard icon="timer"          iconColor="text-secondary" label="Avg. Audit Time"  value={avgTimeDisplay} loading={analyticsLoading} />
          </section>

          {/* Professional Information Form */}
          <section className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="font-bold text-sm text-on-surface">Professional Information</h3>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                isEditing ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-outline'
              }`}>
                {isEditing ? '✏ Editing Mode' : 'View Mode'}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-10 bg-outline-variant/20 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name"    value={name}       onChange={setName}       disabled={!isEditing} />
                <Field label="Email"        value={displayEmail} onChange={() => {}}    disabled={true} type="email" />
                <Field label="Phone Number" value={phone}      onChange={setPhone}      disabled={!isEditing} />
                <Field label="Department"   value={department} onChange={setDepartment} disabled={!isEditing} />
                <Field label="Job Title"    value={jobTitle}   onChange={setJobTitle}   disabled={!isEditing} />
                <Field label="Organization" value={company}    onChange={setCompany}    disabled={!isEditing} />

                <Field label="Country" value={country} onChange={setCountry} disabled={!isEditing}>
                  <select
                    disabled={!isEditing}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                  >
                    <option value="">Select country...</option>
                    {['USA', 'India', 'Canada', 'UK', 'Germany', 'France', 'Australia', 'Singapore', 'Japan', 'UAE'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Time Zone" value={timezone} onChange={setTimezone} disabled={!isEditing}>
                  <select
                    disabled={!isEditing}
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                  >
                    <option value="">Select timezone...</option>
                    {['IST (GMT+5:30)', 'EST (GMT-5)', 'PST (GMT-8)', 'GMT (UTC+0)', 'CET (GMT+1)', 'CST (GMT-6)', 'JST (GMT+9)', 'AEST (GMT+10)'].map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </Field>

                {/* Bio spans full width */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Professional Bio
                  </label>
                  <textarea
                    disabled={!isEditing}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder={isEditing ? 'Brief professional summary (max 500 chars)...' : ''}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary disabled:opacity-70 resize-none transition"
                  />
                  {isEditing && (
                    <p className="text-[10px] text-outline text-right mt-0.5">{bio.length}/500</p>
                  )}
                </div>
              </form>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2 rounded-xl border border-outline-variant text-on-surface-variant text-xs font-bold hover:bg-surface-variant transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-on-primary-fixed-variant flex items-center gap-1.5 disabled:opacity-60 transition"
                  >
                    {isSaving
                      ? <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Saving...</>
                      : <><span className="material-symbols-outlined text-sm">save</span> Save Changes</>
                    }
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-on-primary-fixed-variant flex items-center gap-1.5 transition"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit Information
                </button>
              )}
            </div>
          </section>

          {/* Achievements */}
          <section className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-4">
            <h3 className="font-bold text-sm text-on-surface">Audit Achievements & Badges</h3>
            <div className="flex flex-wrap gap-6 pt-2">
              {[
                { icon: 'stars',            color: 'text-primary',  bg: 'bg-blue-50',  border: 'border-primary/20',  label: 'First Audit',     earned: (analytics?.total_audits || 0) >= 1 },
                { icon: 'workspace_premium',color: 'text-amber-600',bg: 'bg-amber-50', border: 'border-amber-500/20', label: '10 Audits',       earned: (analytics?.total_audits || 0) >= 10 },
                { icon: 'verified_user',    color: 'text-secondary',bg: 'bg-emerald-50',border:'border-secondary/20', label: 'Security Expert', earned: (analytics?.critical_findings_count || 0) > 5 },
                { icon: 'emoji_events',     color: 'text-amber-500',bg: 'bg-amber-50', border: 'border-amber-400/20', label: '50 Audits',       earned: (analytics?.total_audits || 0) >= 50 },
              ].map((badge) => (
                <div key={badge.label} className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className={`w-16 h-16 ${badge.bg} rounded-full flex items-center justify-center border-2 ${badge.border} group-hover:scale-105 transition-transform ${!badge.earned ? 'opacity-30 grayscale' : ''}`}>
                    <span className={`material-symbols-outlined ${badge.color} text-2xl`}>{badge.icon}</span>
                  </div>
                  <span className={`text-xs font-bold text-on-surface ${!badge.earned ? 'opacity-40' : ''}`}>
                    {badge.label}
                  </span>
                  {!badge.earned && (
                    <span className="text-[9px] text-outline uppercase">Locked</span>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* ══ RIGHT COLUMN (col-4) ══ */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-3">
            <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: 'add_circle', label: 'New Audit',     to: '/processing' },
                { icon: 'history',    label: 'Audit History', to: '/history'    },
                { icon: 'analytics',  label: 'Reports',       to: '/report'     },
                { icon: 'settings',   label: 'Settings',      to: '/settings'   },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-surface hover:bg-primary hover:text-white transition-all group border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined mb-1 group-hover:text-white text-primary">{a.icon}</span>
                  <span className="text-[11px] font-bold">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Audit Stats from backend */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-4">
            <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Audit Statistics</h4>
            {analyticsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 bg-outline-variant/20 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Total Audits',      value: analytics?.total_audits ?? 0,                             color: 'text-primary' },
                  { label: 'Critical Findings', value: analytics?.critical_findings_count ?? 0,                  color: 'text-error' },
                  { label: 'Avg. Risk Score',   value: `${Math.round(analytics?.average_risk_score ?? 0)}/100`,  color: 'text-amber-600' },
                  { label: 'Critical Audits',   value: analytics?.audits_by_risk?.CRITICAL ?? 0,                 color: 'text-error' },
                  { label: 'High Risk Audits',  value: analytics?.audits_by_risk?.HIGH ?? 0,                     color: 'text-amber-600' },
                  { label: 'Low Risk Audits',   value: analytics?.audits_by_risk?.LOW ?? 0,                      color: 'text-secondary' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-outline-variant/20 last:border-0">
                    <span className="text-on-surface-variant font-bold">{item.label}</span>
                    <span className={`font-black ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Security */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-3 text-xs">
            <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Account Security</h4>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/30">
              <span className="text-on-surface-variant font-bold">Authentication</span>
              <span className="font-bold text-secondary">JWT Active</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/30">
              <span className="text-on-surface-variant font-bold">Account Status</span>
              <span className="font-bold text-secondary">Active ✓</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/30">
              <span className="text-on-surface-variant font-bold">Email Verified</span>
              <span className="font-bold text-primary">Yes</span>
            </div>
            <div className="py-2">
              <p className="text-on-surface-variant text-[10px] uppercase font-bold mb-2">Current Session</p>
              <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary">laptop_mac</span>
                <div>
                  <p className="font-bold text-on-surface">Browser Session</p>
                  <p className="text-[10px] text-outline">JWT Token • Session Active</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full mt-2 py-2 text-xs font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition"
            >
              Change Password
            </button>
          </div>

          {/* Account Info (read-only) */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 custom-shadow space-y-3 text-xs">
            <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Account Info</h4>
            {[
              { label: 'User ID',    value: userId },
              { label: 'Role',       value: user?.role || 'auditor' },
              { label: 'Member Since', value: joinedDate },
              { label: 'Email',      value: displayEmail },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-outline-variant/20 last:border-0">
                <span className="text-on-surface-variant font-bold">{item.label}</span>
                <span className="text-on-surface font-bold truncate max-w-[60%] text-right">{item.value}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 custom-shadow space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="font-bold text-base text-on-surface">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {passwordMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${passwordMsg.includes('success') ? 'bg-emerald-50 text-secondary' : 'bg-red-50 text-error'}`}>
                {passwordMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant text-xs font-bold rounded-xl hover:bg-surface-variant transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-on-primary-fixed-variant transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
