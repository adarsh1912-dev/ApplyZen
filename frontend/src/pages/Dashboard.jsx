import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, ArrowRight, Trash2, Copy, Clock, Briefcase } from 'lucide-react';
import { AppShell } from '../components/layout/Chrome';
import { useToast } from '../components/ui/Toast';
import { setActiveId, fmtDate } from '../lib/store';
import { listResumes, createResume, deleteResume, duplicateResume, applicationStats, listApplications } from '../lib/data';

export default function Dashboard() {
  const nav = useNavigate();
  const { push } = useToast();
  const [resumes, setResumes] = useState(null);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let on = true;
    Promise.all([listResumes(), applicationStats(), listApplications({ perPage: 3 })])
      .then(([rs, st, rec]) => { if (!on) return; setResumes(rs); setStats(st); setRecent(rec); })
      .catch((e) => { if (on) push('Could not load your data: ' + (e.message || 'unknown error'), 'error'); });
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
    setResumes((rs) => rs.filter(r => r.id !== id));
    push('Resume deleted.');
  });
  const dup = (r) => run(async () => {
    const c = await duplicateResume(r.id);
    if (c) setResumes((rs) => [c, ...rs]);
    push('Resume duplicated.');
  });
  const open = (id) => { setActiveId(id); nav('/editor'); };

  const countOf = (s) => stats?.by_status?.[s] ?? 0;

  return (
    <AppShell onNew={create}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-[26px] font-extrabold tracking-tight">Good to see you.</h1><p className="text-sm text-muted">Pick up where you left off, or start something new.</p></div>
        <button onClick={create} className="btn-primary"><Plus size={16} /> New resume</button>
      </div>

      {resumes === null && <p className="mt-10 text-center text-sm text-muted">Loading…</p>}

      {resumes?.length === 0 && (
        <div className="card mt-6 p-10 text-center">
          <FileText className="mx-auto text-stone-300" size={40} />
          <p className="mt-3 text-lg font-bold">No resumes yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Create your first resume — it autosaves as you type.</p>
          <button onClick={create} className="btn-primary mx-auto mt-5">Create my first resume</button>
        </div>
      )}

      {resumes?.length > 0 && (
        <section className="mt-6" aria-label="Recent resumes">
          <h2 className="section-title mb-3">Recent resumes</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {resumes.map(r => (
              <article key={r.id} className="card group p-5 transition hover:shadow-doc">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-[15px] font-bold leading-snug">{r.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Clock size={12} /> Updated {fmtDate(r.updatedAt)} · {r.template}</p></div>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button onClick={() => dup(r)} className="btn-ghost" aria-label={`Duplicate ${r.title}`}><Copy size={15} /></button>
                    <button onClick={() => remove(r.id)} className="btn-ghost hover:!text-red-700" aria-label={`Delete ${r.title}`}><Trash2 size={15} /></button>
                  </div>
                </div>
                <button onClick={() => open(r.id)} className="btn-secondary mt-4 w-full !py-2 text-[13px]">Open in editor <ArrowRight size={14} /></button>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <section className="card p-5" aria-label="Applications summary">
          <h2 className="section-title mb-3">Applications</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['Applied', countOf('Applied')], ['Interview', countOf('Interview')], ['Offer', countOf('Offer')]].map(([s, n]) => (
              <div key={s} className="rounded-lg bg-soft py-3"><p className="text-xl font-extrabold">{n}</p><p className="text-xs font-medium text-muted">{s}</p></div>
            ))}
          </div>
          <Link to="/tracker" className="btn-ghost mt-3">Open tracker <ArrowRight size={14} /></Link>
        </section>
        <section className="card p-5" aria-label="Recent activity">
          <h2 className="section-title mb-3">Recent activity</h2>
          <ul className="space-y-2.5 text-sm">
            {recent.map(a => (
              <li key={a.id} className="flex items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-700 dark:bg-accent-600/20 dark:text-accent-200"><Briefcase size={15} /></span>
                <span><b>{a.company}</b> · {a.title} <span className="text-muted">— {a.status}</span></span></li>
            ))}
            {recent.length === 0 && <li className="text-muted">No applications tracked yet.</li>}
          </ul>
          <Link to="/analyzer" className="btn-ghost mt-3">Analyze a job description <ArrowRight size={14} /></Link>
        </section>
      </div>
    </AppShell>
  );
}
