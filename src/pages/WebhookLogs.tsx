import { useState, useMemo } from 'react';
import { getWebhookLogs, updateWebhookLog } from '../db';
import { useDataRefresh } from '../contexts';
import { useToast } from '../contexts';
import type { WebhookLog } from '../types';

export default function WebhookLogs() {
  const { refreshKey, refresh } = useDataRefresh();
  const { addToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const logs = useMemo(() => getWebhookLogs(), [refreshKey]);

  const filtered = useMemo(() => {
    let result = logs;
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    if (eventTypeFilter !== 'all') result = result.filter(l => l.eventType === eventTypeFilter);
    return result;
  }, [logs, statusFilter, eventTypeFilter]);

  const eventTypes = useMemo(() => [...new Set(logs.map(l => l.eventType))], [logs]);

  const handleRetry = (log: WebhookLog) => {
    // Simulate retry
    updateWebhookLog(log.id, { status: 'success', retries: log.retries + 1 });
    addToast('success', `Webhook ${log.id} retried successfully`);
    refresh();
  };

  const statusBadge = (s: WebhookLog['status']) => {
    const m: Record<string, string> = { success: 'badge-success', failed: 'badge-error', retrying: 'badge-warning' };
    return `badge ${m[s] || 'badge-neutral'}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Webhook Logs</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Monitor webhook delivery and retry failed events</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>Total Events</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{logs.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>Failed</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-error)' }}>{logs.filter(l => l.status === 'failed').length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>Success Rate</div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-success)' }}>
            {logs.length > 0 ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="retrying">Retrying</option>
          </select>
          <select value={eventTypeFilter} onChange={e => setEventTypeFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All Event Types</option>
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="text-sm self-center" style={{ color: 'var(--color-muted)' }}>{filtered.length} logs</span>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
              {['ID', 'Event Type', 'Status', 'Retries', 'Time', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: 'var(--color-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="table-row border-b" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--color-text)' }}>{log.id}</td>
                <td className="px-4 py-3"><span className="badge badge-info">{log.eventType}</span></td>
                <td className="px-4 py-3"><span className={statusBadge(log.status)}>{log.status}</span></td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{log.retries}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedLog(log)} className="btn-ghost text-xs px-2 py-1">View</button>
                    {log.status === 'failed' && (
                      <button onClick={() => handleRetry(log)} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--color-accent)' }}>Retry</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-muted)' }}>No webhook logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View payload modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" style={{ maxWidth: '40rem' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Webhook Event</h3>
              <button onClick={() => setSelectedLog(null)} className="btn-ghost p-1">✕</button>
            </div>
            <div className="space-y-2 mb-4">
              {[
                ['ID', selectedLog.id],
                ['Event Type', selectedLog.eventType],
                ['Status', selectedLog.status],
                ['Retries', String(selectedLog.retries)],
                ['Time', new Date(selectedLog.createdAt).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{k}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Payload</label>
              <pre className="text-xs whitespace-pre-wrap font-mono p-3 rounded-lg overflow-x-auto max-h-64" style={{ backgroundColor: 'var(--color-hover)', color: 'var(--color-text)' }}>
                {(() => { try { return JSON.stringify(JSON.parse(selectedLog.payload), null, 2); } catch { return selectedLog.payload; } })()}
              </pre>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSelectedLog(null)} className="btn-secondary flex-1">Close</button>
              {selectedLog.status === 'failed' && (
                <button onClick={() => { handleRetry(selectedLog); setSelectedLog(null); }} className="btn-primary flex-1">Retry</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
