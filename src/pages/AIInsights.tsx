import { useState, useMemo } from 'react';
import { generateAIInsights, getTransactions, getCustomers, getInvoices, getSubscriptions } from '../db';
import { useDataRefresh } from '../contexts';
import { useToast } from '../contexts';

export default function AIInsights() {
  const { refreshKey } = useDataRefresh();
  const { addToast } = useToast();
  const [report, setReport] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const transactions = useMemo(() => getTransactions(), [refreshKey]);
  const customers = useMemo(() => getCustomers(), [refreshKey]);
  // refunds data is used inside generateAIInsights
  const invoices = useMemo(() => getInvoices(), [refreshKey]);
  const subscriptions = useMemo(() => getSubscriptions(), [refreshKey]);

  const completedTxns = transactions.filter(t => t.status === 'completed');
  const totalRevenue = completedTxns.reduce((s, t) => s + t.amount, 0);
  const failedTxns = transactions.filter(t => t.status === 'failed');
  const failedRate = transactions.length > 0 ? (failedTxns.length / transactions.length * 100) : 0;
  const refundedTxns = transactions.filter(t => t.status === 'refunded');
  const refundRate = transactions.length > 0 ? (refundedTxns.length / transactions.length * 100) : 0;
  const highRisk = customers.filter(c => c.riskScore > 70);
  const overdue = invoices.filter(i => i.status === 'overdue');
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const mrr = activeSubs.reduce((s, sub) => s + sub.amount, 0);

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    const result = generateAIInsights();
    setReport(result);
    setGenerating(false);
    addToast('success', 'AI report generated successfully');
  };

  const handleExportReport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `paymenthub-ai-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    addToast('success', 'Report exported');
  };

  const insights = useMemo(() => {
    const items: { type: 'success' | 'warning' | 'error' | 'info'; title: string; description: string }[] = [];
    
    if (refundRate > 5) {
      items.push({ type: 'warning', title: 'High Refund Rate', description: `Your refund rate of ${refundRate.toFixed(1)}% is above the 5% industry average. Consider investigating common refund reasons and improving product quality.` });
    }
    if (failedRate > 10) {
      items.push({ type: 'error', title: 'Elevated Failure Rate', description: `${failedRate.toFixed(1)}% of payments are failing. Review your payment gateway configurations and consider adding fallback options.` });
    }
    if (highRisk.length > 0) {
      items.push({ type: 'warning', title: `${highRisk.length} High-Risk Customers`, description: `${highRisk.length} customers have a risk score above 70. Monitor these accounts and consider implementing additional verification.` });
    }
    if (overdue.length > 0) {
      items.push({ type: 'warning', title: `${overdue.length} Overdue Invoices`, description: `You have ${overdue.length} overdue invoices totaling $${overdue.reduce((s, i) => s + i.total, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}. Send automated reminders to recover this revenue.` });
    }
    if (mrr > 0) {
      items.push({ type: 'info', title: 'Recurring Revenue', description: `Monthly recurring revenue is $${mrr.toLocaleString()} across ${activeSubs.length} active subscriptions. ARR projection: $${(mrr * 12).toLocaleString()}.` });
    }
    if (completedTxns.length > 0) {
      const avg = totalRevenue / completedTxns.length;
      items.push({ type: 'info', title: 'Average Transaction Value', description: `Your average transaction value is $${avg.toFixed(2)}. Consider upselling strategies to increase this metric.` });
    }
    if (items.length === 0) {
      items.push({ type: 'success', title: 'All Systems Healthy', description: 'No critical issues detected in your payment infrastructure. Keep monitoring regularly.' });
    }
    return items;
  }, [transactions, customers, invoices, subscriptions, refundRate, failedRate, highRisk, overdue, mrr, completedTxns, totalRevenue, activeSubs]);

  const typeStyles = {
    success: { bg: 'var(--color-success)', badge: 'badge-success', label: 'Good' },
    warning: { bg: 'var(--color-warning)', badge: 'badge-warning', label: 'Warning' },
    error: { bg: 'var(--color-error)', badge: 'badge-error', label: 'Critical' },
    info: { bg: 'var(--color-accent)', badge: 'badge-info', label: 'Info' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>AI Insights</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>AI-powered payment analytics and recommendations</p>
        </div>
        <div className="flex gap-2">
          {report && <button onClick={handleExportReport} className="btn-secondary">Export Report</button>}
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? 'Generating...' : 'Generate AI Report'}
          </button>
        </div>
      </div>

      {/* Quick insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, i) => (
          <div key={i} className="card flex gap-3">
            <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: typeStyles[insight.type].bg }} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{insight.title}</span>
                <span className={`badge ${typeStyles[insight.type].badge}`}>{typeStyles[insight.type].label}</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{insight.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
          { label: 'Failure Rate', value: `${failedRate.toFixed(1)}%` },
          { label: 'Refund Rate', value: `${refundRate.toFixed(1)}%` },
          { label: 'High Risk Customers', value: String(highRisk.length) },
        ].map(m => (
          <div key={m.label} className="stat-card">
            <div className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>{m.label}</div>
            <div className="text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Detailed report */}
      {generating && (
        <div className="card text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Analyzing payment data and generating insights...</p>
        </div>
      )}

      {report && !generating && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Executive Payment Report</h3>
          <pre className="text-sm whitespace-pre-wrap font-mono p-4 rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--color-hover)', color: 'var(--color-text)', lineHeight: 1.6 }}>
            {report}
          </pre>
        </div>
      )}

      {/* Top customers by LTV */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Top Customers by Lifetime Value</h3>
        <div className="space-y-2">
          {customers.sort((a, b) => b.lifetimeValue - a.lifetimeValue).slice(0, 10).map((c, i) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold w-6" style={{ color: 'var(--color-muted)' }}>#{i + 1}</span>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{c.name}</div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{c.company} · {c.country}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>${c.lifetimeValue.toLocaleString()}</div>
                <span className={`badge ${c.riskScore > 70 ? 'badge-error' : c.riskScore > 40 ? 'badge-warning' : 'badge-success'}`}>
                  Risk: {c.riskScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gemini API notice */}
      <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
        <div className="flex items-start gap-3">
          <span className="text-lg">💡</span>
          <div>
            <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Enhanced AI with Gemini</h4>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              Connect a Gemini API key in Developer Settings to enable advanced AI-powered insights, natural language queries, and predictive analytics. 
              Without a key, the system uses deterministic analysis based on your payment data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
