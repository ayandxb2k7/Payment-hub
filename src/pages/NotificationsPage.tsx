import { useMemo } from 'react';
import { getNotifications } from '../db';
import { useDataRefresh } from '../contexts';
import { useNotifications } from '../contexts';
import type { Notification } from '../types';

export default function NotificationsPage() {
  const { refreshKey } = useDataRefresh();
  const { markRead, markAllRead } = useNotifications();
  const notifications = useMemo(() => getNotifications(), [refreshKey]);

  const typeIcon: Record<Notification['type'], string> = {
    payment_received: '💰',
    payment_failed: '❌',
    invoice_overdue: '📋',
    refund_requested: '↩️',
    webhook_failed: '🔗',
    ai_report: '🤖',
  };

  const typeColor: Record<Notification['type'], string> = {
    payment_received: 'var(--color-success)',
    payment_failed: 'var(--color-error)',
    invoice_overdue: 'var(--color-warning)',
    refund_requested: 'var(--color-accent)',
    webhook_failed: 'var(--color-error)',
    ai_report: 'var(--color-accent)',
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Notifications</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Stay updated on payment events and alerts</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllRead} className="btn-secondary">Mark all as read</button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <div
            key={n.id}
            className="card flex gap-3 cursor-pointer"
            onClick={() => markRead(n.id)}
            style={{
              opacity: n.read ? 0.7 : 1,
              borderLeft: n.read ? '1px solid var(--color-border)' : `3px solid ${typeColor[n.type]}`,
            }}
          >
            <div className="text-xl flex-shrink-0 mt-0.5">{typeIcon[n.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{n.title}</span>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
                )}
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>{n.message}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            <span className={`badge ${n.type.includes('failed') || n.type === 'invoice_overdue' ? 'badge-error' : n.type === 'payment_received' ? 'badge-success' : n.type === 'refund_requested' ? 'badge-warning' : 'badge-info'}`}>
              {n.type.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
