import { useState, useMemo } from 'react';
import { getRefunds, exportToCSV } from '../db';
import { useDataRefresh } from '../contexts';
import { useToast } from '../contexts';

export default function Refunds() {
  const { refreshKey } = useDataRefresh();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const refunds = useMemo(() => getRefunds(), [refreshKey]);

  const filtered = useMemo(() => {
    let result = refunds;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => r.customerName.toLowerCase().includes(q) || r.transactionId.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
    return result;
  }, [refunds, search, statusFilter]);

  const totalRefunded = filtered.filter(r => r.status === 'processed').reduce((s, r) => s + r.amount, 0);

  const handleExport = () => {
    exportToCSV(
      filtered.map(r => ({ 'Refund ID': r.id, 'Transaction ID': r.transactionId, Customer: r.customerName, Amount: r.amount, Reason: r.reason, Status: r.status, Date: new Date(r.date).toLocaleDateString() })),
      `refunds-${new Date().toISOString().split('T')[0]}`
    );
    addToast('success', 'Refunds exported');
  };

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { processed: 'badge-success', pending: 'badge-warning', failed: 'badge-error' };
    return `badge ${m[s] || 'badge-neutral'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Refunds</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Track and manage refund requests</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">Export CSV</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>Total Refunds</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{filtered.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>Total Refunded</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-error)' }}>${totalRefunded.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>Pending</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-warning)' }}>{filtered.filter(r => r.status === 'pending').length}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Search refunds..." value={search} onChange={e => setSearch(e.target.value)} className="input-field max-w-xs" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All Statuses</option>
            <option value="processed">Processed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
              {['Refund ID', 'Transaction', 'Customer', 'Amount', 'Reason', 'Status', 'Date'].map(h => (
                <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: 'var(--color-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="table-row border-b" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--color-text)' }}>{r.id}</td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--color-muted)' }}>{r.transactionId}</td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{r.customerName}</td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-error)' }}>-${r.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{r.reason}</td>
                <td className="px-4 py-3"><span className={statusBadge(r.status)}>{r.status}</span></td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{new Date(r.date).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-muted)' }}>No refunds found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
