import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { api } from '../lib/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? '' : 'This verification link is incomplete.');

  useEffect(() => {
    if (!token) return;
    let on = true;
    api.verifyEmail(token)
      .then(() => { if (on) setState('success'); })
      .catch((err) => {
        if (!on) return;
        setMessage(err.message || 'This verification link is invalid or has expired.');
        setState('error');
      });
    return () => { on = false; };
  }, [token]);

  return (
    <AuthLayout>
      {state === 'loading' && (
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-accent-600" size={28} />
          <p className="mt-4 text-sm font-medium text-muted">Verifying your email…</p>
        </div>
      )}

      {state === 'success' && (
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-600/15 dark:text-accent-200">
            <CheckCircle2 size={22} />
          </span>
          <p className="section-title mt-4">Email verified</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.035em] text-ink">You’re all set.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">Sign in to start building, tailoring, and tracking.</p>
          <Link to="/login" className="btn-primary mt-5 w-full">Sign in</Link>
        </div>
      )}

      {state === 'error' && (
        <div>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-danger/10 text-danger">
            <CircleAlert size={22} />
          </span>
          <p className="section-title mt-4 text-center">Verification failed</p>
          <h1 className="mt-2 text-center text-balance text-3xl font-semibold tracking-[-0.035em] text-ink">This link won’t work.</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted">{message}</p>
          <Link to="/login" className="btn-primary mt-5 w-full">Go to sign in</Link>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">Sign in to request a new verification email from the sign-in page.</p>
        </div>
      )}
    </AuthLayout>
  );
}
