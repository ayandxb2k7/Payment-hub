import { useMemo } from 'react';
import { getDashboardStats, getInvoices, getNotifications } from '../db';
import { useDataRefresh } from '../contexts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#0057FF', '#16A34A', '#F59E0B', '#8B5CF6'];

export default function Dashboard() {
  const { refreshKey } = useDataRefresh();
  const stats = useMemo(() => getDashboardStats(), [refreshKey]);
  const overdueInvoices = useMemo(() => getInvoices().filter(i => i.status === 'overdue').length, [refreshKey]);
  const recentNotifs = useMemo(() => getNotifications().filter(n => !n.read).slice(0, 5), [refreshKey]);

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;
  const fmtFull = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const statCards = [
    { label: 'Total Revenue', value: fmtFull(stats.totalRevenue), change: stats.revenueChange, prefix: '' },
    { label: 'Monthly Revenue', value: fmtFull(stats.monthlyRevenue), change: stats.revenueChange, prefix: '' },
    { label: 'Successful Payments', value: stats.successfulPayments.toLocaleString(), change: null, prefix: '' },
    { label: 'Failed Payments', value: stats.failedPayments.toLocaleString(), change: null, prefix: '', color: 'var(--color-error)' },
    { label: 'Refund Rate', value: `${stats.refundRate}%`, change: null, prefix: '' },
    { label: 'Active Customers', value: stats.activeCustomers.toLocaleString(), change: null, prefix: '' },
    { label: 'MRR', value: fmtFull(stats.mrr), change: null, prefix: '' },
    { label: 'ARR', value: fmt(stats.arr), change: null, prefix: '' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Overview of your payment infrastructure</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>{card.label}</div>
            <div className="text-xl font-bold mt-2" style={{ color: card.color || 'var(--color-text)' }}>{card.value}</div>
            {card.change !== null && card.change !== undefined && (
              <div className="text-xs mt-1" style={{ color: card.change >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}% from last month
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Revenue Overview</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment methods */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Payment Methods</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.gatewayBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {stats.gatewayBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {stats.gatewayBreakdown.map((g, i) => (
              <div key={g.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span style={{ color: 'var(--color-text)' }}>{g.name}</span>
                </div>
                <span style={{ color: 'var(--color-muted)' }}>{g.value} ({fmtFull(g.revenue)})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent transactions */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Recent Transactions</h3>
          <div className="space-y-2">
            {stats.recentTransactions.slice(0, 6).map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b table-row" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{tx.customerName}</div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{tx.gateway} · {new Date(tx.date).toLocaleDateString()}</div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>${tx.amount.toLocaleString()}</div>
                  <span className={`badge ${tx.status === 'completed' ? 'badge-success' : tx.status === 'failed' ? 'badge-error' : tx.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status overview + alerts */}
        <div className="space-y-4">
          {/* Payment status */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Payment Status</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <span className={`badge ${status === 'completed' ? 'badge-success' : status === 'failed' ? 'badge-error' : status === 'pending' ? 'badge-warning' : 'badge-info'}`}>
                    {count}
                  </span>
                  <span className="text-sm capitalize" style={{ color: 'var(--color-text)' }}>{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Alerts</h3>
            <div className="space-y-2">
              {overdueInvoices > 0 && (
                <div className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-hover)' }}>
                  <span className="text-amber-500 text-sm">⚠</span>
                  <div className="text-sm" style={{ color: 'var(--color-text)' }}>{overdueInvoices} overdue invoice{overdueInvoices > 1 ? 's' : ''} need attention</div>
                </div>
              )}
              {stats.failedPayments > 10 && (
                <div className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-hover)' }}>
                  <span className="text-red-500 text-sm">●</span>
                  <div className="text-sm" style={{ color: 'var(--color-text)' }}>High failure rate detected — review gateway settings</div>
                </div>
              )}
              {recentNotifs.length > 0 && (
                <div className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-hover)' }}>
                  <span className="text-blue-500 text-sm">●</span>
                  <div className="text-sm" style={{ color: 'var(--color-text)' }}>{recentNotifs.length} unread notification{recentNotifs.length > 1 ? 's' : ''}</div>
                </div>
              )}
              {overdueInvoices === 0 && stats.failedPayments <= 10 && recentNotifs.length === 0 && (
                <div className="text-sm" style={{ color: 'var(--color-muted)' }}>No alerts — everything looks good!</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
