import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export default function ForgotPassword() {
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
      push('If the account exists, a reset link is on its way.');
    } catch (err) {
      setError(err.message || 'Could not send the reset email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <p className="section-title">Account recovery</p>
      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.035em] text-ink">Forgot your password?</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Enter your account email. If it exists, we’ll send a reset link that expires in 30 minutes.
      </p>

      {sent ? (
        <>
          <div className="mt-6 rounded-xl border border-accent-200 bg-accent-50 p-4 dark:border-accent-600/30 dark:bg-accent-600/15">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-800 dark:text-accent-200"><Mail size={15} /> Check your inbox</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-accent-800/80 dark:text-accent-200/80">
              If an account exists for {email}, a reset link is on its way.
            </p>
          </div>
          <Link to="/login" className="btn-secondary mt-5 w-full">Back to sign in</Link>
        </>
      ) : (
        <>
          {error && <p role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-[12.5px] font-medium text-danger">{error}</p>}
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" autoFocus />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full !py-2.5">{busy ? 'Sending…' : 'Send reset link'}</button>
          </form>
          <Link to="/login" className="btn-ghost mt-4 w-full">Back to sign in</Link>
        </>
      )}
    </AuthLayout>
  );
}
