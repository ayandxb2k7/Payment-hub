import { useState, useMemo } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, exportToCSV } from '../db';
import { useDataRefresh } from '../contexts';
import { useToast } from '../contexts';
import type { Customer } from '../types';

const emptyForm: Omit<Customer, 'id' | 'createdAt'> = {
  name: '', email: '', phone: '', company: '', country: '', status: 'active', lifetimeValue: 0, riskScore: 0,
};

export default function Customers() {
  const { refreshKey, refresh } = useDataRefresh();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const customers = useMemo(() => getCustomers(), [refreshKey]);

  const filtered = useMemo(() => {
    let result = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter);
    return result;
  }, [customers, search, statusFilter]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditCustomer(null);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setForm({ name: c.name, email: c.email, phone: c.phone, company: c.company, country: c.country, status: c.status, lifetimeValue: c.lifetimeValue, riskScore: c.riskScore });
    setEditCustomer(c);
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editCustomer) {
        updateCustomer(editCustomer.id, form);
        addToast('success', 'Customer updated successfully');
      } else {
        createCustomer(form);
        addToast('success', 'Customer created successfully');
      }
      setShowModal(false);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (c: Customer) => {
    deleteCustomer(c.id);
    addToast('success', `Customer "${c.name}" deleted`);
    setDeleteConfirm(null);
    refresh();
  };

  const handleExport = () => {
    exportToCSV(
      filtered.map(c => ({ Name: c.name, Email: c.email, Phone: c.phone, Company: c.company, Country: c.country, Status: c.status, 'Lifetime Value': c.lifetimeValue, 'Risk Score': c.riskScore })),
      `customers-${new Date().toISOString().split('T')[0]}`
    );
    addToast('success', 'Customers exported successfully');
  };

  const statusBadge = (s: Customer['status']) => {
    const m: Record<string, string> = { active: 'badge-success', inactive: 'badge-warning', blocked: 'badge-error' };
    return `badge ${m[s] || 'badge-neutral'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Customers</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Manage your customer database</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">Export CSV</button>
          <button onClick={openCreate} className="btn-primary">+ Add Customer</button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="input-field max-w-xs" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
          <span className="text-sm self-center" style={{ color: 'var(--color-muted)' }}>{filtered.length} customers</span>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
              {['Name', 'Email', 'Company', 'Country', 'Status', 'Lifetime Value', 'Risk Score', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: 'var(--color-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="table-row border-b" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{c.name}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{c.email}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{c.company}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{c.country}</td>
                <td className="px-4 py-3"><span className={statusBadge(c.status)}>{c.status}</span></td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>${c.lifetimeValue.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${c.riskScore}%`, backgroundColor: c.riskScore > 70 ? 'var(--color-error)' : c.riskScore > 40 ? 'var(--color-warning)' : 'var(--color-success)' }} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{c.riskScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setViewCustomer(c)} className="btn-ghost text-xs px-2 py-1">View</button>
                    <button onClick={() => openEdit(c)} className="btn-ghost text-xs px-2 py-1">Edit</button>
                    <button onClick={() => setDeleteConfirm(c)} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--color-error)' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-muted)' }}>No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              {editCustomer ? 'Edit Customer' : 'New Customer'}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Full name" />
                  {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="email@company.com" />
                  {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Company</label>
                  <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="input-field" placeholder="Company name" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Country</label>
                  <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="input-field" placeholder="Country" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Customer['status'] })} className="input-field">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Risk Score</label>
                  <input type="number" min="0" max="100" value={form.riskScore} onChange={e => setForm({ ...form, riskScore: Number(e.target.value) })} className="input-field" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : editCustomer ? 'Update Customer' : 'Create Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {viewCustomer && (
        <div className="modal-overlay" onClick={() => setViewCustomer(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Customer Details</h3>
            <div className="space-y-2">
              {Object.entries({
                Name: viewCustomer.name, Email: viewCustomer.email, Phone: viewCustomer.phone,
                Company: viewCustomer.company, Country: viewCustomer.country, Status: viewCustomer.status,
                'Lifetime Value': `$${viewCustomer.lifetimeValue.toLocaleString()}`,
                'Risk Score': `${viewCustomer.riskScore}/100`,
                'Created': new Date(viewCustomer.createdAt).toLocaleDateString(),
              }).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{k}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setViewCustomer(null)} className="btn-secondary flex-1">Close</button>
              <button onClick={() => { setViewCustomer(null); openEdit(viewCustomer); }} className="btn-primary flex-1">Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Delete Customer</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--color-text)' }}>{deleteConfirm.name}</strong>? This action cannot be undone.
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
