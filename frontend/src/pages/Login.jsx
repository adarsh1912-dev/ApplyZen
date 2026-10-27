import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CloudOff, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { Logo } from '../components/layout/Chrome';
import { ResumeSheet } from '../components/resume/ResumePreview';
import { heroResume } from '../lib/marketing';
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

  const submit = async (event) => {
    event.preventDefault();
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
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[.46fr_.54fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-accent-950 p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-accent-50 text-[15px] font-bold text-accent-950">A</span>
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-accent-50">Apply<span className="text-accent-300">Zen</span></span>
        </div>

        <div className="my-8">
          <div className="mx-auto h-[460px] w-[328px] overflow-hidden" aria-hidden="true">
            <div className="origin-top-left rotate-[-3deg] scale-[.4]">
              <ResumeSheet resume={heroResume} template="minimal" className="rounded-sm shadow-float ring-1 ring-black/10" />
            </div>
          </div>
          <div className="mx-auto -mt-4 flex w-fit items-center gap-2 rounded-full border border-accent-700 bg-accent-900 px-3 py-1.5 text-[10px] font-medium text-accent-100 shadow-float">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-300" /> Saved · version history on
          </div>
        </div>

        <div className="max-w-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-200/70">The writing desk</p>
          <p className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-[-0.03em] text-accent-50">A resume that gets you hired.</p>
          <p className="mt-3 text-[12.5px] leading-relaxed text-accent-100/75">Structured editing, honest matching, and a document that prints exactly as it looks.</p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Logo />
          <Link to="/" className="btn-ghost"><ArrowLeft size={14} /> Back home</Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-8">
          <div className="w-full max-w-sm">
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
                  onClick={() => { setMode(key); setError(''); }}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-[12.5px] font-semibold transition-colors duration-150 ${mode === key ? 'bg-surface text-ink shadow-sm' : 'text-muted'}`}
                >
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>

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
                <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" autoFocus />
              </div>
              <div>
                <label className="label" htmlFor="password">
                  Password {mode === 'register' && <span className="font-normal text-muted">(min 8 characters)</span>}
                </label>
                <input id="password" type="password" required minLength={mode === 'register' ? 8 : 1} className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="••••••••" />
              </div>
              <button disabled={busy} className="btn-primary w-full !py-2.5">
                {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
              <ShieldCheck size={13} className="mt-0.5 shrink-0 text-accent-600" />
              Sessions use HttpOnly cookies. Tokens never touch localStorage.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
