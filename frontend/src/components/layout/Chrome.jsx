import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Compass, LayoutDashboard, PenLine, ScanSearch, LayoutTemplate, KanbanSquare,
  Plus, LogOut, Menu, X, CloudOff,
} from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../lib/auth';
import { useToast } from '../ui/Toast';

const ACTIVE = 'bg-accent-50 text-accent-800 dark:bg-accent-600/15 dark:text-accent-200';

export function Logo({ compact = false }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="ApplyZen home">
      <span className="relative grid h-9 w-9 place-items-center rounded-[11px] bg-accent-600 text-accent-foreground shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 18 12 4l6 14" />
          <path d="M8.5 13h7" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-clay-500 ring-2 ring-paper" />
      </span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
          Apply<span className="text-accent-700 dark:text-accent-300">Zen</span>
        </span>
      )}
    </Link>
  );
}

const MARKETING_LINKS = [
  ['Features', '#features'],
  ['How it works', '#how'],
  ['Templates', '/templates'],
  ['Pricing', '#pricing'],
];

export function MarketingNav() {
  const { user, online } = useAuth();
  const [open, setOpen] = useState(false);
  const signedIn = online && Boolean(user);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted lg:flex" aria-label="Primary">
          {MARKETING_LINKS.map(([label, href]) => (
            href.startsWith('#')
              ? <a key={label} href={href} className="transition-colors duration-150 hover:text-ink">{label}</a>
              : <Link key={label} to={href} className="transition-colors duration-150 hover:text-ink">{label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn-ghost !p-2 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-marketing-menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          {online && !signedIn && <Link to="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>}
          {signedIn && (
            <Link to="/dashboard" className="btn-secondary hidden !py-2 sm:inline-flex" title={user.email}>
              {user.name?.split(' ')[0] || 'Account'}
            </Link>
          )}
          <Link to={signedIn ? '/dashboard' : '/login'} className="btn-primary !py-2">
            {signedIn ? 'Dashboard' : 'Get started'}
          </Link>
        </div>
      </div>

      {open && (
        <div id="mobile-marketing-menu" className="border-t border-line bg-paper/95 px-4 py-4 lg:hidden">
          <nav className="grid gap-1" aria-label="Mobile primary">
            {MARKETING_LINKS.map(([label, href]) => (
              href.startsWith('#')
                ? <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-soft hover:text-ink">{label}</a>
                : <Link key={label} to={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-soft hover:text-ink">{label}</Link>
            ))}
            {online && !signedIn && <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-soft hover:text-ink">Sign in</Link>}
            {signedIn && <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-soft hover:text-ink">Dashboard</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const { online } = useAuth();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            A calmer way to build, tailor, and track job-ready résumés. Honest analysis, evidence-backed suggestions, and a document that prints beautifully.
          </p>
        </div>
        <nav aria-label="Product">
          <p className="section-title mb-4">Product</p>
          <ul className="space-y-2.5 text-sm font-medium text-muted">
            <li><Link className="transition-colors hover:text-ink" to="/editor">Résumé editor</Link></li>
            <li><Link className="transition-colors hover:text-ink" to="/analyzer">Job analyzer</Link></li>
            <li><Link className="transition-colors hover:text-ink" to="/templates">Templates</Link></li>
            <li><Link className="transition-colors hover:text-ink" to="/tracker">Application tracker</Link></li>
          </ul>
        </nav>
        <nav aria-label="Resources">
          <p className="section-title mb-4">Resources</p>
          <ul className="space-y-2.5 text-sm font-medium text-muted">
            <li><a href="#features" className="transition-colors hover:text-ink">Features</a></li>
            <li><a href="#how" className="transition-colors hover:text-ink">How it works</a></li>
            <li><a href="#pricing" className="transition-colors hover:text-ink">Pricing</a></li>
            <li><Link className="transition-colors hover:text-ink" to="/dashboard">Dashboard</Link></li>
          </ul>
        </nav>
        <div>
          <p className="section-title mb-4">Private by default</p>
          <p className="text-sm leading-relaxed text-muted">
            Match estimates are text-based heuristics, not hiring probabilities. {online
              ? 'Your résumés, analyses, and applications are stored with your account.'
              : 'Your data stays in this browser while you use offline mode.'}
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 ApplyZen. Built for job seekers.</p>
          <p className="flex items-center gap-1.5"><Compass size={13} /> Structure without fiction.</p>
        </div>
      </div>
    </footer>
  );
}

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/editor', icon: PenLine, label: 'Editor' },
  { to: '/analyzer', icon: ScanSearch, label: 'Job analyzer' },
  { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { to: '/tracker', icon: KanbanSquare, label: 'Applications' },
];

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'AZ';
}

export function AppShell({ children, onNew }) {
  const nav = useNavigate();
  const { user, online, logout } = useAuth();
  const { push } = useToast();
  const [accountOpen, setAccountOpen] = useState(false);
  const signOut = async () => {
    // Leave the protected area first; otherwise clearing the user can trigger
    // the route guard's redirect before this navigation runs.
    nav('/');
    await logout();
    push('Signed out. Local drafts remain in this browser.');
  };

  return (
    <div className="min-h-screen bg-paper">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface lg:flex" aria-label="App navigation">
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Logo />
          <ThemeToggle />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${isActive ? ACTIVE : 'text-muted hover:bg-soft hover:text-ink'}`}>
              {({ isActive }) => (
                <>
                  <n.icon size={17} strokeWidth={isActive ? 2.4 : 2} />
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <button onClick={onNew ?? (() => nav('/editor?new=1'))} className="btn-primary w-full"><Plus size={16} /> New résumé</button>
          {online && user ? (
            <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-paper/60 px-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-100 text-[11px] font-bold text-accent-800 dark:bg-accent-600/20 dark:text-accent-200">{initials(user.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
                <p className="truncate text-[11px] text-muted">{user.email}</p>
              </div>
              <button onClick={signOut} className="btn-ghost !p-1.5" aria-label="Sign out"><LogOut size={14} /></button>
            </div>
          ) : (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-paper/60 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
              <CloudOff size={14} className="mt-0.5 shrink-0" />
              <span>Offline mode. Drafts stay in this browser.</span>
            </div>
          )}
        </div>
      </aside>

      <div className="no-print sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-3">
          <Logo compact />
          <div className="flex items-center gap-0.5">
            <nav className="flex items-center" aria-label="Mobile">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} aria-label={n.label} className={({ isActive }) => `rounded-lg p-2 transition-colors duration-150 ${isActive ? ACTIVE : 'text-muted hover:text-ink'}`}>
                  <n.icon size={18} />
                </NavLink>
              ))}
            </nav>
            <ThemeToggle />
            {online && user && (
              <div className="relative">
                <button onClick={() => setAccountOpen((v) => !v)} className="btn-ghost !p-1.5" aria-label="Account menu" aria-expanded={accountOpen}>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-100 text-[10px] font-bold text-accent-800 dark:bg-accent-600/20 dark:text-accent-200">{initials(user.name)}</span>
                </button>
                {accountOpen && (
                  <div className="card absolute right-0 top-full z-50 mt-2 w-60 p-3">
                    <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-[11px] text-muted">{user.email}</p>
                    <button onClick={signOut} className="btn-secondary mt-3 w-full !py-2 !text-xs"><LogOut size={13} /> Sign out</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
