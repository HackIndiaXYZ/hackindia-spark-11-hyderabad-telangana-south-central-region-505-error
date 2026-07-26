import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { notificationApi } from '../api/notification';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your Autonomous Audit Assistant. How can I help you analyze risk vectors or model projections today?',
    },
  ]);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadNotifs() {
      try {
        const data = await notificationApi.getNotifications();
        if (Array.isArray(data)) setNotifications(data);
      } catch (err) {
        console.warn('Failed to fetch notifications:', err);
      }
    }
    loadNotifs();
    const interval = setInterval(loadNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => n.status !== 'read').length;

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n))
      );
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        return JSON.parse(userStr);
      }
    } catch (e) {
      console.warn('Failed to parse user session');
    }
    return { fullName: 'Alex Sterling', role: 'Senior Auditor', email: 'alex@enterprise.com' };
  };

  const currentUser = getUserData();
  const fullName = currentUser.fullName || currentUser.name || 'Alex Sterling';
  const role = currentUser.role || 'Senior Auditor';
  const email = currentUser.email || 'alex@enterprise.com';
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AS';

  // Use avatar_url (from backend) and build absolute URL
  const rawAvatarUrl = currentUser.avatar_url || currentUser.avatar || '';
  const avatarSrc = rawAvatarUrl
    ? (rawAvatarUrl.startsWith('http') ? rawAvatarUrl : `http://127.0.0.1:8000${rawAvatarUrl}`)
    : '';

  // Shared default SVG person icon
  const DefaultAvatar = ({ size = 'sm' }) => (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'}
    >
      <circle cx="40" cy="30" r="16" fill="#94A3B8" />
      <ellipse cx="40" cy="68" rx="26" ry="18" fill="#94A3B8" />
    </svg>
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('ca_token');
    localStorage.removeItem('user');
    localStorage.removeItem('ca_user');
    localStorage.removeItem('ca_last_upload');
    navigate('/login');
  };


  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'New Audit', path: '/processing', icon: 'add_circle' },
    { label: 'Live Topology', path: '/report-details', icon: 'account_tree' },
    { label: 'Audit Reports', path: '/report', icon: 'analytics' },
    { label: 'Agent Analysis', path: '/agent-details', icon: 'smart_toy' },
    { label: 'Audit Logs', path: '/history', icon: 'history_edu' },
    { label: 'My Profile', path: '/profile', icon: 'person' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
    { label: 'Help Center', path: '/help', icon: 'help' },
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Analyzing vector query: "${userText}". All 4 domain agents report operational readiness.`,
        },
      ]);
    }, 800);
  };

  return (
    <div className="text-on-surface bg-background h-screen overflow-hidden flex">
      {/* Persistent Left Sidebar Navigation Drawer (Desktop) */}
      <aside className="fixed left-0 top-0 h-full z-40 flex flex-col py-6 bg-surface-container-low border-r border-outline-variant w-72 shadow-md hidden lg:flex">
        {/* Brand Logo Header */}
        <div className="px-6 mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl font-black">
              security
            </span>
            <h1 className="font-headline-md text-lg font-black text-primary tracking-tight">
              Adversarial Auditor
            </h1>
          </Link>
        </div>

        {/* Dynamic Clickable User Profile Card */}
        <div className="px-5 mb-6">
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 p-3 bg-surface-container-highest rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant border border-outline-variant/40 shrink-0 flex items-center justify-center">
              {avatarSrc ? (
                <img
                  className="w-full h-full object-cover"
                  alt={fullName}
                  src={avatarSrc}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                  }}
                />
              ) : (
                <DefaultAvatar size="md" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                {fullName}
              </p>
              <p className="text-[10px] text-on-surface-variant truncate">{role}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              title="Sign Out"
              className="text-outline hover:text-error transition-colors p-1"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          </div>
        </div>

        {/* Persistent Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 py-2.5 px-4 font-bold rounded-xl transition-all duration-150 ease-in-out text-xs ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Viewport */}
      <div className="lg:ml-72 flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Top Persistent Header Bar */}
        <header className="flex justify-between items-center px-6 h-16 w-full bg-surface border-b border-outline-variant/40 shrink-0 shadow-xs z-30">
          <div className="flex items-center gap-4 w-1/2">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
                search
              </span>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-full py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                placeholder="Global Audit Search..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell Center */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors relative"
                title="Notifications"
              >
                notifications
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-error text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/40 py-3 z-50 animate-fade-in">
                  <div className="px-4 pb-2 border-b border-outline-variant/30 flex justify-between items-center">
                    <span className="font-bold text-xs text-on-surface">Notifications Center</span>
                    <span className="text-[10px] bg-blue-50 text-primary px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} Unread
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant/20">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-on-surface-variant">
                        No notifications right now.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs flex justify-between items-start gap-2 hover:bg-surface transition-colors ${
                            n.status !== 'read' ? 'bg-blue-50/40 font-bold' : ''
                          }`}
                        >
                          <div className="space-y-1">
                            <p className="text-on-surface text-[11px] leading-snug">{n.message}</p>
                            <p className="text-[9px] text-outline">
                              {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                            </p>
                          </div>
                          {n.status !== 'read' && (
                            <button
                              onClick={() => handleMarkRead(n.id)}
                              className="text-[9px] bg-primary text-white px-2 py-0.5 rounded font-bold hover:brightness-110 shrink-0"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors"
              title="AI Assistant Chat"
            >
              smart_toy
            </button>
            <Link
              to="/help"
              className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors"
              title="Help Center"
            >
              help
            </Link>
            <div className="h-6 w-px bg-outline-variant/40 mx-1 hidden sm:block"></div>

            {/* Dynamic Clickable Header Profile */}
            <div
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-xs font-bold text-on-surface hidden sm:inline">{fullName}</span>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant border border-outline-variant/30 flex items-center justify-center">
                {avatarSrc ? (
                  <img className="w-full h-full object-cover" alt={fullName} src={avatarSrc} />
                ) : (
                  <DefaultAvatar size="sm" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Slide-out Drawer */}
        {mobileSidebarOpen && (
          <div className="lg:hidden bg-surface border-b border-outline-variant p-4 space-y-2 z-40 shadow-lg">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold ${
                  location.pathname === item.path
                    ? 'bg-primary text-white'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Child Viewport Render Container */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-surface">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Assistant Modal */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl border border-outline-variant/40 custom-shadow z-50 flex flex-col h-[480px] overflow-hidden">
          <div className="bg-primary text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">smart_toy</span>
              <span className="font-bold text-xs">Autonomous Audit Assistant</span>
            </div>
            <button onClick={() => setChatOpen(false)} className="hover:opacity-80">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface text-xs custom-scrollbar">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-surface-container-high text-on-surface rounded-bl-none border border-outline-variant/30'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant/30 bg-white flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI about audit findings..."
              className="flex-1 bg-surface border border-outline-variant/40 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-on-primary-fixed-variant"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
