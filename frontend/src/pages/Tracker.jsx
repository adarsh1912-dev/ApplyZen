import { useMemo, useState, useEffect } from 'react';
import { Search, Plus, Pencil, X } from 'lucide-react';
import { AppShell } from '../components/layout/Chrome';
import { useToast } from '../components/ui/Toast';
import { STATUSES } from '../lib/store';
import { listApplications, createApplication, patchApplication, deleteApplication } from '../lib/data';

const COLORS = { Saved: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-100', Applied: 'bg-blue-50 text-blue-800 border-blue-200', Assessment: 'bg-amber-50 text-amber-800 border-amber-200', Interview: 'bg-violet-50 text-violet-800 border-violet-200', Offer: 'bg-emerald-50 text-emerald-800 border-emerald-200', Rejected: 'bg-red-50 text-red-700 border-red-200' };

export default function Tracker() {
  const { push } = useToast();
  const [apps, setApps] = useState(null);
  const [q, setQ] = useState('');
  const [f, setF] = useState('All');
  const [dialog, setDialog] = useState(null); // null | {mode:'add'|'edit', draft}

  useEffect(() => {
    let on = true;
    listApplications()
      .then((items) => { if (on) setApps(items); })
      .catch((e) => { if (on) push('Could not load applications: ' + (e.message || 'unknown error'), 'error'); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => (apps ?? []).filter(a =>
    (f === 'All' || a.status === f) &&
    (a.company + ' ' + a.title).toLowerCase().includes(q.toLowerCase())
  ), [apps, q, f]);

  const save = async (draft) => {
    if (!draft.company.trim() || !draft.title.trim()) { push('Company and job title are required.', 'error'); return; }
    try {
      if (dialog.mode === 'add') {
        const a = await createApplication(draft);
        setApps((l) => [a, ...l]);
        push('Application added.');
      } else {
        const a = await patchApplication(draft.id, draft);
        setApps((l) => l.map(x => x.id === a.id ? a : x));
        push('Application updated.');
      }
      setDialog(null);
    } catch (e) {
      push(e.message || 'Could not save the application.', 'error');
    }
  };

  const changeStatus = async (a, s) => {
    setApps((l) => l.map(x => x.id === a.id ? { ...x, status: s } : x)); // optimistic
    try {
      await patchApplication(a.id, { ...a, status: s });
      push(`“${a.company}” moved to ${s}.`);
    } catch (e) {
      setApps((l) => l.map(x => x.id === a.id ? { ...x, status: a.status } : x)); // rollback
      push(e.message || 'Could not update the status.', 'error');
    }
  };

  const remove = async (a) => {
    try {
      await deleteApplication(a.id);
      setApps((l) => l.filter(x => x.id !== a.id));
      push('Application removed.');
    } catch (e) {
      push(e.message || 'Could not remove the application.', 'error');
    }
  };

  const addDialog = () => setDialog({ mode: 'add', draft: { company: '', title: '', date: new Date().toISOString().slice(0, 10), status: 'Saved', notes: '' } });

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-[26px] font-extrabold tracking-tight">Applications</h1><p className="text-sm text-muted">{apps?.length ?? 0} tracked · {(apps ?? []).filter(a => a.status === 'Interview' || a.status === 'Offer').length} in late stages</p></div>
        <button onClick={addDialog} className="btn-primary"><Plus size={16} /> Add application</button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search company or role…" className="input !pl-9" aria-label="Search applications" /></label>
        <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="Filter by status">
          {['All', ...STATUSES].map(s => (
            <button key={s} onClick={() => setF(s)} aria-pressed={f === s} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${f === s ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-muted hover:text-ink'}`}>{s}</button>
          ))}
        </div>
      </div>

      {apps === null && <p className="mt-10 text-center text-sm text-muted">Loading…</p>}

      {apps !== null && filtered.length === 0 && (
        <div className="card mt-4 p-10 text-center"><p className="text-lg font-bold">{apps.length === 0 ? 'Nothing tracked yet' : 'No matches'}</p><p className="mx-auto mt-1 max-w-sm text-sm text-muted">{apps.length === 0 ? 'Log your first application — company, role, date, and status.' : 'Try a different search or status filter.'}</p>
          {apps.length === 0 && <button onClick={addDialog} className="btn-primary mx-auto mt-4">Add application</button>}</div>
      )}

      {filtered.length > 0 && (
        <>
          {/* desktop table */}
          <div className="card mt-4 hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-line bg-soft text-xs uppercase tracking-wide text-muted"><th className="px-4 py-3 font-semibold">Company</th><th className="px-4 py-3 font-semibold">Role</th><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Notes</th><th className="px-4 py-3 text-right font-semibold">Actions</th></tr></thead>
              <tbody>{filtered.map(a => (
                <tr key={a.id} className="border-b border-line/60 last:border-0 hover:bg-soft/60">
                  <td className="px-4 py-3 font-bold">{a.company}</td><td className="px-4 py-3">{a.title}</td><td className="px-4 py-3 text-muted">{a.date || '—'}</td>
                  <td className="px-4 py-3"><StatusSelect value={a.status} onChange={(s) => changeStatus(a, s)} /></td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-muted">{a.notes || '—'}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setDialog({ mode: 'edit', draft: { ...a } })} className="btn-ghost" aria-label={`Edit ${a.company}`}><Pencil size={15} /></button>
                    <button onClick={() => remove(a)} className="btn-ghost hover:!text-red-700" aria-label={`Remove ${a.company}`}><X size={15} /></button></td>
                </tr>))}</tbody>
            </table>
          </div>
          {/* mobile list */}
          <ul className="mt-4 space-y-2 md:hidden">{filtered.map(a => (
            <li key={a.id} className="card p-4">
              <div className="flex items-start justify-between"><div><p className="font-bold">{a.company}</p><p className="text-sm text-muted">{a.title} · {a.date || '—'}</p></div>
                <button onClick={() => setDialog({ mode: 'edit', draft: { ...a } })} className="btn-ghost" aria-label={`Edit ${a.company}`}><Pencil size={15} /></button></div>
              <div className="mt-2"><StatusSelect value={a.status} onChange={(s) => changeStatus(a, s)} /></div>
            </li>))}</ul>
        </>
      )}

      {dialog && <AppDialog dialog={dialog} setDialog={setDialog} onSave={save} />}
    </AppShell>
  );
}

function StatusSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} aria-label="Application status" className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold ${COLORS[value]}`}>
      {STATUSES.map(s => <option key={s}>{s}</option>)}
    </select>
  );
}

function AppDialog({ dialog, setDialog, onSave }) {
  const [d, setD] = useState(dialog.draft);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));
  return (
    <div role="dialog" aria-modal="true" aria-label={dialog.mode === 'add' ? 'Add application' : 'Edit application'} className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setDialog(null)}>
      <form className="card w-full max-w-md p-6" onClick={e => e.stopPropagation()} onSubmit={async (e) => { e.preventDefault(); setBusy(true); await onSave(d); setBusy(false); }}>
        <h2 className="text-lg font-extrabold">{dialog.mode === 'add' ? 'Add application' : 'Edit application'}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="c">Company *</label><input id="c" className="input" value={d.company} onChange={e => set('company', e.target.value)} required placeholder="Acme Corp" /></div>
          <div><label className="label" htmlFor="t">Job title *</label><input id="t" className="input" value={d.title} onChange={e => set('title', e.target.value)} required placeholder="Frontend Engineer" /></div>
          <div><label className="label" htmlFor="dt">Date</label><input id="dt" type="date" className="input" value={d.date} onChange={e => set('date', e.target.value)} /></div>
          <div><label className="label" htmlFor="st">Status</label><select id="st" className="input" value={d.status} onChange={e => set('status', e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="col-span-2"><label className="label" htmlFor="n">Notes</label><textarea id="n" className="input" rows={2} value={d.notes} onChange={e => set('notes', e.target.value)} placeholder="Referral, round notes…" /></div>
        </div>
        <div className="mt-5 flex gap-2"><button type="submit" disabled={busy} className="btn-primary flex-1">{busy ? 'Saving…' : dialog.mode === 'add' ? 'Add' : 'Save changes'}</button><button type="button" onClick={() => setDialog(null)} className="btn-secondary">Cancel</button></div>
      </form>
    </div>
  );
}
