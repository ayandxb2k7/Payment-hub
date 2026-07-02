import { useState, useMemo } from 'react';
import { getInvoices, getCustomers, createInvoice, updateInvoice, deleteInvoice, exportToCSV } from '../db';
import { useDataRefresh } from '../contexts';
import { useToast } from '../contexts';
import type { Invoice, InvoiceItem } from '../types';

const emptyItem = (): InvoiceItem => ({ id: Math.random().toString(36).substring(2), description: '', quantity: 1, unitPrice: 0 });

export default function Invoices() {
  const { refreshKey, refresh } = useDataRefresh();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [payModal, setPayModal] = useState<Invoice | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const invoices = useMemo(() => getInvoices(), [refreshKey]);
  const customers = useMemo(() => getCustomers(), [refreshKey]);

  const filtered = useMemo(() => {
    let result = invoices;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => i.invoiceNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(i => i.status === statusFilter);
    return result;
  }, [invoices, search, statusFilter]);

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const total = subtotal + tax - discount;

  const openCreate = () => {
    setCustomerId('');
    setDueDate('');
    setItems([emptyItem()]);
    setTax(0);
    setDiscount(0);
    setEditInvoice(null);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (inv: Invoice) => {
    setCustomerId(inv.customerId);
    setDueDate(inv.dueDate.split('T')[0]);
    setItems([...inv.items]);
    setTax(inv.tax);
    setDiscount(inv.discount);
    setEditInvoice(inv);
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customer = 'Select a customer';
    if (!dueDate) errs.dueDate = 'Due date is required';
    if (items.every(it => !it.description.trim())) errs.items = 'Add at least one item';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const cust = customers.find(c => c.id === customerId);
      const invoiceNum = editInvoice?.invoiceNumber || `INV-2024-${String(invoices.length + 1).padStart(4, '0')}`;
      const data = {
        invoiceNumber: invoiceNum,
        customerId,
        customerName: cust?.name || 'Unknown',
        amount: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        total: Math.round(total * 100) / 100,
        dueDate: new Date(dueDate).toISOString(),
        status: editInvoice?.status || 'draft' as Invoice['status'],
        items: items.filter(it => it.description.trim()),
      };
      if (editInvoice) {
        updateInvoice(editInvoice.id, data);
        addToast('success', 'Invoice updated');
      } else {
        createInvoice({ ...data, createdAt: new Date().toISOString() });
        addToast('success', 'Invoice created');
      }
      setShowModal(false);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (id: string, status: Invoice['status']) => {
    updateInvoice(id, { status });
    addToast('success', `Invoice marked as ${status}`);
    refresh();
  };

  const handleDelete = (inv: Invoice) => {
    deleteInvoice(inv.id);
    addToast('success', 'Invoice deleted');
    setDeleteConfirm(null);
    refresh();
  };

  const handleExport = () => {
    exportToCSV(
      filtered.map(i => ({ 'Invoice #': i.invoiceNumber, Customer: i.customerName, Amount: i.amount, Tax: i.tax, Discount: i.discount, Total: i.total, Status: i.status, 'Due Date': new Date(i.dueDate).toLocaleDateString() })),
      `invoices-${new Date().toISOString().split('T')[0]}`
    );
    addToast('success', 'Invoices exported');
  };

  const handlePayPayPal = (inv: Invoice) => {
    // Simulate PayPal payment
    updateInvoice(inv.id, { status: 'paid' });
    addToast('success', `Payment of $${inv.total.toLocaleString()} processed via PayPal`);
    setPayModal(null);
    refresh();
  };

  const downloadInvoice = (inv: Invoice) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Invoice ${inv.invoiceNumber}</title>
      <style>body{font-family:Inter,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#151515}
      table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb}
      th{font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280}
      .header{display:flex;justify-content:space-between;margin-bottom:40px}
      .total-row{font-weight:700;font-size:1.125rem}</style></head><body>
      <div class="header"><div><h1 style="margin:0">PaymentHub AI</h1><p style="color:#6b7280">Enterprise Payment Infrastructure</p></div>
      <div style="text-align:right"><h2 style="margin:0">INVOICE</h2><p style="color:#6b7280">${inv.invoiceNumber}</p></div></div>
      <p><strong>Bill To:</strong> ${inv.customerName}</p>
      <p><strong>Due Date:</strong> ${new Date(inv.dueDate).toLocaleDateString()}</p>
      <p><strong>Status:</strong> ${inv.status.toUpperCase()}</p>
      <table style="margin-top:20px"><thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
      <tbody>${inv.items.map(it => `<tr><td>${it.description}</td><td>${it.quantity}</td><td>$${it.unitPrice.toFixed(2)}</td><td>$${(it.quantity * it.unitPrice).toFixed(2)}</td></tr>`).join('')}
      </tbody></table>
      <div style="margin-top:20px;text-align:right">
      <p>Subtotal: $${inv.amount.toFixed(2)}</p>
      <p>Tax: $${inv.tax.toFixed(2)}</p>
      ${inv.discount > 0 ? `<p>Discount: -$${inv.discount.toFixed(2)}</p>` : ''}
      <p class="total-row">Total: $${inv.total.toFixed(2)}</p></div>
      <hr style="margin-top:40px;border-color:#e5e7eb"/>
      <p style="color:#6b7280;font-size:0.75rem;text-align:center">Thank you for your business. — PaymentHub AI</p>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const statusBadge = (s: Invoice['status']) => {
    const m: Record<string, string> = { draft: 'badge-neutral', sent: 'badge-info', paid: 'badge-success', overdue: 'badge-error', cancelled: 'badge-neutral' };
    return `badge ${m[s] || 'badge-neutral'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Invoices</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Create and manage invoices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">Export CSV</button>
          <button onClick={openCreate} className="btn-primary">+ New Invoice</button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="input-field max-w-xs" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-sm self-center" style={{ color: 'var(--color-muted)' }}>{filtered.length} invoices</span>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
              {['Invoice #', 'Customer', 'Amount', 'Tax', 'Discount', 'Total', 'Due Date', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: 'var(--color-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map(inv => (
              <tr key={inv.id} className="table-row border-b" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: 'var(--color-text)' }}>{inv.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>{inv.customerName}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>${inv.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>${inv.tax}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{inv.discount > 0 ? `-$${inv.discount}` : '—'}</td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>${inv.total.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className={statusBadge(inv.status)}>{inv.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    <button onClick={() => setViewInvoice(inv)} className="btn-ghost text-xs px-2 py-1">View</button>
                    <button onClick={() => downloadInvoice(inv)} className="btn-ghost text-xs px-2 py-1">PDF</button>
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <button onClick={() => setPayModal(inv)} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--color-accent)' }}>Pay</button>
                    )}
                    {inv.status === 'draft' && <button onClick={() => handleStatusChange(inv.id, 'sent')} className="btn-ghost text-xs px-2 py-1">Send</button>}
                    {inv.status === 'sent' && <button onClick={() => handleStatusChange(inv.id, 'overdue')} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--color-warning)' }}>Overdue</button>}
                    <button onClick={() => openEdit(inv)} className="btn-ghost text-xs px-2 py-1">Edit</button>
                    <button onClick={() => setDeleteConfirm(inv)} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--color-error)' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-muted)' }}>No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '40rem' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              {editInvoice ? 'Edit Invoice' : 'New Invoice'}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Customer *</label>
                  <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="input-field">
                    <option value="">Select customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.customer && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.customer}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Due Date *</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-field" />
                  {errors.dueDate && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.dueDate}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Items</label>
                {items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 mb-2">
                    <input value={item.description} onChange={e => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} className="input-field col-span-5" placeholder="Description" />
                    <input type="number" min="1" value={item.quantity} onChange={e => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} className="input-field col-span-2" />
                    <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => { const n = [...items]; n[idx].unitPrice = Number(e.target.value); setItems(n); }} className="input-field col-span-3" placeholder="Price" />
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="btn-ghost col-span-2 text-xs" style={{ color: 'var(--color-error)' }}>Remove</button>
                  </div>
                ))}
                <button onClick={() => setItems([...items, emptyItem()])} className="btn-ghost text-xs">+ Add Item</button>
                {errors.items && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.items}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tax ($)</label>
                  <input type="number" min="0" step="0.01" value={tax} onChange={e => setTax(Number(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Discount ($)</label>
                  <input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="input-field" />
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-hover)' }}>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--color-muted)' }}>Subtotal</span><span style={{ color: 'var(--color-text)' }}>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--color-muted)' }}>Tax</span><span style={{ color: 'var(--color-text)' }}>${tax.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm"><span style={{ color: 'var(--color-muted)' }}>Discount</span><span style={{ color: 'var(--color-text)' }}>-${discount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : editInvoice ? 'Update Invoice' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View invoice */}
      {viewInvoice && (
        <div className="modal-overlay" onClick={() => setViewInvoice(null)}>
          <div className="modal-content" style={{ maxWidth: '40rem' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{viewInvoice.invoiceNumber}</h3>
              <span className={statusBadge(viewInvoice.status)}>{viewInvoice.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries({ Customer: viewInvoice.customerName, 'Due Date': new Date(viewInvoice.dueDate).toLocaleDateString(), Subtotal: `$${viewInvoice.amount}`, Tax: `$${viewInvoice.tax}`, Discount: viewInvoice.discount > 0 ? `$${viewInvoice.discount}` : '—', Total: `$${viewInvoice.total}` }).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5"><span className="text-sm" style={{ color: 'var(--color-muted)' }}>{k}</span><span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{v}</span></div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Items</h4>
              {viewInvoice.items.map(it => (
                <div key={it.id} className="flex justify-between py-1 text-sm border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text)' }}>{it.description} × {it.quantity}</span>
                  <span style={{ color: 'var(--color-text)' }}>${(it.quantity * it.unitPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewInvoice(null)} className="btn-secondary flex-1">Close</button>
              <button onClick={() => { setViewInvoice(null); downloadInvoice(viewInvoice); }} className="btn-primary flex-1">Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* PayPal payment modal */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Pay with PayPal</h3>
            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'var(--color-hover)' }}>
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>Invoice: {payModal.invoiceNumber}</div>
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>Customer: {payModal.customerName}</div>
              <div className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>${payModal.total.toLocaleString()}</div>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
              This will simulate a PayPal Sandbox payment. In production, this would redirect to PayPal for authorization.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPayModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handlePayPayPal(payModal)} className="btn-primary flex-1">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Delete Invoice</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
              Delete invoice <strong style={{ color: 'var(--color-text)' }}>{deleteConfirm.invoiceNumber}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
