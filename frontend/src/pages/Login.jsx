import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CloudOff, LogIn, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { Logo } from '../components/layout/Chrome';
import AuthLayout from '../components/auth/AuthLayout';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/ui/Toast';
import { ApiError, api } from '../lib/api';

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
  const [pendingEmail, setPendingEmail] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  if (!online) {
    return (
      <div className="min-h-screen bg-paper">
        <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <Link to="/" className="btn-ghost"><ArrowLeft size={14} /> Back home</Link>
        </header>
        <main className="mx-auto grid max-w-md place-items-center px-4 py-16">
          <div className="card w-full p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-warning/10 text-warning">
              <CloudOff size={22} />
            </span>
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">No backend connected</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Accounts need the ApplyZen API. Start Postgres and the backend, set <code className="rounded bg-soft px-1 py-0.5 text-[12px]">VITE_API_URL</code>, then restart the frontend. Until then, your work autosaves in this browser.
            </p>
            <Link to="/dashboard" className="btn-primary mt-5 w-full">Continue offline</Link>
            <Link to="/" className="btn-ghost mt-2 w-full">Back home</Link>
          </div>
        </main>
      </div>
    );
  }

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setNeedsVerification(false);
  };

  const resend = async () => {
    const target = (pendingEmail || email).trim();
    if (!target) {
      setError('Enter your email first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.resendVerification(target);
      push('If that account exists, a new verification email is on its way.');
    } catch (err) {
      setError(err.message || 'Could not resend the verification email.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNeedsVerification(false);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        push('Welcome back.');
        nav('/dashboard');
      } else {
        if (!name.trim()) throw new ApiError(400, 'VALIDATION_ERROR', 'Please enter your name.');
        const result = await register(name.trim(), email.trim(), password);
        if (result?.verification_required) {
          setPendingEmail(email.trim());
          setCheckEmail(true);
          push(result.email_sent ? 'Check your email to verify your account.' : 'Account created. Resend the verification email when ready.');
          return;
        }
        push('Account created.');
        nav('/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        setPendingEmail(email.trim());
        setNeedsVerification(true);
        setError('');
        return;
      }
      const detail = err.details?.[0];
      setError(detail ? `${detail.message}` : (err.message || 'Something went wrong.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      {checkEmail ? (
        <div>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-600/15 dark:text-accent-200">
            <Mail size={22} />
          </span>
          <p className="section-title mt-4">One more step</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.035em] text-ink">Check your email.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            We sent a verification link to <span className="font-medium text-ink">{pendingEmail}</span>. The link expires in 24 hours.
          </p>
          {error && <p role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-[12.5px] font-medium text-danger">{error}</p>}
          <button onClick={resend} disabled={busy} className="btn-secondary mt-5 w-full !py-2.5">
            {busy ? 'Resending…' : 'Resend verification email'}
          </button>
          <button
            onClick={() => { setCheckEmail(false); setMode('login'); setPassword(''); setError(''); setNeedsVerification(false); }}
            className="btn-ghost mt-2 w-full"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <>
          <p className="section-title">Your workspace</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.035em] text-ink">
            {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {mode === 'login' ? 'Sign in to sync resumes, analyses, and applications across devices.' : 'One account for resumes, analyses, and your application pipeline.'}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-line bg-soft/60 p-1" role="tablist" aria-label="Auth mode">
            {[['login', 'Sign in', LogIn], ['register', 'Register', UserPlus]].map(([key, label, Icon]) => (
              <button
                key={key}
                role="tab"
                aria-selected={mode === key}
                onClick={() => switchMode(key)}
                className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-[12.5px] font-semibold transition-colors duration-150 ${mode === key ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}
              >
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {needsVerification && (
            <div className="mt-4 rounded-xl border border-warning/25 bg-warning/10 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-warning"><Mail size={14} /> Verify your email first</p>
              <p className="mt-1 text-[12px] leading-relaxed text-warning/90">
                This account exists but the email isn’t verified. Check your inbox or resend the link.
              </p>
              <button onClick={resend} disabled={busy} className="btn-secondary mt-2 w-full !py-2 !text-[11.5px]">
                {busy ? 'Resending…' : 'Resend verification email'}
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-[12.5px] font-medium leading-relaxed text-danger">
              {error}
            </p>
          )}

          <form onSubmit={submit} className="mt-4 space-y-3">
            {mode === 'register' && (
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (needsVerification) setNeedsVerification(false); }}
                autoComplete="email"
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password {mode === 'register' && <span className="font-normal text-muted">(min 8 characters)</span>}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={mode === 'register' ? 8 : 1}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
              />
            </div>
            {mode === 'login' && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-[11.5px] font-medium text-accent-700 hover:underline dark:text-accent-300">
                  Forgot password?
                </Link>
              </div>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full !py-2.5">
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-accent-600" />
            Sessions use HttpOnly cookies. Tokens never touch localStorage.
          </p>
        </>
      )}
    </AuthLayout>
  );
}
