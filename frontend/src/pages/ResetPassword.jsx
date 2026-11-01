import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not reset your password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <p className="section-title">Choose a new password</p>
      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.035em] text-ink">
        {done ? 'Password updated.' : 'Reset your password.'}
      </h1>

      {!token ? (
        <div className="mt-6 rounded-xl border border-danger/20 bg-danger/10 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-danger"><CircleAlert size={15} /> This link is incomplete</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-danger/80">Request a new reset link and use the button in the email.</p>
          <Link to="/forgot-password" className="btn-secondary mt-4 w-full">Request a new link</Link>
        </div>
      ) : done ? (
        <>
          <div className="mt-6 rounded-xl border border-accent-200 bg-accent-50 p-4 dark:border-accent-600/30 dark:bg-accent-600/15">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-800 dark:text-accent-200"><CheckCircle2 size={15} /> Your password has been changed</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-accent-800/80 dark:text-accent-200/80">Every device has been signed out. Sign in with your new password.</p>
          </div>
          <Link to="/login" className="btn-primary mt-5 w-full">Sign in</Link>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted">Choose a new password. Resetting it signs you out on every device.</p>
          {error && <p role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-[12.5px] font-medium text-danger">{error}</p>}
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="new-password">New password</label>
              <input id="new-password" type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" autoFocus />
            </div>
            <div>
              <label className="label" htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" type="password" required minLength={8} className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="Repeat the password" />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full !py-2.5">{busy ? 'Saving…' : 'Save new password'}</button>
          </form>
          <Link to="/login" className="btn-ghost mt-4 w-full">Back to sign in</Link>
        </>
      )}
    </AuthLayout>
  );
}
