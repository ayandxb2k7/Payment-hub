import { useState, useMemo } from 'react';
import { getSubscriptions, updateSubscription } from '../db';
import { useDataRefresh } from '../contexts';
import { useToast } from '../contexts';
import type { Subscription } from '../types';

export default function Subscriptions() {
  const { refreshKey, refresh } = useDataRefresh();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const subscriptions = useMemo(() => getSubscriptions(), [refreshKey]);

  const filtered = useMemo(() => {
    let result = subscriptions;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.customerName.toLowerCase().includes(q) || s.plan.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(s => s.status === statusFilter);
    return result;
  }, [subscriptions, search, statusFilter]);

  const handleStatusChange = (id: string, status: Subscription['status']) => {
    updateSubscription(id, { status });
    addToast('success', `Subscription ${status}`);
    refresh();
  };

  const statusBadge = (s: Subscription['status']) => {
    const m: Record<string, string> = { active: 'badge-success', paused: 'badge-warning', cancelled: 'badge-error', expired: 'badge-neutral' };
    return `badge ${m[s] || 'badge-neutral'}`;
  };

  const totalMRR = filtered.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Subscriptions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Manage recurring billing subscriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>Active Subscriptions</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{filtered.filter(s => s.status === 'active').length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>Monthly Recurring</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>${totalMRR.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>Total Subscriptions</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{filtered.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Search subscriptions..." value={search} onChange={e => setSearch(e.target.value)} className="input-field max-w-xs" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
              {['Customer', 'Plan', 'Amount', 'Status', 'Start Date', 'Next Billing', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: 'var(--color-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(sub => (
              <tr key={sub.id} className="table-row border-b" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{sub.customerName}</td>
                <td className="px-4 py-3"><span className="badge badge-info">{sub.plan}</span></td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>${sub.amount}/mo</td>
                <td className="px-4 py-3"><span className={statusBadge(sub.status)}>{sub.status}</span></td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{new Date(sub.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{new Date(sub.nextBillingDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {sub.status === 'active' && (
                      <>
                        <button onClick={() => handleStatusChange(sub.id, 'paused')} className="btn-ghost text-xs px-2 py-1">Pause</button>
                        <button onClick={() => handleStatusChange(sub.id, 'cancelled')} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--color-error)' }}>Cancel</button>
                      </>
                    )}
                    {sub.status === 'paused' && (
                      <button onClick={() => handleStatusChange(sub.id, 'active')} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--color-success)' }}>Resume</button>
                    )}
                    {sub.status === 'expired' && (
                      <button onClick={() => handleStatusChange(sub.id, 'active')} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--color-success)' }}>Reactivate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-muted)' }}>No subscriptions found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
