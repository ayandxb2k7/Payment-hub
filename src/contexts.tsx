import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, Notification as Notif, ToastMessage, ThemeMode } from './types';
import * as db from './db';

// ===================== AUTH CONTEXT =====================
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, companyName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = db.getSession();
    if (session) setUser(session);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const found = db.findUserByEmail(email);
    if (!found) return { success: false, error: 'No account found with this email address.' };
    const valid = await db.verifyPassword(password, found.passwordHash);
    if (!valid) return { success: false, error: 'Invalid password. Please try again.' };
    db.setSession(found);
    setUser(found);
    return { success: true };
  }, []);

  const register = useCallback(async (name: string, companyName: string, email: string, password: string) => {
    const existing = db.findUserByEmail(email);
    if (existing) return { success: false, error: 'An account with this email already exists.' };
    const company = db.createCompany(companyName);
    const hash = await db.hashPassword(password);
    const newUser = db.createUser({ name, email, passwordHash: hash, companyId: company.id });
    db.setSession(newUser);
    setUser(newUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    db.clearSession();
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    db.setSession(updated);
    setUser(updated);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ===================== THEME CONTEXT =====================
interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('ph_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('ph_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

// ===================== NOTIFICATION CONTEXT =====================
interface NotificationContextType {
  notifications: Notif[];
  unreadCount: number;
  refresh: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    const notifs = db.getNotifications();
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read).length);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const markRead = useCallback((id: string) => {
    db.markNotificationRead(id);
    refresh();
  }, [refresh]);

  const markAllRead = useCallback(() => {
    db.markAllNotificationsRead();
    refresh();
  }, [refresh]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

// ===================== TOAST CONTEXT =====================
interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Math.random().toString(36).substring(2);
    setToasts(prev => [...prev, { id, type, message }]);
    const timer = window.setTimeout(() => removeToast(id), 4000);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ===================== DATA REFRESH CONTEXT =====================
interface DataRefreshContextType {
  refreshKey: number;
  refresh: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextType | null>(null);

export function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);
  return (
    <DataRefreshContext.Provider value={{ refreshKey, refresh }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  const ctx = useContext(DataRefreshContext);
  if (!ctx) throw new Error('useDataRefresh must be used within DataRefreshProvider');
  return ctx;
}
