import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Save, Printer, Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Plus, Sparkles, Check, X, Pencil, ZoomIn, ZoomOut, ChevronLeft, FileEdit, MonitorSmartphone } from 'lucide-react';
import { AppShell } from '../components/layout/Chrome';
import ResumePreview, { ZOOM_MIN, ZOOM_MAX } from '../components/resume/ResumePreview';
import { useToast } from '../components/ui/Toast';
import { getActiveId, setActiveId, bulletSuggestions, improveBullet, exportPdf, TEMPLATES } from '../lib/store';
import { listResumes, getResume, createResume, saveResumeFull, snapshotResume, isOnline } from '../lib/data';
import { ApiError } from '../lib/api';

export default function Editor() {
  const { push } = useToast();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [list, setList] = useState([]);
  const [id, setId] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('edit'); // mobile: edit | preview | ai
  const [zoom, setZoom] = useState(1);
  const [scale, setScale] = useState(1); // effective on-screen scale (fit × zoom)
  const [saved, setSaved] = useState('Saved');
  const saveTimer = useRef(null);
  const booted = useRef(false);

  // Boot once: load the resume list and decide which resume to open.
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      const items = await listResumes();
      setList(items);
      const qNew = params.get('new');
      const qId = params.get('id');
      const active = getActiveId();
      let target = qId ?? (items.some((r) => r.id === active) ? active : null) ?? items[0]?.id ?? null;
      if (qNew || !target) {
        const r = await createResume({ title: `Resume ${items.length + 1}` });
        setList((prev) => [r, ...prev]);
        target = r.id;
        nav(`/editor?id=${r.id}`, { replace: true });
      }
      setId(target);
    })().catch((e) => {
      setLoading(false);
      push('Could not open the editor: ' + (e.message || 'unknown error'), 'error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the full resume whenever the selection changes.
  useEffect(() => {
    if (!id) return;
    let on = true;
    setLoading(true);
    getResume(id)
      .then((r) => {
        if (!on) return;
        if (!r) { push('Resume not found.', 'error'); nav('/dashboard'); return; }
        setResume(r);
        setSaved('Saved');
        setActiveId(id);
        setLoading(false);
      })
      .catch((e) => {
        if (!on) return;
        setLoading(false);
        push('Could not load resume: ' + (e.message || 'unknown error'), 'error');
      });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Flush the pending debounce on unmount.
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const persist = async (snapshot) => {
    try {
      const savedRow = await saveResumeFull(snapshot);
      setResume((prev) => (prev && prev.id === snapshot.id
        ? { ...prev, updatedAt: savedRow.updatedAt, updatedAtIso: savedRow.updatedAtIso }
        : prev));
      setSaved('Saved · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return true;
    } catch (e) {
      setSaved('Not saved');
      push(e instanceof ApiError && e.status === 401
        ? 'Session expired — sign in again to save.'
        : 'Could not save: ' + (e.message || 'unknown error'), 'error');
      return false;
    }
  };

  const update = (patch, msg) => {
    const next = { ...resume, ...patch, updatedAt: Date.now() };
    setResume(next);
    setList((l) => l.map((r) => (r.id === next.id ? { ...r, title: next.title, template: next.template } : r)));
    setSaved('Saving…');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(next), 600);
    if (msg) push(msg);
  };
  const set = (k, v) => update({ [k]: v });

  const saveNow = async () => {
    if (!resume) return;
    clearTimeout(saveTimer.current);
    const ok = await persist(resume);
    if (!ok) return;
    if (isOnline()) {
      try {
        const v = await snapshotResume(resume.id);
        push(v ? `Snapshot v${v.version} saved.` : 'Saved.');
      } catch (e) {
        push('Saved, but the snapshot failed: ' + (e.message || 'unknown error'), 'error');
      }
    } else {
      push('Saved locally.');
    }
  };

  if (!resume) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <p className="text-muted">{loading ? 'Loading…' : 'Could not load this resume.'}</p>
          {!loading && <Link to="/dashboard" className="btn-secondary mt-3">Back to dashboard</Link>}
        </div>
      </AppShell>
    );
  }

  const applySuggestion = (expId, idx, rewrite) => {
    const experience = resume.experience.map(e => e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => i === idx ? rewrite : b) } : e);
    update({ experience }, 'Suggestion applied — you can edit it further.');
  };

  return (
    <AppShell>
      {/* toolbar */}
      <div className="no-print flex flex-wrap items-center gap-2">
        <Link to="/dashboard" className="btn-ghost"><ChevronLeft size={15} /> All resumes</Link>
        <select value={id} onChange={e => setId(e.target.value)} className="input !w-auto max-w-[220px] !py-1.5 text-[13px] font-semibold" aria-label="Active resume">
          {list.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <span className="flex items-center gap-1.5 text-xs text-muted" role="status"><span className={`h-1.5 w-1.5 rounded-full ${saved.startsWith('Saved') ? 'bg-emerald-500' : 'bg-amber-500'}`} />{saved}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <label className="mr-1 hidden text-xs font-medium text-muted sm:block" htmlFor="tpl">Template</label>
          <select id="tpl" value={resume.template} onChange={e => set('template', e.target.value)} className="input !w-auto !py-1.5 text-[13px]">{TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <button onClick={saveNow} className="btn-secondary !px-3 !py-1.5 text-[13px]"><Save size={14} /> Save</button>
          <button onClick={() => { exportPdf(); push('Opened print dialog — choose “Save as PDF”.'); }} className="btn-primary !px-3 !py-1.5 text-[13px]"><Printer size={14} /> Export</button>
        </div>
      </div>

      {/* mobile tabs */}
      <div className="no-print mt-3 grid grid-cols-3 gap-1 rounded-lg border border-line bg-surface p-1 lg:hidden" role="tablist" aria-label="Editor views">
        {[['edit', 'Edit', FileEdit], ['preview', 'Preview', Eye], ['ai', 'AI assist', Sparkles]].map(([k, l, Icon]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-[13px] font-semibold ${tab === k ? 'bg-ink text-paper' : 'text-muted'}`}><Icon size={14} />{l}</button>
        ))}
      </div>

      <div className="editor-grid mt-3 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
        {/* LEFT */}
        <div className={`${tab === 'edit' ? 'block' : 'hidden'} space-y-3 lg:block no-print`}>
          <TitleField resume={resume} set={set} />
          <PersonalForm resume={resume} update={update} />
          <SummaryField resume={resume} set={set} />
          <ExperienceEdit resume={resume} update={update} />
          <SkillsEdit resume={resume} update={update} />
          <EducationEdit resume={resume} update={update} />
          <ProjectsEdit resume={resume} update={update} />
        </div>

        {/* CENTER */}
        <div className={`${tab === 'preview' ? 'block' : 'hidden'} lg:block print:!block`}>
          <div className="no-print mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs text-muted" title="Scroll over the preview to zoom · drag to pan"><MonitorSmartphone size={13} /> A4 · 210 × 297 mm</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(ZOOM_MIN, +(z - .1).toFixed(2)))} className="btn-ghost" aria-label="Zoom out"><ZoomOut size={15} /></button>
              <span className="w-10 text-center text-xs font-semibold" title="On-screen scale — 100% is actual A4 size">{Math.round(scale * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(ZOOM_MAX, +(z + .1).toFixed(2)))} className="btn-ghost" aria-label="Zoom in"><ZoomIn size={15} /></button>
            </div>
          </div>
          <ResumePreview resume={resume} zoom={zoom} onScaleChange={setScale} onZoomChange={setZoom} />
        </div>

        {/* RIGHT — AI */}
        <div className={`${tab === 'ai' ? 'block' : 'hidden'} lg:block no-print`}>
          <AIPanel resume={resume} onApply={applySuggestion} push={push} />
        </div>
      </div>
    </AppShell>
  );
}

/* ---------- left-panel field groups ---------- */
function Group({ title, children, right }) {
  return <section className="card p-4"><div className="mb-3 flex items-center justify-between"><h2 className="section-title">{title}</h2>{right}</div><div className="space-y-2.5">{children}</div></section>;
}
/* field helpers use .input/.label classes inline */

function TitleField({ resume, set }) {
  return <div className="card p-4"><label className="label" htmlFor="rt">Resume title<input id="rt" className="input mt-1" value={resume.title} onChange={e => set('title', e.target.value)} /></label></div>;
}
function PersonalForm({ resume, update }) {
  const p = resume.personal;
  const setP = (k, v) => update({ personal: { ...p, [k]: v } });
  return <Group title="Personal information">
    {[['name', 'Full name'], ['role', 'Professional title'], ['email', 'Email'], ['phone', 'Phone'], ['location', 'Location'], ['website', 'Website'], ['linkedin', 'LinkedIn']].map(([k, l]) => (
      <div key={k}><label className="label" htmlFor={'p_' + k}>{l}</label><input id={'p_' + k} className="input" value={p[k] || ''} onChange={e => setP(k, e.target.value)} type={k === 'email' ? 'email' : 'text'} /></div>
    ))}
  </Group>;
}
function SummaryField({ resume, set }) {
  return <Group title="Professional summary"><label className="sr-only" htmlFor="sum">Professional summary</label>
    <textarea id="sum" rows={4} className="input leading-relaxed" value={resume.summary} onChange={e => set('summary', e.target.value)} placeholder="2–3 lines: years, domain, standout outcome…" maxLength={600} />
    <p className="hint">{resume.summary.length}/600</p></Group>;
}
function ExperienceEdit({ resume, update }) {
  const add = () => update({ experience: [...resume.experience, { id: 'e' + Date.now(), role: '', company: '', dates: '', bullets: [''] }] });
  const mod = (id, patch) => update({ experience: resume.experience.map(e => e.id === id ? { ...e, ...patch } : e) });
  const del = (id) => update({ experience: resume.experience.filter(e => e.id !== id) });
  const move = (i, d) => { const a = [...resume.experience]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; update({ experience: a }); };
  return <Group title={`Work experience (${resume.experience.length})`} right={<button onClick={add} className="btn-ghost text-[13px]"><Plus size={14} /> Add</button>}>
    {resume.experience.length === 0 && <p className="text-[13px] text-muted">No roles yet. Add your most recent first.</p>}
    {resume.experience.map((e, i) => (
      <div key={e.id} className="rounded-lg border border-line p-3">
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Role" placeholder="Role" className="input" value={e.role} onChange={ev => mod(e.id, { role: ev.target.value })} />
          <input aria-label="Company" placeholder="Company" className="input" value={e.company} onChange={ev => mod(e.id, { company: ev.target.value })} />
        </div>
        <input aria-label="Dates" placeholder="2023 — Present" className="input mt-2" value={e.dates} onChange={ev => mod(e.id, { dates: ev.target.value })} />
        {e.bullets.map((b, bi) => (
          <div key={bi} className="mt-2 flex gap-1.5">
            <textarea aria-label={`Bullet ${bi + 1}`} rows={2} className="input flex-1 leading-relaxed" value={b} onChange={ev => mod(e.id, { bullets: e.bullets.map((x, xi) => xi === bi ? ev.target.value : x) })} placeholder="Led X, resulting in Y…" />
            <button onClick={() => mod(e.id, { bullets: e.bullets.filter((_, xi) => xi !== bi) })} className="btn-ghost self-start" aria-label="Remove bullet"><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="mt-2 flex gap-1">
          <button onClick={() => mod(e.id, { bullets: [...e.bullets, ''] })} className="btn-ghost text-xs"><Plus size={13} /> Bullet</button>
          <span className="flex-1" />
          <button onClick={() => move(i, -1)} className="btn-ghost" aria-label="Move up"><ArrowUp size={13} /></button>
          <button onClick={() => move(i, 1)} className="btn-ghost" aria-label="Move down"><ArrowDown size={13} /></button>
          <button onClick={() => del(e.id)} className="btn-ghost hover:!text-red-700" aria-label="Remove role"><Trash2 size={13} /></button>
        </div>
      </div>
    ))}
  </Group>;
}
function SkillsEdit({ resume, update }) {
  const [v, setV] = useState('');
  return <Group title="Skills">
    <div className="flex flex-wrap gap-1.5">{resume.skills.map(s => <span key={s} className="chip">{s}<button onClick={() => update({ skills: resume.skills.filter(x => x !== s) })} aria-label={`Remove ${s}`} className="ml-0.5 text-muted hover:text-red-700"><X size={12} /></button></span>)}
      {resume.skills.length === 0 && <span className="text-[13px] text-muted">None yet.</span>}</div>
    <form className="flex gap-1.5" onSubmit={e => { e.preventDefault(); if (v.trim() && !resume.skills.includes(v.trim())) update({ skills: [...resume.skills, v.trim()] }); setV(''); }}>
      <input value={v} onChange={e => setV(e.target.value)} placeholder="Add a skill…" className="input" aria-label="Add a skill" />
      <button className="btn-secondary !px-3" aria-label="Add skill"><Plus size={15} /></button>
    </form></Group>;
}
function EducationEdit({ resume, update }) {
  return <Group title="Education" right={<button onClick={() => update({ education: [...resume.education, { id: 'd' + Date.now(), school: '', degree: '', dates: '' }] })} className="btn-ghost text-[13px]"><Plus size={14} /> Add</button>}>
    {resume.education.map(e => (
      <div key={e.id} className="space-y-2 rounded-lg border border-line p-3">
        <input aria-label="School" placeholder="School" className="input" value={e.school} onChange={ev => update({ education: resume.education.map(x => x.id === e.id ? { ...x, school: ev.target.value } : x) })} />
        <input aria-label="Degree" placeholder="Degree" className="input" value={e.degree} onChange={ev => update({ education: resume.education.map(x => x.id === e.id ? { ...x, degree: ev.target.value } : x) })} />
        <div className="flex gap-1.5"><input aria-label="Dates" placeholder="2017 — 2021" className="input" value={e.dates} onChange={ev => update({ education: resume.education.map(x => x.id === e.id ? { ...x, dates: ev.target.value } : x) })} />
          <button onClick={() => update({ education: resume.education.filter(x => x.id !== e.id) })} className="btn-ghost" aria-label="Remove education"><Trash2 size={14} /></button></div>
      </div>))}</Group>;
}
function ProjectsEdit({ resume, update }) {
  return <Group title="Projects" right={<button onClick={() => update({ projects: [...(resume.projects || []), { id: 'p' + Date.now(), name: '', detail: '' }] })} className="btn-ghost text-[13px]"><Plus size={14} /> Add</button>}>
    {(resume.projects || []).map(p => (
      <div key={p.id} className="flex gap-1.5"><input aria-label="Project name" placeholder="Name" className="input" value={p.name} onChange={e => update({ projects: resume.projects.map(x => x.id === p.id ? { ...x, name: e.target.value } : x) })} />
        <input aria-label="Project detail" placeholder="One-line outcome" className="input flex-[2]" value={p.detail} onChange={e => update({ projects: resume.projects.map(x => x.id === p.id ? { ...x, detail: e.target.value } : x) })} />
        <button onClick={() => update({ projects: resume.projects.filter(x => x.id !== p.id) })} className="btn-ghost" aria-label="Remove project"><Trash2 size={14} /></button></div>))}</Group>;
}

/* ---------- AI panel ---------- */
function AIPanel({ resume, onApply, push }) {
  const [editing, setEditing] = useState(null);
  const bullets = resume.experience.flatMap(e => e.bullets.map((b, i) => ({ expId: e.id, role: e.role, idx: i, text: b }))).filter(b => b.text.trim());
  return (
    <div className="space-y-3 lg:sticky lg:top-6">
      <section className="card p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-extrabold"><Sparkles size={15} className="text-accent-600" /> Writing assistant</h2>
        <p className="hint">Simulated suggestions — deterministic checks, no model call. Your facts are never invented.</p>
      </section>
      {bullets.length === 0 && <div className="card p-5 text-sm text-muted">Add a work bullet in the left panel to get suggestions here.</div>}
      {bullets.map((b, k) => {
        const suggs = bulletSuggestions(b.text);
        return (
          <section key={k} className="card p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{b.role || 'Role'} · bullet {b.idx + 1}</p>
            <p className="mt-1 text-[13px] leading-relaxed">“{b.text}”</p>
            {suggs.map((s, si) => {
              const rewrite = s.rewrite || improveBullet(b.text);
              const key = k + '-' + si;
              return (
                <div key={si} className="mt-2 rounded-lg border border-line bg-soft p-2.5">
                  <p className="text-xs font-bold text-accent-800">{s.kind} <span className="font-normal text-muted">· simulated</span></p>
                  <p className="mt-0.5 text-[13px] text-muted">{s.text}</p>
                  <p className="mt-1.5 rounded-md bg-surface p-2 text-[13px] leading-relaxed">✦ {editing === key ? '' : rewrite}</p>
                  {editing === key
                    ? <EditBox initial={rewrite} onSave={(v) => { onApply(b.expId, b.idx, v); setEditing(null); }} onCancel={() => setEditing(null)} />
                    : <div className="mt-2 flex gap-1.5">
                      <button onClick={() => onApply(b.expId, b.idx, rewrite)} className="btn-secondary flex-1 !py-1.5 !text-xs"><Check size={13} /> Accept</button>
                      <button onClick={() => setEditing(key)} className="btn-ghost !text-xs"><Pencil size={12} /> Edit</button>
                    </div>}
                </div>
              );
            })}
          </section>
        );
      })}
      <section className="card p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-bold"><Eye size={14} /> Visibility</h3>
        <div className="mt-2 space-y-1.5">{['summary', 'experience', 'projects', 'skills', 'education'].map(s => (
          <label key={s} className="flex cursor-pointer items-center justify-between text-[13px] font-medium capitalize">{s}
            <button role="switch" aria-checked={resume.visible?.[s] !== false} aria-label={`Toggle ${s}`} onClick={() => push('Section visibility is noted; preview respects core sections in this prototype.')}>{resume.visible?.[s] !== false ? <Eye size={15} className="text-emerald-600" /> : <EyeOff size={15} className="text-stone-400" />}</button>
          </label>))}</div>
      </section>
    </div>
  );
}
function EditBox({ initial, onSave, onCancel }) {
  const [v, setV] = useState(initial);
  return <div className="mt-2"><textarea rows={3} value={v} onChange={e => setV(e.target.value)} className="input text-[13px]" aria-label="Edit suggestion" />
    <div className="mt-1.5 flex gap-1.5"><button onClick={() => onSave(v)} className="btn-primary flex-1 !py-1.5 !text-xs">Apply edit</button><button onClick={onCancel} className="btn-secondary !py-1.5 !text-xs">Cancel</button></div></div>;
}
