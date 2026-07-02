import type { User, Company, Customer, Transaction, Invoice, InvoiceItem, Refund, Subscription, WebhookLog, Notification, ApiKey } from './types';

function uid(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const NAMES = ['Acme Corp', 'TechStart Inc', 'GlobalTrade Ltd', 'DataFlow Systems', 'CloudNine Solutions', 'Pinnacle Services', 'Nexus Digital', 'Aurora Enterprises', 'Vertex Innovations', 'Summit Partners', 'Omega Consulting', 'Atlas Holdings', 'Horizon Media', 'Quantum Labs', 'Apex Industries', 'Stellar Software', 'Catalyst Group', 'Beacon Analytics', 'Titan Manufacturing', 'Vanguard Solutions', 'Phoenix Dynamics', 'Eclipse Creative', 'Sapphire Retail', 'Cascade Networks', 'Zenith Technologies'];

const FIRST_NAMES = ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Amanda', 'William', 'Jennifer', 'Richard', 'Stephanie', 'Thomas', 'Lauren', 'Daniel', 'Megan', 'Christopher', 'Rachel', 'Andrew', 'Nicole', 'Kevin', 'Olivia', 'Brian', 'Samantha', 'Jason'];

const LAST_NAMES = ['Anderson', 'Chen', 'Martinez', 'Thompson', 'Williams', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Adams'];

const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Australia', 'Japan', 'Singapore', 'Netherlands', 'Sweden', 'Ireland', 'Switzerland', 'Brazil', 'India', 'South Korea'];

const GATEWAYS: Transaction['gateway'][] = ['PayPal', 'Stripe', 'Bank Transfer', 'Card'];
const CURRENCIES = ['USD', 'EUR', 'GBP'];
const STATUSES: Transaction['status'][] = ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'pending', 'failed', 'refunded'];
const PLANS = ['Starter', 'Growth', 'Pro', 'Enterprise', 'Basic', 'Premium'];

const EVENT_TYPES = ['payment_created', 'payment_completed', 'payment_failed', 'refund_created', 'subscription_updated'];

// Simple hash for passwords (simulates server-side hashing)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'paymenthub_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

// Storage keys
const KEYS = {
  users: 'ph_users',
  companies: 'ph_companies',
  customers: 'ph_customers',
  transactions: 'ph_transactions',
  invoices: 'ph_invoices',
  refunds: 'ph_refunds',
  subscriptions: 'ph_subscriptions',
  webhookLogs: 'ph_webhook_logs',
  notifications: 'ph_notifications',
  apiKeys: 'ph_api_keys',
  initialized: 'ph_initialized',
  session: 'ph_session',
  theme: 'ph_theme',
  settings: 'ph_settings',
};

function getStore<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Generate seed data
function generateSeedData() {
  const companyId = 'comp_seed_001';
  const company: Company = {
    id: companyId,
    name: 'PaymentHub Demo Corp',
    createdAt: daysAgo(365),
  };

  const users: User[] = [{
    id: 'user_seed_001',
    name: 'Demo Admin',
    email: 'admin@paymenthub.ai',
    passwordHash: '', // Will be set after hashing
    companyId,
    role: 'admin',
    createdAt: daysAgo(365),
  }];

  const customers: Customer[] = [];
  for (let i = 0; i < 25; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const companyName = NAMES[i % NAMES.length];
    customers.push({
      id: `cust_seed_${String(i + 1).padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`,
      phone: `+1 (${rand(200, 999)}) ${rand(200, 999)}-${rand(1000, 9999)}`,
      company: companyName,
      country: COUNTRIES[i % COUNTRIES.length],
      status: i < 18 ? 'active' : i < 22 ? 'inactive' : 'blocked',
      lifetimeValue: randFloat(500, 150000),
      riskScore: rand(0, 100),
      createdAt: daysAgo(rand(1, 365)),
    });
  }

  const transactions: Transaction[] = [];
  const refunds: Refund[] = [];
  for (let i = 0; i < 120; i++) {
    const cust = customers[rand(0, customers.length - 1)];
    const status = STATUSES[rand(0, STATUSES.length - 1)];
    const gateway = GATEWAYS[rand(0, GATEWAYS.length - 1)];
    const currency = CURRENCIES[rand(0, CURRENCIES.length - 1)];
    const amount = randFloat(5, 50000);
    const daysBack = rand(0, 365);
    const txId = `txn_seed_${String(i + 1).padStart(4, '0')}`;
    
    transactions.push({
      id: txId,
      customerId: cust.id,
      customerName: cust.name,
      amount,
      currency,
      status,
      gateway,
      date: daysAgo(daysBack),
      type: 'payment',
      description: `Payment for services - ${cust.company}`,
    });

    if (status === 'refunded') {
      refunds.push({
        id: `ref_seed_${String(refunds.length + 1).padStart(3, '0')}`,
        transactionId: txId,
        customerName: cust.name,
        amount: amount,
        reason: ['Customer request', 'Duplicate charge', 'Service not delivered', 'Product defect', 'Billing error'][rand(0, 4)],
        status: 'processed',
        date: daysAgo(Math.max(0, daysBack - rand(0, 5))),
      });
    }
  }

  // Sort transactions by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const invoices: Invoice[] = [];
  for (let i = 0; i < 40; i++) {
    const cust = customers[rand(0, customers.length - 1)];
    const items: InvoiceItem[] = [];
    const numItems = rand(1, 4);
    for (let j = 0; j < numItems; j++) {
      items.push({
        id: uid(),
        description: ['Consulting Services', 'Software License', 'Cloud Hosting', 'API Usage', 'Support Plan', 'Training', 'Custom Development', 'Data Analytics'][rand(0, 7)],
        quantity: rand(1, 10),
        unitPrice: randFloat(50, 5000),
      });
    }
    const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const discount = i % 5 === 0 ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    const statuses: Invoice['status'][] = ['draft', 'sent', 'paid', 'paid', 'paid', 'overdue', 'cancelled'];
    const status = statuses[rand(0, statuses.length - 1)];
    const daysBack = rand(0, 180);

    invoices.push({
      id: `inv_seed_${String(i + 1).padStart(3, '0')}`,
      invoiceNumber: `INV-2024-${String(i + 1).padStart(4, '0')}`,
      customerId: cust.id,
      customerName: cust.name,
      amount: Math.round(subtotal * 100) / 100,
      tax,
      discount,
      total: Math.round((subtotal + tax - discount) * 100) / 100,
      dueDate: daysAgo(Math.max(0, daysBack - 30)),
      status,
      items,
      createdAt: daysAgo(daysBack),
    });
  }

  const subscriptions: Subscription[] = [];
  for (let i = 0; i < 15; i++) {
    const cust = customers[rand(0, customers.length - 1)];
    const plan = PLANS[rand(0, PLANS.length - 1)];
    const subStatuses: Subscription['status'][] = ['active', 'active', 'active', 'active', 'paused', 'cancelled', 'expired'];
    subscriptions.push({
      id: `sub_seed_${String(i + 1).padStart(3, '0')}`,
      customerId: cust.id,
      customerName: cust.name,
      plan,
      amount: plan === 'Enterprise' ? randFloat(500, 2000) : plan === 'Pro' ? randFloat(100, 500) : plan === 'Growth' ? randFloat(50, 200) : plan === 'Premium' ? randFloat(200, 800) : randFloat(10, 100),
      status: subStatuses[rand(0, subStatuses.length - 1)],
      startDate: daysAgo(rand(30, 365)),
      nextBillingDate: daysAgo(-rand(1, 30)),
    });
  }

  const webhookLogs: WebhookLog[] = [];
  for (let i = 0; i < 30; i++) {
    const whStatuses: WebhookLog['status'][] = ['success', 'success', 'success', 'failed', 'retrying'];
    webhookLogs.push({
      id: `wh_seed_${String(i + 1).padStart(3, '0')}`,
      eventType: EVENT_TYPES[rand(0, EVENT_TYPES.length - 1)],
      status: whStatuses[rand(0, whStatuses.length - 1)],
      payload: JSON.stringify({ event_id: uid(), timestamp: new Date().toISOString(), amount: randFloat(10, 5000), currency: 'USD' }),
      createdAt: daysAgo(rand(0, 60)),
      retries: rand(0, 3),
    });
  }

  const notifications: Notification[] = [];
  const notifTypes: Notification['type'][] = ['payment_received', 'payment_failed', 'invoice_overdue', 'refund_requested', 'webhook_failed', 'ai_report'];
  const notifTitles: Record<Notification['type'], string> = {
    payment_received: 'Payment Received',
    payment_failed: 'Payment Failed',
    invoice_overdue: 'Invoice Overdue',
    refund_requested: 'Refund Requested',
    webhook_failed: 'Webhook Failed',
    ai_report: 'AI Report Ready',
  };
  const notifMessages: Record<Notification['type'], string[]> = {
    payment_received: ['$2,450.00 from Acme Corp', '$500.00 from TechStart Inc', '$12,000.00 from GlobalTrade Ltd', '$89.99 from DataFlow Systems'],
    payment_failed: ['Payment of $3,200.00 from Nexus Digital failed', 'Card declined for Aurora Enterprises - $1,500.00', 'Bank transfer failed for Pinnacle Services'],
    invoice_overdue: ['INV-2024-0005 is 15 days overdue', 'INV-2024-0012 is now 30 days overdue', 'INV-2024-0018 payment reminder sent'],
    refund_requested: ['Refund of $450.00 requested by Sarah Chen', 'Partial refund of $89.50 for order #8832'],
    webhook_failed: ['Webhook to api.example.com returned 500', 'Webhook delivery timeout after 30s'],
    ai_report: ['Weekly payment summary is ready', 'Monthly executive report generated', 'Risk analysis report available'],
  };

  for (let i = 0; i < 20; i++) {
    const type = notifTypes[rand(0, notifTypes.length - 1)];
    const messages = notifMessages[type];
    notifications.push({
      id: `notif_seed_${String(i + 1).padStart(3, '0')}`,
      type,
      title: notifTitles[type],
      message: messages[rand(0, messages.length - 1)],
      read: i > 12,
      createdAt: daysAgo(rand(0, 30)),
    });
  }

  const apiKeys: ApiKey[] = [
    { id: 'key_seed_001', name: 'Production Key', key: 'ph_live_' + uid() + uid(), createdAt: daysAgo(90) },
    { id: 'key_seed_002', name: 'Sandbox Key', key: 'ph_test_' + uid() + uid(), createdAt: daysAgo(60) },
  ];

  return { company, users, customers, transactions, invoices, refunds, subscriptions, webhookLogs, notifications, apiKeys };
}

// Initialize database
export async function initializeDatabase(): Promise<void> {
  const initialized = localStorage.getItem(KEYS.initialized);
  if (initialized) return;

  const seed = generateSeedData();
  
  // Hash the demo password
  seed.users[0].passwordHash = await hashPassword('Admin123!');
  
  setStore(KEYS.companies, [seed.company]);
  setStore(KEYS.users, seed.users);
  setStore(KEYS.customers, seed.customers);
  setStore(KEYS.transactions, seed.transactions);
  setStore(KEYS.invoices, seed.invoices);
  setStore(KEYS.refunds, seed.refunds);
  setStore(KEYS.subscriptions, seed.subscriptions);
  setStore(KEYS.webhookLogs, seed.webhookLogs);
  setStore(KEYS.notifications, seed.notifications);
  setStore(KEYS.apiKeys, seed.apiKeys);
  
  localStorage.setItem(KEYS.initialized, 'true');
}

// Reset database
export function resetDatabase(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}

// Auth functions
export function getSession(): User | null {
  try {
    const data = localStorage.getItem(KEYS.session);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function setSession(user: User): void {
  localStorage.setItem(KEYS.session, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(KEYS.session);
}

// User CRUD
export function getUsers(): User[] { return getStore<User>(KEYS.users); }

export function findUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(user: Omit<User, 'id' | 'createdAt' | 'role'>): User {
  const newUser: User = {
    ...user,
    id: 'user_' + uid(),
    role: 'admin',
    createdAt: new Date().toISOString(),
  };
  const users = getUsers();
  users.push(newUser);
  setStore(KEYS.users, users);
  return newUser;
}

// Company CRUD
export function getCompanies(): Company[] { return getStore<Company>(KEYS.companies); }

export function createCompany(name: string): Company {
  const company: Company = {
    id: 'comp_' + uid(),
    name,
    createdAt: new Date().toISOString(),
  };
  const companies = getCompanies();
  companies.push(company);
  setStore(KEYS.companies, companies);
  return company;
}

export function getCompanyById(id: string): Company | undefined {
  return getCompanies().find(c => c.id === id);
}

// Customer CRUD
export function getCustomers(): Customer[] { return getStore<Customer>(KEYS.customers); }

export function getCustomerById(id: string): Customer | undefined {
  return getCustomers().find(c => c.id === id);
}

export function createCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Customer {
  const customer: Customer = { ...data, id: 'cust_' + uid(), createdAt: new Date().toISOString() };
  const items = getCustomers();
  items.push(customer);
  setStore(KEYS.customers, items);
  return customer;
}

export function updateCustomer(id: string, data: Partial<Customer>): Customer | undefined {
  const items = getCustomers();
  const idx = items.findIndex(c => c.id === id);
  if (idx === -1) return undefined;
  items[idx] = { ...items[idx], ...data };
  setStore(KEYS.customers, items);
  return items[idx];
}

export function deleteCustomer(id: string): boolean {
  const items = getCustomers();
  const filtered = items.filter(c => c.id !== id);
  if (filtered.length === items.length) return false;
  setStore(KEYS.customers, filtered);
  return true;
}

// Transaction CRUD
export function getTransactions(): Transaction[] { return getStore<Transaction>(KEYS.transactions); }

export function getTransactionById(id: string): Transaction | undefined {
  return getTransactions().find(t => t.id === id);
}

export function createTransaction(data: Omit<Transaction, 'id'>): Transaction {
  const tx: Transaction = { ...data, id: 'txn_' + uid() };
  const items = getTransactions();
  items.unshift(tx);
  setStore(KEYS.transactions, items);
  return tx;
}

export function updateTransaction(id: string, data: Partial<Transaction>): Transaction | undefined {
  const items = getTransactions();
  const idx = items.findIndex(t => t.id === id);
  if (idx === -1) return undefined;
  items[idx] = { ...items[idx], ...data };
  setStore(KEYS.transactions, items);
  return items[idx];
}

// Invoice CRUD
export function getInvoices(): Invoice[] { return getStore<Invoice>(KEYS.invoices); }

export function getInvoiceById(id: string): Invoice | undefined {
  return getInvoices().find(i => i.id === id);
}

export function createInvoice(data: Omit<Invoice, 'id'>): Invoice {
  const inv: Invoice = { ...data, id: 'inv_' + uid() };
  const items = getInvoices();
  items.unshift(inv);
  setStore(KEYS.invoices, items);
  return inv;
}

export function updateInvoice(id: string, data: Partial<Invoice>): Invoice | undefined {
  const items = getInvoices();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return undefined;
  items[idx] = { ...items[idx], ...data };
  setStore(KEYS.invoices, items);
  return items[idx];
}

export function deleteInvoice(id: string): boolean {
  const items = getInvoices();
  const filtered = items.filter(i => i.id !== id);
  if (filtered.length === items.length) return false;
  setStore(KEYS.invoices, filtered);
  return true;
}

// Refund CRUD
export function getRefunds(): Refund[] { return getStore<Refund>(KEYS.refunds); }

export function createRefund(data: Omit<Refund, 'id'>): Refund {
  const ref: Refund = { ...data, id: 'ref_' + uid() };
  const items = getRefunds();
  items.unshift(ref);
  setStore(KEYS.refunds, items);
  return ref;
}

export function updateRefund(id: string, data: Partial<Refund>): Refund | undefined {
  const items = getRefunds();
  const idx = items.findIndex(r => r.id === id);
  if (idx === -1) return undefined;
  items[idx] = { ...items[idx], ...data };
  setStore(KEYS.refunds, items);
  return items[idx];
}

// Subscription CRUD
export function getSubscriptions(): Subscription[] { return getStore<Subscription>(KEYS.subscriptions); }

export function updateSubscription(id: string, data: Partial<Subscription>): Subscription | undefined {
  const items = getSubscriptions();
  const idx = items.findIndex(s => s.id === id);
  if (idx === -1) return undefined;
  items[idx] = { ...items[idx], ...data };
  setStore(KEYS.subscriptions, items);
  return items[idx];
}

// WebhookLog CRUD
export function getWebhookLogs(): WebhookLog[] { return getStore<WebhookLog>(KEYS.webhookLogs); }

export function createWebhookLog(data: Omit<WebhookLog, 'id'>): WebhookLog {
  const log: WebhookLog = { ...data, id: 'wh_' + uid() };
  const items = getWebhookLogs();
  items.unshift(log);
  setStore(KEYS.webhookLogs, items);
  return log;
}

export function updateWebhookLog(id: string, data: Partial<WebhookLog>): WebhookLog | undefined {
  const items = getWebhookLogs();
  const idx = items.findIndex(w => w.id === id);
  if (idx === -1) return undefined;
  items[idx] = { ...items[idx], ...data };
  setStore(KEYS.webhookLogs, items);
  return items[idx];
}

// Notification CRUD
export function getNotifications(): Notification[] { return getStore<Notification>(KEYS.notifications); }

export function createNotification(data: Omit<Notification, 'id'>): Notification {
  const notif: Notification = { ...data, id: 'notif_' + uid() };
  const items = getNotifications();
  items.unshift(notif);
  setStore(KEYS.notifications, items);
  return notif;
}

export function markNotificationRead(id: string): void {
  const items = getNotifications();
  const idx = items.findIndex(n => n.id === id);
  if (idx !== -1) {
    items[idx].read = true;
    setStore(KEYS.notifications, items);
  }
}

export function markAllNotificationsRead(): void {
  const items = getNotifications();
  items.forEach(n => n.read = true);
  setStore(KEYS.notifications, items);
}

// API Keys CRUD
export function getApiKeys(): ApiKey[] { return getStore<ApiKey>(KEYS.apiKeys); }

export function createApiKey(name: string): ApiKey {
  const key: ApiKey = { id: 'key_' + uid(), name, key: 'ph_live_' + uid() + uid(), createdAt: new Date().toISOString() };
  const items = getApiKeys();
  items.push(key);
  setStore(KEYS.apiKeys, items);
  return key;
}

export function deleteApiKey(id: string): boolean {
  const items = getApiKeys();
  const filtered = items.filter(k => k.id !== id);
  if (filtered.length === items.length) return false;
  setStore(KEYS.apiKeys, filtered);
  return true;
}

// Settings
export interface AppSettings {
  paypalClientId: string;
  paypalSecret: string;
  paypalEnvironment: 'sandbox' | 'live';
  geminiApiKey: string;
  webhookUrl: string;
}

export function getSettings(): AppSettings {
  try {
    const data = localStorage.getItem(KEYS.settings);
    return data ? JSON.parse(data) : {
      paypalClientId: '',
      paypalSecret: '',
      paypalEnvironment: 'sandbox' as const,
      geminiApiKey: '',
      webhookUrl: '',
    };
  } catch {
    return { paypalClientId: '', paypalSecret: '', paypalEnvironment: 'sandbox', geminiApiKey: '', webhookUrl: '' };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

// CSV Export
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n') 
        ? `"${str.replace(/"/g, '""')}"` 
        : str;
    }).join(','))
  ];
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Dashboard calculations
export function getDashboardStats() {
  const transactions = getTransactions();
  const customers = getCustomers();
  const subscriptions = getSubscriptions();
  const refunds = getRefunds();

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const completedTxns = transactions.filter(t => t.status === 'completed');
  const thisMonthTxns = completedTxns.filter(t => new Date(t.date) >= thisMonth);
  const lastMonthTxns = completedTxns.filter(t => {
    const d = new Date(t.date);
    return d >= lastMonth && d < thisMonth;
  });

  const totalRevenue = completedTxns.reduce((s, t) => s + t.amount, 0);
  const monthlyRevenue = thisMonthTxns.reduce((s, t) => s + t.amount, 0);
  const lastMonthRevenue = lastMonthTxns.reduce((s, t) => s + t.amount, 0);
  const successfulPayments = completedTxns.length;
  const failedPayments = transactions.filter(t => t.status === 'failed').length;
  const refundRate = transactions.length > 0 ? (refunds.length / transactions.length) * 100 : 0;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const mrr = subscriptions.filter(s => s.status === 'active').reduce((s, sub) => s + sub.amount, 0);
  const arr = mrr * 12;

  // Revenue by month (last 12 months)
  const revenueByMonth: { month: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const revenue = completedTxns
      .filter(t => {
        const d = new Date(t.date);
        return d >= monthStart && d < monthEnd;
      })
      .reduce((s, t) => s + t.amount, 0);
    revenueByMonth.push({ month: monthName, revenue: Math.round(revenue * 100) / 100 });
  }

  // Payment method breakdown
  const gatewayBreakdown = GATEWAYS.map(g => ({
    name: g,
    value: transactions.filter(t => t.gateway === g).length,
    revenue: Math.round(transactions.filter(t => t.gateway === g && t.status === 'completed').reduce((s, t) => s + t.amount, 0) * 100) / 100,
  })).filter(g => g.value > 0);

  // Recent transactions
  const recentTransactions = transactions.slice(0, 10);

  // Status breakdown
  const statusBreakdown = {
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    refunded: transactions.filter(t => t.status === 'refunded').length,
  };

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
    revenueChange: lastMonthRevenue > 0 ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 10000) / 100 : 0,
    successfulPayments,
    failedPayments,
    refundRate: Math.round(refundRate * 100) / 100,
    activeCustomers,
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(arr * 100) / 100,
    revenueByMonth,
    gatewayBreakdown,
    recentTransactions,
    statusBreakdown,
  };
}

