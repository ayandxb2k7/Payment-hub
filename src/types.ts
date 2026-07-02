export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  companyId: string;
  role: 'admin' | 'member';
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  status: 'active' | 'inactive' | 'blocked';
  lifetimeValue: number;
  riskScore: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  gateway: 'PayPal' | 'Stripe' | 'Bank Transfer' | 'Card';
  date: string;
  paypalTransactionId?: string;
  type: 'payment' | 'refund';
  description?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  tax: number;
  discount: number;
  total: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Refund {
  id: string;
  transactionId: string;
  customerName: string;
  amount: number;
  reason: string;
  status: 'processed' | 'pending' | 'failed';
  date: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  plan: string;
  amount: number;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: string;
  nextBillingDate: string;
}

export interface WebhookLog {
  id: string;
  eventType: string;
  status: 'success' | 'failed' | 'retrying';
  payload: string;
  createdAt: string;
  retries: number;
}

export interface Notification {
  id: string;
  type: 'payment_received' | 'payment_failed' | 'invoice_overdue' | 'refund_requested' | 'webhook_failed' | 'ai_report';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AIReport {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

export interface SearchableItem {
  type: 'transaction' | 'customer' | 'invoice' | 'subscription' | 'refund' | 'webhook';
  id: string;
  label: string;
  sublabel: string;
  path: string;
}

export type ThemeMode = 'light' | 'dark';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
