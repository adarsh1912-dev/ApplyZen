import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, CircleAlert } from 'lucide-react';
import { MarketingNav, Footer } from '../components/layout/Chrome';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/ui/Toast';
import { ApiError } from '../lib/api';

export default function Login() {
  const nav = useNavigate();
  const { push } = useToast();
  const { login, register, online } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!online) {
    return (
      <div className="min-h-screen bg-paper">
        <MarketingNav />
        <main className="mx-auto max-w-md px-5 py-20">
          <div className="card p-8 text-center">
            <CircleAlert className="mx-auto text-amber-600" size={32} />
            <h1 className="mt-3 text-xl font-extrabold">No backend connected</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Accounts need the Applyzen API. Start it (<code>docker compose up -d db && npm run dev --prefix backend</code>),
              set <code>VITE_API_URL=http://localhost:4000</code>, and restart the frontend.
              Until then your work autosaves in this browser.
            </p>
            <Link to="/dashboard" className="btn-primary mt-5 w-full">Continue offline</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else {
        if (!name.trim()) throw new ApiError(400, 'VALIDATION_ERROR', 'Please enter your name.');
        await register(name.trim(), email.trim(), password);
      }
      push(mode === 'login' ? 'Welcome back.' : 'Account created.');
      nav('/dashboard');
    } catch (err) {
      const detail = err.details?.[0];
      setError(detail ? `${detail.message}` : (err.message || 'Something went wrong.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <MarketingNav />
      <main className="mx-auto max-w-md px-5 py-14">
        <div className="card p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === 'login' ? 'Sign in to sync resumes across devices.' : 'One account for resumes, analyses, and tracking.'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg border border-line bg-soft p-1" role="tablist" aria-label="Auth mode">
            {[['login', 'Sign in', LogIn], ['register', 'Register', UserPlus]].map(([k, l, Icon]) => (
              <button key={k} role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setError(''); }}
                className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-[13px] font-semibold ${mode === k ? 'bg-ink text-paper' : 'text-muted'}`}>
                <Icon size={14} />{l}
              </button>
            ))}
          </div>
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
          <form onSubmit={submit} className="mt-4 space-y-3">
            {mode === 'register' && (
              <div><label className="label" htmlFor="name">Name</label>
                <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} /></div>
            )}
            <div><label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
            <div><label className="label" htmlFor="password">Password {mode === 'register' && <span className="font-normal text-muted">(min 8 characters)</span>}</label>
              <input id="password" type="password" required minLength={mode === 'register' ? 8 : 1} className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></div>
            <button disabled={busy} className="btn-primary w-full">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>
          <p className="mt-4 text-center text-xs text-muted">Sessions use HttpOnly cookies — tokens never touch localStorage.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
