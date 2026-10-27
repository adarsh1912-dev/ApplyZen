import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Pencil, Plus, Search, X } from 'lucide-react';
import { AppShell } from '../components/layout/Chrome';
import { useToast } from '../components/ui/Toast';
import { STATUSES } from '../lib/store';
import { listApplications, createApplication, patchApplication, deleteApplication } from '../lib/data';

const STATUS_STYLES = {
  Saved: 'border-line bg-soft text-ink',
  Applied: 'border-accent-200 bg-accent-50 text-accent-800 dark:border-accent-600/30 dark:bg-accent-600/15 dark:text-accent-200',
  Assessment: 'border-warning/25 bg-warning/10 text-warning',
  Interview: 'border-accent-300 bg-accent-100 text-accent-900 dark:border-accent-600/40 dark:bg-accent-600/20 dark:text-accent-100',
  Offer: 'border-accent-600 bg-accent-50 text-accent-800 dark:border-accent-500 dark:bg-accent-600/20 dark:text-accent-200',
  Rejected: 'border-danger/20 bg-danger/10 text-danger',
};

export default function Tracker() {
  const { push } = useToast();
  const [apps, setApps] = useState(null);
  const [q, setQ] = useState('');
  const [f, setF] = useState('All');
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    let on = true;
    listApplications()
      .then((items) => { if (on) setApps(items); })
      .catch((e) => { if (on) push('Could not load applications: ' + (e.message || 'unknown error'), 'error'); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => (apps ?? []).filter((a) =>
    (f === 'All' || a.status === f) &&
    (a.company + ' ' + a.title).toLowerCase().includes(q.toLowerCase())
  ), [apps, q, f]);

  const save = async (draft) => {
    if (!draft.company.trim() || !draft.title.trim()) {
      push('Company and job title are required.', 'error');
      return;
    }
    try {
      if (dialog.mode === 'add') {
        const a = await createApplication(draft);
        setApps((l) => [a, ...(l ?? [])]);
        push('Application added.');
      } else {
        const a = await patchApplication(draft.id, draft);
        setApps((l) => (l ?? []).map((x) => x.id === a.id ? a : x));
        push('Application updated.');
      }
      setDialog(null);
    } catch (e) {
      push(e.message || 'Could not save the application.', 'error');
    }
  };

  const changeStatus = async (a, status) => {
    setApps((l) => (l ?? []).map((x) => x.id === a.id ? { ...x, status } : x));
    try {
      await patchApplication(a.id, { ...a, status });
      push(`“${a.company}” moved to ${status}.`);
    } catch (e) {
      setApps((l) => (l ?? []).map((x) => x.id === a.id ? { ...x, status: a.status } : x));
      push(e.message || 'Could not update the status.', 'error');
    }
  };

  const remove = async (a) => {
    try {
      await deleteApplication(a.id);
      setApps((l) => (l ?? []).filter((x) => x.id !== a.id));
      push('Application removed.');
    } catch (e) {
      push(e.message || 'Could not remove the application.', 'error');
    }
  };

  const addDialog = () => setDialog({
    mode: 'add',
    draft: { company: '', title: '', date: new Date().toISOString().slice(0, 10), status: 'Saved', notes: '' },
  });

  const count = apps?.length ?? 0;
  const lateStage = (apps ?? []).filter((a) => a.status === 'Interview' || a.status === 'Offer').length;

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title">Application tracker</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Applications</h1>
          <p className="mt-2 text-sm text-muted">{count} tracked · {lateStage} in late stages</p>
        </div>
        <button onClick={addDialog} className="btn-primary"><Plus size={16} /> Add application</button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company or role…" className="input !pl-9" aria-label="Search applications" />
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="group" aria-label="Filter by status">
          {['All', ...STATUSES].map((status) => (
            <button
              key={status}
              onClick={() => setF(status)}
              aria-pressed={f === status}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 ${f === status ? 'border-accent-600 bg-accent-600 text-accent-foreground' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {apps === null && (
        <div className="card mt-5 divide-y divide-line/70 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-4 w-20" />
              <div className="skeleton ml-auto h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {apps !== null && filtered.length === 0 && (
        <div className="card mt-5 p-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-600/15 dark:text-accent-200">
            <Briefcase size={22} />
          </span>
          <p className="mt-4 text-lg font-semibold tracking-tight text-ink">{apps.length === 0 ? 'Nothing tracked yet' : 'No matches'}</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted">
            {apps.length === 0 ? 'Log your first application — company, role, date, and status. The dashboard will keep the pipeline in view.' : 'Try a different search or status filter.'}
          </p>
          {apps.length === 0 && <button onClick={addDialog} className="btn-primary mx-auto mt-5">Add application</button>}
        </div>
      )}

      {filtered.length > 0 && (
        <>
          <div className="card mt-5 hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-soft/60 text-[10px] uppercase tracking-[0.12em] text-muted">
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-line/60 last:border-0 hover:bg-soft/40">
                    <td className="px-4 py-3 font-semibold text-ink">{a.company}</td>
                    <td className="px-4 py-3 text-ink">{a.title}</td>
                    <td className="px-4 py-3 text-muted">{a.date || '—'}</td>
                    <td className="px-4 py-3"><StatusSelect value={a.status} onChange={(status) => changeStatus(a, status)} /></td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted">{a.notes || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDialog({ mode: 'edit', draft: { ...a } })} className="btn-ghost !p-1.5" aria-label={`Edit ${a.company}`}><Pencil size={15} /></button>
                      <button onClick={() => remove(a)} className="btn-ghost !p-1.5 hover:!text-danger" aria-label={`Remove ${a.company}`}><X size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-5 space-y-2.5 md:hidden">
            {filtered.map((a) => (
              <li key={a.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{a.company}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-muted">{a.title} · {a.date || '—'}</p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button onClick={() => setDialog({ mode: 'edit', draft: { ...a } })} className="btn-ghost !p-1.5" aria-label={`Edit ${a.company}`}><Pencil size={14} /></button>
                    <button onClick={() => remove(a)} className="btn-ghost !p-1.5 hover:!text-danger" aria-label={`Remove ${a.company}`}><X size={14} /></button>
                  </div>
                </div>
                {a.notes && <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted">{a.notes}</p>}
                <div className="mt-3"><StatusSelect value={a.status} onChange={(status) => changeStatus(a, status)} /></div>
              </li>
            ))}
          </ul>
        </>
      )}

      {dialog && <AppDialog dialog={dialog} setDialog={setDialog} onSave={save} />}
    </AppShell>
  );
}

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Application status"
      className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[value] ?? STATUS_STYLES.Saved}`}
    >
      {STATUSES.map((status) => <option key={status}>{status}</option>)}
    </select>
  );
}

function AppDialog({ dialog, setDialog, onSave }) {
  const [d, setD] = useState(dialog.draft);
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setD((prev) => ({ ...prev, [key]: value }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dialog.mode === 'add' ? 'Add application' : 'Edit application'}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => setDialog(null)}
    >
      <form
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await onSave(d);
          setBusy(false);
        }}
      >
        <h2 className="text-lg font-semibold tracking-tight text-ink">{dialog.mode === 'add' ? 'Add application' : 'Edit application'}</h2>
        <p className="mt-1 text-[12.5px] text-muted">Keep the next action visible. Only company and role are required.</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="c">Company *</label><input id="c" className="input" value={d.company} onChange={(e) => set('company', e.target.value)} required placeholder="Acme Corp" autoFocus /></div>
          <div><label className="label" htmlFor="t">Job title *</label><input id="t" className="input" value={d.title} onChange={(e) => set('title', e.target.value)} required placeholder="Frontend Engineer" /></div>
          <div><label className="label" htmlFor="dt">Date</label><input id="dt" type="date" className="input" value={d.date} onChange={(e) => set('date', e.target.value)} /></div>
          <div><label className="label" htmlFor="st">Status</label><select id="st" className="input" value={d.status} onChange={(e) => set('status', e.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
          <div className="col-span-2"><label className="label" htmlFor="n">Notes</label><textarea id="n" className="input" rows={2} value={d.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Referral, round notes…" /></div>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary flex-1">{busy ? 'Saving…' : dialog.mode === 'add' ? 'Add' : 'Save changes'}</button>
          <button type="button" onClick={() => setDialog(null)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
