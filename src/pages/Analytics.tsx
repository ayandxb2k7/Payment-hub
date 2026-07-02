import { useMemo } from 'react';
import { getTransactions, getCustomers, getInvoices, getSubscriptions } from '../db';
import { useDataRefresh } from '../contexts';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#0057FF', '#16A34A', '#F59E0B', '#8B5CF6', '#DC2626', '#06B6D4'];

export default function Analytics() {
  const { refreshKey } = useDataRefresh();
  const transactions = useMemo(() => getTransactions(), [refreshKey]);
  const customers = useMemo(() => getCustomers(), [refreshKey]);
  const invoices = useMemo(() => getInvoices(), [refreshKey]);
  const subscriptions = useMemo(() => getSubscriptions(), [refreshKey]);

  const monthlyData = useMemo(() => {
    const months: { month: string; revenue: number; count: number; failed: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const name = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const completed = transactions.filter(t => t.status === 'completed' && new Date(t.date) >= start && new Date(t.date) < end);
      const failed = transactions.filter(t => t.status === 'failed' && new Date(t.date) >= start && new Date(t.date) < end);
      months.push({
        month: name,
        revenue: Math.round(completed.reduce((s, t) => s + t.amount, 0) * 100) / 100,
        count: completed.length,
        failed: failed.length,
      });
    }
    return months;
  }, [transactions]);

  const currencyBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.status === 'completed').forEach(t => { map[t.currency] = (map[t.currency] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [transactions]);

  const gatewayRevenue = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    transactions.filter(t => t.status === 'completed').forEach(t => {
      if (!map[t.gateway]) map[t.gateway] = { revenue: 0, count: 0 };
      map[t.gateway].revenue += t.amount;
      map[t.gateway].count += 1;
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data }));
  }, [transactions]);

  const statusOverTime = useMemo(() => {
    const months: { month: string; completed: number; pending: number; failed: number; refunded: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const name = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthTx = transactions.filter(t => new Date(t.date) >= start && new Date(t.date) < end);
      months.push({
        month: name,
        completed: monthTx.filter(t => t.status === 'completed').length,
        pending: monthTx.filter(t => t.status === 'pending').length,
        failed: monthTx.filter(t => t.status === 'failed').length,
        refunded: monthTx.filter(t => t.status === 'refunded').length,
      });
    }
    return months;
  }, [transactions]);

  const customerGrowth = useMemo(() => {
    const months: { month: string; total: number; active: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const name = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const total = customers.filter(c => new Date(c.createdAt) <= new Date(now.getFullYear(), now.getMonth() - i + 1, 0)).length;
      const active = customers.filter(c => c.status === 'active' && new Date(c.createdAt) <= new Date(now.getFullYear(), now.getMonth() - i + 1, 0)).length;
      months.push({ month: name, total, active });
    }
    return months;
  }, [customers]);

  const completedTxns = transactions.filter(t => t.status === 'completed');
  const totalRevenue = completedTxns.reduce((s, t) => s + t.amount, 0);
  const avgValue = completedTxns.length > 0 ? totalRevenue / completedTxns.length : 0;
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const mrr = activeSubs.reduce((s, sub) => s + sub.amount, 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');

  const tooltipStyle = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contentStyle: { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 } as any,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Detailed payment analytics and insights</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
          { label: 'Avg Transaction', value: `$${avgValue.toFixed(2)}` },
          { label: 'MRR', value: `$${mrr.toLocaleString()}` },
          { label: 'Paid Invoices', value: String(paidInvoices.length) },
          { label: 'Overdue', value: String(overdueInvoices.length) },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>{s.label}</div>
            <div className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Revenue Trend (12 months)</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transaction volume */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Transaction Volume</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Successful" fill="var(--color-success)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="var(--color-error)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Currency breakdown */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Revenue by Currency</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={currencyBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" nameKey="name" label>
                  {currencyBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2">
            {currencyBreakdown.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span style={{ color: 'var(--color-text)' }}>{c.name}</span>
                </div>
                <span style={{ color: 'var(--color-muted)' }}>${c.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status over time */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Payment Status Over Time</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statusOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="completed" stroke="var(--color-success)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="failed" stroke="var(--color-error)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="refunded" stroke="var(--color-warning)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gateway revenue */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Revenue by Gateway</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gatewayRevenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}K`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} width={90} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="revenue" fill="var(--color-accent)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer growth */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Customer Growth</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="total" name="Total Customers" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="active" name="Active Customers" stroke="var(--color-success)" fill="var(--color-success)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
