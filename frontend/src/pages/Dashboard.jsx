import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, FileText, ArrowRight, Trash2, Copy, Clock, Briefcase,
  LayoutTemplate, ScanSearch,
} from 'lucide-react';
import { AppShell } from '../components/layout/Chrome';
import { useToast } from '../components/ui/Toast';
import { setActiveId, fmtDate, TEMPLATES } from '../lib/store';
import {
  listResumes, createResume, deleteResume, duplicateResume,
  applicationStats, listApplications, analysisCount,
} from '../lib/data';

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="section-title">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-50 text-accent-700 dark:bg-accent-600/15 dark:text-accent-200">
          <Icon size={15} strokeWidth={2.1} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted">{hint}</p>
    </div>
  );
}

function templateName(id) {
  return TEMPLATES.find((t) => t.id === id)?.name ?? id;
}

export default function Dashboard() {
  const nav = useNavigate();
  const { push } = useToast();
  const [resumes, setResumes] = useState(null);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [analyses, setAnalyses] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let on = true;
    Promise.all([listResumes(), applicationStats(), listApplications({ perPage: 3 }), analysisCount()])
      .then(([rs, st, rec, count]) => {
        if (!on) return;
        setResumes(rs);
        setStats(st);
        setRecent(rec);
        setAnalyses(count);
      })
      .catch((e) => {
        if (!on) return;
        setError(e.message || 'unknown error');
        push('Could not load your data: ' + (e.message || 'unknown error'), 'error');
      });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (fn) => { try { await fn(); } catch (e) { push(e.message || 'Something went wrong.', 'error'); } };

  const create = () => run(async () => {
    const r = await createResume({ title: `Resume ${(resumes?.length ?? 0) + 1}` });
    setActiveId(r.id);
    push('New resume created.');
    nav('/editor');
  });
  const remove = (id) => run(async () => {
    await deleteResume(id);
    setResumes((rs) => rs.filter((r) => r.id !== id));
    push('Resume deleted.');
  });
  const dup = (r) => run(async () => {
    const c = await duplicateResume(r.id);
    if (c) setResumes((rs) => [c, ...rs]);
    push('Resume duplicated.');
  });
  const open = (id) => { setActiveId(id); nav('/editor'); };

  const countOf = (status) => stats?.by_status?.[status] ?? 0;

  return (
    <AppShell onNew={create}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title">Workspace</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Good to see you.</h1>
          <p className="mt-2 text-sm text-muted">Pick up where you left off, or start something new.</p>
        </div>
        <button onClick={create} className="btn-primary"><Plus size={16} /> New resume</button>
      </div>

      {resumes === null && !error && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[132px]" />)}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => <div key={i} className="skeleton h-[160px]" />)}
          </div>
        </>
      )}

      {resumes === null && error && (
        <div className="card mt-6 p-8 text-center">
          <p className="text-lg font-semibold text-ink">We couldn't load your workspace.</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-secondary mt-4">Try again</button>
        </div>
      )}

      {resumes !== null && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={FileText} label="Resumes" value={resumes.length} hint="Drafts and tailored versions" />
            <StatCard icon={Briefcase} label="Applications" value={stats?.total ?? 0} hint={`${countOf('Interview')} interview · ${countOf('Offer')} offer`} />
            <StatCard icon={LayoutTemplate} label="Templates" value={TEMPLATES.length} hint="ATS-conscious layouts" />
            <StatCard icon={ScanSearch} label="Analyses" value={analyses} hint="Job matches saved" />
          </div>

          {resumes.length === 0 ? (
            <div className="card mt-6 p-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-600/15 dark:text-accent-200">
                <FileText size={22} />
              </span>
              <p className="mt-4 text-lg font-semibold tracking-tight text-ink">Start with one honest page.</p>
              <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted">
                Create your first resume. It autosaves as you type, and every save gives you a version to return to.
              </p>
              <button onClick={create} className="btn-primary mx-auto mt-5">Create my first resume</button>
            </div>
          ) : (
            <section className="mt-8" aria-label="Recent resumes">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-title">Recent resumes</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">Your documents</h2>
                </div>
                <Link to="/templates" className="btn-ghost hidden sm:inline-flex">Browse templates <ArrowRight size={14} /></Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {resumes.map((r) => (
                  <article key={r.id} className="card card-hover group p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold tracking-tight text-ink">{r.title}</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted"><Clock size={12} /> Updated {fmtDate(r.updatedAt)}</p>
                        <span className="chip mt-2 !text-[10px]">{templateName(r.template)}</span>
                      </div>
                      <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <button onClick={() => dup(r)} className="btn-ghost" aria-label={`Duplicate ${r.title}`}><Copy size={15} /></button>
                        <button onClick={() => remove(r.id)} className="btn-ghost hover:!text-danger" aria-label={`Delete ${r.title}`}><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <button onClick={() => open(r.id)} className="btn-secondary mt-4 w-full !py-2 text-[12.5px]">
                      Open in editor <ArrowRight size={14} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <section className="card p-5" aria-label="Applications summary">
              <div className="flex items-center justify-between gap-3">
                <p className="section-title">Applications</p>
                <Link to="/tracker" className="btn-ghost !text-[12px]">Open tracker</Link>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[['Applied', countOf('Applied')], ['Interview', countOf('Interview')], ['Offer', countOf('Offer')]].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-line bg-paper/50 py-3">
                    <p className="text-xl font-semibold tabular-nums text-ink">{value}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-muted">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted">{stats?.total ?? 0} total · {countOf('Saved')} saved</p>
            </section>

            <section className="card p-5" aria-label="Recent activity">
              <div className="flex items-center justify-between gap-3">
                <p className="section-title">Recent activity</p>
                <Link to="/analyzer" className="btn-ghost !text-[12px]">Analyze a job</Link>
              </div>
              <ul className="mt-3 space-y-2.5">
                {recent.map((a) => (
                  <li key={a.id} className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-700 dark:bg-accent-600/15 dark:text-accent-200">
                      <Briefcase size={14} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted">
                      <b className="font-semibold text-ink">{a.company}</b> · {a.title}
                    </span>
                    <span className="shrink-0 text-[10.5px] text-muted">{a.status}</span>
                  </li>
                ))}
                {recent.length === 0 && <li className="text-[13px] text-muted">No applications tracked yet.</li>}
              </ul>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