// Search across all entities
export function globalSearch(query: string): import('./types').SearchableItem[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: import('./types').SearchableItem[] = [];

  getTransactions().forEach(t => {
    if (t.id.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || String(t.amount).includes(q)) {
      results.push({ type: 'transaction', id: t.id, label: `${t.customerName} - $${t.amount.toLocaleString()}`, sublabel: t.id, path: '/transactions' });
    }
  });

  getCustomers().forEach(c => {
    if (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)) {
      results.push({ type: 'customer', id: c.id, label: c.name, sublabel: c.email, path: '/customers' });
    }
  });

  getInvoices().forEach(i => {
    if (i.invoiceNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)) {
      results.push({ type: 'invoice', id: i.id, label: `${i.invoiceNumber} - ${i.customerName}`, sublabel: `$${i.total.toLocaleString()}`, path: '/invoices' });
    }
  });

  getSubscriptions().forEach(s => {
    if (s.customerName.toLowerCase().includes(q) || s.plan.toLowerCase().includes(q)) {
      results.push({ type: 'subscription', id: s.id, label: `${s.customerName} - ${s.plan}`, sublabel: `$${s.amount}/mo`, path: '/subscriptions' });
    }
  });

  getRefunds().forEach(r => {
    if (r.customerName.toLowerCase().includes(q) || r.transactionId.toLowerCase().includes(q)) {
      results.push({ type: 'refund', id: r.id, label: `Refund - ${r.customerName}`, sublabel: `$${r.amount}`, path: '/refunds' });
    }
  });

  getWebhookLogs().forEach(w => {
    if (w.eventType.toLowerCase().includes(q)) {
      results.push({ type: 'webhook', id: w.id, label: w.eventType, sublabel: w.status, path: '/webhooks' });
    }
  });

  return results.slice(0, 20);
}

