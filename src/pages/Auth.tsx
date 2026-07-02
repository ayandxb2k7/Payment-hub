import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts';
import { useToast } from '../contexts';

export function LoginPage() {
  const { user, login, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        addToast('success', 'Welcome back!');
        navigate('/dashboard', { replace: true });
      } else {
        setErrors({ password: result.error || 'Login failed' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12" style={{ backgroundColor: 'var(--color-accent)' }}>
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8">
            <span className="text-white text-3xl font-bold">P</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">PaymentHub AI</h1>
          <p className="text-lg text-white/80">Enterprise payment infrastructure for modern businesses</p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--color-accent)' }}>P</div>
            <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>PaymentHub AI</span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Sign in</h2>
          <p className="mb-8" style={{ color: 'var(--color-muted)' }}>Enter your credentials to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                className="input-field"
                placeholder="you@company.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                className="input-field"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-hover)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text)' }}>Demo credentials:</p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Email: admin@paymenthub.ai</p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Password: Admin123!</p>
          </div>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium" style={{ color: 'var(--color-accent)' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { user, register, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!companyName.trim()) errs.companyName = 'Company name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(password)) errs.password = 'Password must contain an uppercase letter';
    else if (!/[0-9]/.test(password)) errs.password = 'Password must contain a number';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await register(name, companyName, email, password);
      if (result.success) {
        addToast('success', 'Account created successfully!');
        navigate('/dashboard', { replace: true });
      } else {
        setErrors({ email: result.error || 'Registration failed' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12" style={{ backgroundColor: 'var(--color-accent)' }}>
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8">
            <span className="text-white text-3xl font-bold">P</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">PaymentHub AI</h1>
          <p className="text-lg text-white/80">Start managing your payments with enterprise-grade tools</p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--color-accent)' }}>P</div>
            <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>PaymentHub AI</span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Create your account</h2>
          <p className="mb-8" style={{ color: 'var(--color-muted)' }}>Get started with PaymentHub AI</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
                className="input-field"
                placeholder="John Smith"
              />
              {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => { setCompanyName(e.target.value); setErrors(prev => ({ ...prev, companyName: '' })); }}
                className="input-field"
                placeholder="Acme Corp"
              />
              {errors.companyName && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.companyName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                className="input-field"
                placeholder="you@company.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                className="input-field"
                placeholder="Min 8 chars, uppercase, number"
                autoComplete="new-password"
              />
              {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                className="input-field"
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5"
            >
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: 'var(--color-accent)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
