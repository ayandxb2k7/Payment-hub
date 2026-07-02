import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { useTheme } from '../contexts';
import { useNotifications } from '../contexts';
import { useToast } from '../contexts';
import { globalSearch } from '../db';
import type { SearchableItem } from '../types';

// Icons as simple SVG components
function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const icons = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  transactions: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  customers: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
  invoices: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  subscriptions: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z',
  refunds: 'M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4',
  analytics: 'M18 20V10 M12 20V4 M6 20v-6',
  ai: 'M12 2a4 4 0 014 4v1a4 4 0 01-8 0V6a4 4 0 014-4z M16 11a4 4 0 01-8 0 M12 15v4 M10 19h4',
  webhooks: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  developer: 'M16 18l6-6-6-6 M8 6l-6 6 6 6',
  api: 'M10 17h4M12 3v1m0 16v1m-7-8H4m16 0h-1m-2.636-6.364l-.707-.707m-8.486 8.486l-.707.707m0-8.486l.707-.707m8.486 8.486l.707.707',
  notifications: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  profile: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2 M12 7a4 4 0 100-8 4 4 0 000 8z',
  settings: 'M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z M12 8a4 4 0 100 8 4 4 0 000-8z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  menu: 'M3 12h18M3 6h18M3 18h18',
  x: 'M18 6L6 18M6 6l12 12',
  chevronDown: 'M6 9l6 6 6-6',
};

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
  { path: '/transactions', label: 'Transactions', icon: icons.transactions },
  { path: '/customers', label: 'Customers', icon: icons.customers },
  { path: '/invoices', label: 'Invoices', icon: icons.invoices },
  { path: '/subscriptions', label: 'Subscriptions', icon: icons.subscriptions },
  { path: '/refunds', label: 'Refunds', icon: icons.refunds },
  { path: '/analytics', label: 'Analytics', icon: icons.analytics },
  { path: '/ai-insights', label: 'AI Insights', icon: icons.ai },
  { path: '/webhooks', label: 'Webhook Logs', icon: icons.webhooks },
  { path: '/developer', label: 'Developer Settings', icon: icons.developer },
  { path: '/api-keys', label: 'API Keys', icon: icons.api },
  { path: '/notifications', label: 'Notifications', icon: icons.notifications },
  { path: '/profile', label: 'Profile', icon: icons.profile },
  { path: '/settings', label: 'Settings', icon: icons.settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, notifications, markRead, markAllRead } = useNotifications();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = globalSearch(searchQuery);
      setSearchResults(results);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    addToast('info', 'Logged out successfully');
  };

  const handleSearchSelect = (item: SearchableItem) => {
    navigate(item.path);
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleNotifClick = (id: string) => {
    markRead(id);
  };

  const typeColors: Record<string, string> = {
    transaction: 'text-blue-500',
    customer: 'text-green-500',
    invoice: 'text-amber-500',
    subscription: 'text-purple-500',
    refund: 'text-red-500',
    webhook: 'text-gray-500',
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside
        className="no-print flex flex-col border-r transition-all duration-200"
        style={{
          width: sidebarOpen ? 250 : 64,
          backgroundColor: 'var(--color-sidebar)',
          borderColor: 'var(--color-border)',
          minWidth: sidebarOpen ? 250 : 64,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: 'var(--color-accent)' }}>
            P
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
              PaymentHub
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              title={item.label}
            >
              <Icon d={item.icon} size={18} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Sidebar toggle */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-link w-full"
          >
            <Icon d={sidebarOpen ? 'M11 19l-7-7 7-7' : 'M13 5l7 7-7 7'} size={18} />
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="no-print h-16 flex items-center justify-between px-6 border-b"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          {/* Search */}
          <div ref={searchRef} className="relative w-full max-w-md">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }}>
                <Icon d={icons.search} size={16} />
              </span>
              <input
                type="text"
                placeholder="Search transactions, customers, invoices..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-9 pr-4 py-2"
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
            {showSearch && searchResults.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg overflow-hidden z-50"
                style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
              >
                {searchResults.map(item => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSearchSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:opacity-80"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <span className={`text-xs font-medium uppercase ${typeColors[item.type] || ''}`}>{item.type}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{item.label}</div>
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.sublabel}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showSearch && searchQuery.trim() && searchResults.length === 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg p-4 text-center text-sm z-50"
                style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
              >
                No results found for "{searchQuery}"
              </div>
            )}
          </div>

          {/* Header right */}
          <div className="flex items-center gap-2 ml-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn-ghost p-2"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              <Icon d={theme === 'light' ? icons.moon : icons.sun} size={18} />
            </button>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="btn-ghost p-2 relative"
              >
                <Icon d={icons.bell} size={18} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-error)' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 rounded-lg border shadow-lg z-50"
                  style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Notifications</span>
                    <button onClick={() => { markAllRead(); }} className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 10).map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n.id)}
                        className="w-full text-left px-3 py-2.5 border-b flex gap-2"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: n.read ? 'transparent' : 'var(--color-hover)',
                        }}
                      >
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{n.title}</div>
                          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{n.message}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                            {new Date(n.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </button>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-4 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                        No notifications
                      </div>
                    )}
                  </div>
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifs(false)}
                    className="block text-center py-2.5 text-sm font-medium border-t"
                    style={{ color: 'var(--color-accent)', borderColor: 'var(--color-border)' }}
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l" style={{ borderColor: 'var(--color-border)' }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{user.name}</div>
              </div>
              <button onClick={handleLogout} className="btn-ghost p-1.5" title="Logout">
                <Icon d={icons.logout} size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--color-bg)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