// AI Insights (deterministic fallback)
export function generateAIInsights(): string {
  const stats = getDashboardStats();
  const transactions = getTransactions();
  const customers = getCustomers();
  const refunds = getRefunds();

  const highRiskCustomers = customers.filter(c => c.riskScore > 70);
  const failedRecent = transactions.filter(t => t.status === 'failed' && new Date(t.date) > new Date(Date.now() - 30 * 86400000));
  const overdueInvoices = getInvoices().filter(i => i.status === 'overdue');

  const avgTransactionValue = stats.successfulPayments > 0 ? stats.totalRevenue / stats.successfulPayments : 0;

  let report = `PAYMENTHUB AI — EXECUTIVE PAYMENT REPORT\n`;
  report += `${'='.repeat(50)}\n\n`;
  
  report += `REVENUE SUMMARY\n`;
  report += `${'─'.repeat(30)}\n`;
  report += `Total Revenue: $${stats.totalRevenue.toLocaleString()}\n`;
  report += `Monthly Revenue: $${stats.monthlyRevenue.toLocaleString()}\n`;
  report += `Month-over-Month Change: ${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%\n`;
  report += `MRR: $${stats.mrr.toLocaleString()} | ARR: $${stats.arr.toLocaleString()}\n`;
  report += `Average Transaction Value: $${Math.round(avgTransactionValue * 100) / 100}\n\n`;

  report += `PAYMENT HEALTH\n`;
  report += `${'─'.repeat(30)}\n`;
  report += `Successful Payments: ${stats.successfulPayments}\n`;
  report += `Failed Payments: ${stats.failedPayments}\n`;
  report += `Failure Rate: ${transactions.length > 0 ? Math.round((stats.failedPayments / transactions.length) * 10000) / 100 : 0}%\n`;
  report += `Refund Rate: ${stats.refundRate}%\n`;
  report += `Active Refunds: ${refunds.length}\n\n`;

  report += `FAILED PAYMENT ANALYSIS\n`;
  report += `${'─'.repeat(30)}\n`;
  if (failedRecent.length > 0) {
    report += `${failedRecent.length} failed payments in the last 30 days.\n`;
    report += `Common failure gateways:\n`;
    const failedByGateway: Record<string, number> = {};
    failedRecent.forEach(t => { failedByGateway[t.gateway] = (failedByGateway[t.gateway] || 0) + 1; });
    Object.entries(failedByGateway).sort((a, b) => b[1] - a[1]).forEach(([gw, count]) => {
      report += `  • ${gw}: ${count} failures\n`;
    });
    report += `Recommendation: Review ${Object.entries(failedByGateway).sort((a, b) => b[1] - a[1])[0]?.[0] || 'gateway'} configuration and consider adding fallback payment methods.\n`;
  } else {
    report += `No failed payments in the last 30 days. Payment processing is healthy.\n`;
  }
  report += `\n`;

  report += `RISK ASSESSMENT\n`;
  report += `${'─'.repeat(30)}\n`;
  if (highRiskCustomers.length > 0) {
    report += `${highRiskCustomers.length} high-risk customers detected (risk score > 70):\n`;
    highRiskCustomers.slice(0, 5).forEach(c => {
      report += `  • ${c.name} (${c.company}) — Risk Score: ${c.riskScore}/100 — LTV: $${c.lifetimeValue.toLocaleString()}\n`;
    });
    report += `Recommendation: Implement additional verification for high-risk transactions and monitor these accounts closely.\n`;
  } else {
    report += `No high-risk customers detected. Customer portfolio is healthy.\n`;
  }
  report += `\n`;

  report += `INVOICE STATUS\n`;
  report += `${'─'.repeat(30)}\n`;
  report += `Overdue Invoices: ${overdueInvoices.length}\n`;
  if (overdueInvoices.length > 0) {
    const overdueTotal = overdueInvoices.reduce((s, i) => s + i.total, 0);
    report += `Total Overdue Amount: $${Math.round(overdueTotal * 100) / 100}\n`;
    report += `Recommendation: Send automated reminders and consider payment plan options for delinquent accounts.\n`;
  }
  report += `\n`;

  report += `SUGGESTED ACTIONS\n`;
  report += `${'─'.repeat(30)}\n`;
  const actions: string[] = [];
  if (stats.refundRate > 5) actions.push('1. Investigate rising refund rate — consider product quality review');
  if (failedRecent.length > 5) actions.push('2. Review payment gateway configurations to reduce failures');
  if (highRiskCustomers.length > 3) actions.push('3. Implement enhanced fraud detection for high-risk accounts');
  if (overdueInvoices.length > 3) actions.push('4. Automate invoice reminders and follow-ups');
  if (stats.revenueChange < -10) actions.push('5. Revenue declining — analyze customer churn and retention strategies');
  if (stats.mrr < stats.arr / 14) actions.push('6. Focus on converting one-time payments to subscriptions for stable revenue');
  if (actions.length === 0) actions.push('No critical actions needed — business metrics are healthy');
  actions.forEach(a => report += `${a}\n`);

  return report;
}
