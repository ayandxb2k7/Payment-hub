import { useState, useMemo } from 'react';
import { getApiKeys, createApiKey, deleteApiKey, getSettings, saveSettings } from '../db';
import { useDataRefresh } from '../contexts';
import { useToast } from '../contexts';
import type { ApiKey } from '../types';
import type { AppSettings } from '../db';

export default function DeveloperSettings() {
  const { refreshKey, refresh } = useDataRefresh();
  const { addToast } = useToast();
  const apiKeys = useMemo(() => getApiKeys(), [refreshKey]);
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [saving, setSaving] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<ApiKey | null>(null);
  const [showKey, setShowKey] = useState<string | null>(null);

  const handleSaveSettings = () => {
    setSaving(true);
    try {
      saveSettings(settings);
      addToast('success', 'Developer settings saved');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    createApiKey(newKeyName.trim());
    setNewKeyName('');
    addToast('success', 'API key created');
    refresh();
  };

  const handleDeleteKey = (key: ApiKey) => {
    deleteApiKey(key.id);
    setDeleteConfirm(null);
    addToast('success', 'API key revoked');
    refresh();
  };

  const maskKey = (key: string) => {
    if (showKey === key) return key;
    return key.substring(0, 12) + '...' + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Developer Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Configure integrations, API keys, and webhooks</p>
      </div>

      {/* PayPal Configuration */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#003087' }}>PP</div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>PayPal Integration</h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Configure PayPal Sandbox or Live credentials</p>
          </div>
        </div>

        {!settings.paypalClientId && (
          <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--color-hover)', borderLeft: '4px solid var(--color-warning)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>
              <strong>Setup Required:</strong> Enter your PayPal Sandbox credentials to enable payment processing. 
              Get credentials from <a href="https://developer.paypal.com/dashboard/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>PayPal Developer Dashboard</a>.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Client ID</label>
              <input
                type="text"
                value={settings.paypalClientId}
                onChange={e => setSettings({ ...settings, paypalClientId: e.target.value })}
                className="input-field"
                placeholder="PayPal Client ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Secret</label>
              <input
                type="password"
                value={settings.paypalSecret}
                onChange={e => setSettings({ ...settings, paypalSecret: e.target.value })}
                className="input-field"
                placeholder="PayPal Secret"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Environment</label>
              <select
                value={settings.paypalEnvironment}
                onChange={e => setSettings({ ...settings, paypalEnvironment: e.target.value as 'sandbox' | 'live' })}
                className="input-field"
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Status</label>
              <div className="flex items-center h-[38px]">
                {settings.paypalClientId ? (
                  <span className="badge badge-success">Connected ({settings.paypalEnvironment})</span>
                ) : (
                  <span className="badge badge-neutral">Not Configured</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini AI */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#4285F4' }}>AI</div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>Gemini AI Integration</h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Enable AI-powered insights and analysis</p>
          </div>
        </div>

        {!settings.geminiApiKey && (
          <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--color-hover)', borderLeft: '4px solid var(--color-accent)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>
              <strong>Optional:</strong> Without a Gemini API key, AI Insights uses deterministic analysis based on your data. 
              Add a key for advanced natural language processing. Get one from{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>Google AI Studio</a>.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Gemini API Key</label>
          <input
            type="password"
            value={settings.geminiApiKey}
            onChange={e => setSettings({ ...settings, geminiApiKey: e.target.value })}
            className="input-field max-w-lg"
            placeholder="AIza..."
          />
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--color-accent)' }}>WH</div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>Webhook Configuration</h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Set the endpoint URL for webhook events</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Webhook URL</label>
          <input
            type="url"
            value={settings.webhookUrl}
            onChange={e => setSettings({ ...settings, webhookUrl: e.target.value })}
            className="input-field max-w-lg"
            placeholder="https://api.yourdomain.com/webhooks/paymenthub"
          />
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Supported Events</h4>
          <div className="flex flex-wrap gap-2">
            {['payment_created', 'payment_completed', 'payment_failed', 'refund_created', 'subscription_updated'].map(e => (
              <span key={e} className="badge badge-info">{e}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={handleSaveSettings} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* API Keys */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>API Keys</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              className="input-field w-48"
              placeholder="Key name"
            />
            <button onClick={handleCreateKey} disabled={!newKeyName.trim()} className="btn-primary">Create Key</button>
          </div>
        </div>

        {apiKeys.length > 0 ? (
          <div className="space-y-2">
            {apiKeys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-hover)' }}>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{key.name}</div>
                  <div className="text-xs font-mono mt-1" style={{ color: 'var(--color-muted)' }}>
                    {maskKey(key.key)}
                    <button onClick={() => setShowKey(showKey === key.key ? null : key.key)} className="ml-2 text-xs" style={{ color: 'var(--color-accent)' }}>
                      {showKey === key.key ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(key.key); addToast('success', 'Copied to clipboard'); }} className="ml-2 text-xs" style={{ color: 'var(--color-accent)' }}>
                      Copy
                    </button>
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Created: {new Date(key.createdAt).toLocaleDateString()}</div>
                </div>
                <button onClick={() => setDeleteConfirm(key)} className="btn-ghost text-xs" style={{ color: 'var(--color-error)' }}>Revoke</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-8" style={{ color: 'var(--color-muted)' }}>No API keys created yet</p>
        )}
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Revoke API Key</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
              Are you sure you want to revoke the key <strong style={{ color: 'var(--color-text)' }}>{deleteConfirm.name}</strong>? 
              Any application using this key will lose access immediately.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDeleteKey(deleteConfirm)} className="btn-danger flex-1">Revoke Key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
