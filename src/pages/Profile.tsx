import { useAuth } from '../contexts';
import { getCompanyById } from '../db';

export default function Profile() {
  const { user } = useAuth();
  const company = user ? getCompanyById(user.companyId) : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Profile</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Your account information</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold" style={{ backgroundColor: 'var(--color-accent)' }}>
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{user?.name}</h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{user?.email}</p>
            <span className="badge badge-info mt-1">{user?.role}</span>
          </div>
        </div>

        <div className="space-y-3">
          {[
            ['Full Name', user?.name],
            ['Email', user?.email],
            ['Company', company?.name],
            ['Role', user?.role],
            ['Member Since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{value || 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
