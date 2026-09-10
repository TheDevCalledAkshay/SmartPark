import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getTheme } from '../theme.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [theme, setThemeState] = useState(getTheme());

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`auth-screen theme-${theme}`}>
      <div className="theme-toggle-fixed">
        <ThemeToggle onChange={setThemeState} />
      </div>
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-badge">🅿️</span>
          <div>
            <h1>SmartPark</h1>
            <p>Book parking before you arrive</p>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'on' : ''}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'on' : ''}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <>
              <label>
                Full name
                <input value={form.name} onChange={update('name')} placeholder="Your name" required />
              </label>
              <label>
                Phone (optional)
                <input value={form.phone} onChange={update('phone')} placeholder="9876543210" />
              </label>
            </>
          )}
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="min 6 characters"
              required
              minLength={6}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>

        <p className="auth-foot">Live parking availability · Camera & satellite powered</p>
      </div>
    </div>
  );
}
