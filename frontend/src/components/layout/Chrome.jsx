import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Compass, LayoutDashboard, PenLine, ScanSearch, LayoutTemplate, KanbanSquare, Plus, LogOut } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../lib/auth';
import { useToast } from '../ui/Toast';

const ACTIVE = 'bg-accent-50 text-accent-800 dark:bg-accent-600/20 dark:text-accent-200';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Applyzen home">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-600 text-[15px] font-extrabold text-white">A</span>
      <span className="text-[17px] font-bold tracking-tight text-ink">Applyzen</span>
    </Link>
  );
}

export function MarketingNav() {
  const { user, online } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex" aria-label="Primary">
          <a href="#features" className="transition hover:text-ink">Features</a>
          <a href="#how" className="transition hover:text-ink">How it works</a>
          <Link to="/templates" className="transition hover:text-ink">Templates</Link>
          <a href="#pricing" className="transition hover:text-ink">Pricing</a>
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {online && user ? (
            <Link to="/dashboard" className="btn-secondary !py-2" title={user.email}>{user.name}</Link>
          ) : (
            <Link to="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
          )}
          <Link to="/dashboard" className="btn-primary !py-2">Get started</Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { online } = useAuth();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-4">
        <div><Logo /><p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">Build, tailor, and track job-ready resumes. Prototype with simulated AI — connect your own model later.</p></div>
        <nav aria-label="Product"><p className="section-title mb-3">Product</p><ul className="space-y-2 text-sm font-medium"><li><Link className="hover:text-accent-700" to="/editor">Resume editor</Link></li><li><Link className="hover:text-accent-700" to="/analyzer">Job analyzer</Link></li><li><Link className="hover:text-accent-700" to="/templates">Templates</Link></li><li><Link className="hover:text-accent-700" to="/tracker">Application tracker</Link></li></ul></nav>
        <nav aria-label="Resources"><p className="section-title mb-3">Resources</p><ul className="space-y-2 text-sm font-medium"><li><a href="#how" className="hover:text-accent-700">How it works</a></li><li><a href="#pricing" className="hover:text-accent-700">Pricing</a></li><li><Link className="hover:text-accent-700" to="/dashboard">Dashboard</Link></li></ul></nav>
        <div><p className="section-title mb-3">Note</p><p className="text-sm leading-relaxed text-muted">{online ? 'Match estimates are text-based heuristics, not hiring probabilities. Your resumes, analyses, and applications are stored with your account.' : 'Match estimates are text-based heuristics, not hiring probabilities. Your data stays in your browser (localStorage) in offline mode.'}</p></div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">© 2026 Applyzen. Built for job seekers.</div>
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

export function AppShell({ children, onNew }) {
  const nav = useNavigate();
  const { user, online, logout } = useAuth();
  const { push } = useToast();
  const signOut = async () => { await logout(); push('Signed out. Local drafts remain in this browser.'); nav('/'); };
  return (
    <div className="min-h-screen bg-paper">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface lg:flex" aria-label="App navigation">
        <div className="flex h-16 items-center justify-between border-b border-line px-4"><Logo /><ThemeToggle /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? ACTIVE : 'text-muted hover:bg-ink/5 hover:text-ink'}`}>
              <n.icon size={17} strokeWidth={2.2} />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <button onClick={onNew ?? (() => nav('/editor?new=1'))} className="btn-primary w-full"><Plus size={16} /> New resume</button>
          {online && user ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-soft px-3 py-2">
              <span className="truncate text-xs font-semibold" title={user.email}>{user.email}</span>
              <button onClick={signOut} className="btn-ghost !p-1.5" aria-label="Sign out"><LogOut size={14} /></button>
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 px-1 text-xs text-muted"><Compass size={13} /> Prototype · data in browser</p>
          )}
        </div>
      </aside>
      {/* mobile top bar */}
      <div className="no-print sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4"><Logo />
          <div className="flex items-center gap-0.5">
            <nav className="flex items-center" aria-label="Mobile">
              {NAV.map(n => (
                <NavLink key={n.to} to={n.to} aria-label={n.label} className={({ isActive }) => `rounded-lg p-2 transition ${isActive ? ACTIVE : 'text-muted hover:text-ink'}`}><n.icon size={18} /></NavLink>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </div>
      <main className="lg:pl-60"><div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">{children}</div></main>
    </div>
  );
}
