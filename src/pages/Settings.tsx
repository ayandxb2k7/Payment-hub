import { useState } from 'react';
import { useAuth } from '../contexts';
import { useToast } from '../contexts';
import { hashPassword } from '../db';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email';
    
    if (newPassword) {
      if (!currentPassword) errs.currentPassword = 'Enter current password';
      if (newPassword.length < 8) errs.newPassword = 'Must be at least 8 characters';
      else if (!/[A-Z]/.test(newPassword)) errs.newPassword = 'Must contain uppercase letter';
      else if (!/[0-9]/.test(newPassword)) errs.newPassword = 'Must contain a number';
      if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      if (newPassword) {
        const hash = await hashPassword(newPassword);
        updateUser({ name, email, passwordHash: hash });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        updateUser({ name, email });
      }
      addToast('success', 'Profile updated successfully');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Manage your account settings</p>
      </div>

      {/* Profile */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Profile</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: 'var(--color-accent)' }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{user?.name}</div>
            <div className="text-sm" style={{ color: 'var(--color-muted)' }}>{user?.email}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Full Name</label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }} className="input-field" />
            {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Email</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }} className="input-field" />
            {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.email}</p>}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Current Password</label>
            <input type="password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setErrors(p => ({ ...p, currentPassword: '' })); }} className="input-field" placeholder="Enter current password" />
            {errors.currentPassword && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.currentPassword}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>New Password</label>
            <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setErrors(p => ({ ...p, newPassword: '' })); }} className="input-field" placeholder="Min 8 chars, uppercase, number" />
            {errors.newPassword && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.newPassword}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: '' })); }} className="input-field" placeholder="Confirm new password" />
            {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.confirmPassword}</p>}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderLeft: '4px solid var(--color-error)' }}>
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Danger Zone</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>These actions are irreversible. Please be careful.</p>
        <button
          onClick={() => {
            if (confirm('This will reset all demo data including transactions, customers, and invoices. Are you sure?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="btn-danger"
        >
          Reset All Data
        </button>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
