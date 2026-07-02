import { useState, useMemo } from 'react';
import { getTransactions, updateTransaction, createRefund, exportToCSV } from '../db';
import { useDataRefresh } from '../contexts';
import { useToast } from '../contexts';
import type { Transaction } from '../types';

export default function Transactions() {
  const { refreshKey, refresh } = useDataRefresh();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [refundModal, setRefundModal] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const transactions = useMemo(() => getTransactions(), [refreshKey]);

  const filtered = useMemo(() => {
    let result = transactions;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        String(t.amount).includes(q) ||
        t.gateway.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateFilter === '7d') cutoff.setDate(now.getDate() - 7);
      else if (dateFilter === '30d') cutoff.setDate(now.getDate() - 30);
      else if (dateFilter === '90d') cutoff.setDate(now.getDate() - 90);
      else if (dateFilter === '1y') cutoff.setFullYear(now.getFullYear() - 1);
      result = result.filter(t => new Date(t.date) >= cutoff);
    }
    return result;
  }, [transactions, search, statusFilter, dateFilter]);

  const handleExport = () => {
    const data = filtered.map(t => ({
      'Transaction ID': t.id,
      'Customer': t.customerName,
      'Amount': t.amount,
      'Currency': t.currency,
      'Status': t.status,
      'Gateway': t.gateway,
      'Date': new Date(t.date).toLocaleDateString(),
    }));
    exportToCSV(data, `transactions-${new Date().toISOString().split('T')[0]}`);
    addToast('success', 'Transactions exported successfully');
  };

  const handleRefund = async () => {
    if (!refundModal || !refundReason.trim()) return;
    setRefundLoading(true);
    try {
      createRefund({
        transactionId: refundModal.id,
        customerName: refundModal.customerName,
        amount: refundModal.amount,
        reason: refundReason,
        status: 'processed',
        date: new Date().toISOString(),
      });
      updateTransaction(refundModal.id, { status: 'refunded', type: 'refund' });
      addToast('success', `Refund of $${refundModal.amount.toLocaleString()} processed`);
      setRefundModal(null);
      setRefundReason('');
      refresh();
    } finally {
      setRefundLoading(false);
    }
  };

  const statusBadge = (status: Transaction['status']) => {
    const map: Record<string, string> = { completed: 'badge-success', pending: 'badge-warning', failed: 'badge-error', refunded: 'badge-info' };
    return `badge ${map[status] || 'badge-neutral'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Transactions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>View and manage all payment transactions</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">Export CSV</button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field max-w-xs"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All Dates</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <div className="flex items-center text-sm" style={{ color: 'var(--color-muted)' }}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
              {['Transaction ID', 'Customer', 'Amount', 'Currency', 'Status', 'Gateway', 'Date', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: 'var(--color-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map(tx => (
              <tr key={tx.id} className="table-row border-b" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--color-text)' }}>{tx.id}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>{tx.customerName}</td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>${tx.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{tx.currency}</td>
                <td className="px-4 py-3"><span className={statusBadge(tx.status)}>{tx.status}</span></td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{tx.gateway}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{new Date(tx.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedTx(tx)} className="btn-ghost text-xs px-2 py-1">View</button>
                    {tx.status === 'completed' && (
                      <button onClick={() => setRefundModal(tx)} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--color-error)' }}>Refund</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View detail modal */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className="btn-ghost p-1">✕</button>
            </div>
            <div className="space-y-3">
              {[
                ['Transaction ID', selectedTx.id],
                ['Customer', selectedTx.customerName],
                ['Amount', `$${selectedTx.amount.toLocaleString()} ${selectedTx.currency}`],
                ['Status', selectedTx.status],
                ['Gateway', selectedTx.gateway],
                ['Type', selectedTx.type],
                ['Date', new Date(selectedTx.date).toLocaleString()],
                ['Description', selectedTx.description || 'N/A'],
                ['PayPal ID', selectedTx.paypalTransactionId || 'N/A'],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{label}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setSelectedTx(null)} className="btn-secondary flex-1">Close</button>
              {selectedTx.status === 'completed' && (
                <button onClick={() => { setRefundModal(selectedTx); setSelectedTx(null); }} className="btn-danger flex-1">Refund</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund modal */}
      {refundModal && (
        <div className="modal-overlay" onClick={() => setRefundModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Process Refund</h3>
            <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--color-hover)' }}>
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>Refunding to: {refundModal.customerName}</div>
              <div className="text-lg font-bold mt-1" style={{ color: 'var(--color-text)' }}>${refundModal.amount.toLocaleString()} {refundModal.currency}</div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Reason for refund</label>
              <textarea
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Enter the reason for this refund..."
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setRefundModal(null); setRefundReason(''); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleRefund} disabled={refundLoading || !refundReason.trim()} className="btn-danger flex-1">
                {refundLoading ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
