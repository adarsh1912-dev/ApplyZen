import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanSearch, Info, CheckCircle2, AlertTriangle, Lightbulb, Wand2, ArrowRight, X, Upload } from 'lucide-react';
import { AppShell } from '../components/layout/Chrome';
import { useToast } from '../components/ui/Toast';
import { getActiveId, setActiveId } from '../lib/store';
import { listResumes, runAnalysis, tailorResume, applyTailoredResume, importResumeFromFile, isOnline } from '../lib/data';
import ResumePreview from '../components/resume/ResumePreview';

const MIN_JD = 50; // the API requires at least 50 characters

const SAMPLE_JD = `Senior Frontend Engineer — Fintech, Bengaluru (Hybrid)

We’re hiring a senior frontend engineer for our payments dashboard.

Required:
- 3+ years with React, JavaScript/TypeScript
- State management and testing (Jest / React Testing Library)
- Git workflow, code review, Agile delivery
- Strong communication with product and design

Preferred:
- Node.js, SQL for internal tooling
- AWS or Docker deployment experience
- Data analysis for product decisions`;

const FALLBACK_ACTIONS = [
  'Add one bullet per missing skill — only where you genuinely have experience. Never invent qualifications.',
  'Mirror the posting’s vocabulary (e.g. “React Testing Library” not just “testing”).',
  'Re-run after editing the resume in the editor.',
];

export default function Analyzer() {
  const { push } = useToast();
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState(null);
  const [jd, setJd] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [tailored, setTailored] = useState(null);   // { content, changes, warnings, model }
  const [applying, setApplying] = useState(null);   // null | 'apply' | 'copy'
  const [applied, setApplied] = useState(null);     // { id, asCopy }

  useEffect(() => {
    let on = true;
    listResumes()
      .then((rs) => {
        if (!on) return;
        setResumes(rs);
        const active = getActiveId();
        setResumeId(rs.some(r => r.id === active) ? active : (rs[0]?.id ?? null));
      })
      .catch((e) => { if (on) push('Could not load resumes: ' + (e.message || 'unknown error'), 'error'); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Any input change invalidates the analysis and everything derived from it. */
  const clearOutcome = () => { setResult(null); setTailored(null); setApplied(null); };

  const analyze = async (rid = resumeId) => {
    setBusy(true);
    setTailored(null);
    setApplied(null);
    try {
      setResult(await runAnalysis({ resumeId: rid, jobDescription: jd }));
    } catch (e) {
      push(e.message || 'Could not run the analysis.', 'error');
    } finally {
      setBusy(false);
    }
  };

  /** Pick a local file → server extracts + AI-structures it → new résumé. */
  const onFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;
    setImporting(true);
    try {
      const { resume: imported, warnings } = await importResumeFromFile(file);
      setResumes(await listResumes());
      setResumeId(imported.id);
      clearOutcome();
      const note = warnings.length ? ` ${warnings.length} note${warnings.length === 1 ? '' : 's'} to check in the editor.` : '';
      push(`Imported “${imported.title}”.${note}`);
      if (jd.trim().length >= MIN_JD) analyze(imported.id);
    } catch (err) {
      push(err.message || 'Could not import that file.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const autoconfigure = async () => {
    setTailoring(true);
    try {
      setTailored(await tailorResume({ resumeId, jobDescription: jd }));
    } catch (e) {
      push(e.message || 'Could not autoconfigure this resume.', 'error');
    } finally {
      setTailoring(false);
    }
  };

  const apply = async (asCopy) => {
    setApplying(asCopy ? 'copy' : 'apply');
    try {
      const saved = await applyTailoredResume({ resumeId, content: tailored.content, asCopy });
      setTailored(null);
      setApplied({ id: saved.id, asCopy });
      push(asCopy ? 'Saved as a new tailored copy.' : 'Résumé updated with the tailored content.');
      if (asCopy) listResumes().then(setResumes).catch(() => {});
    } catch (e) {
      push(e.message || 'Could not save the tailored resume.', 'error');
    } finally {
      setApplying(null);
    }
  };

  const openEditor = () => { setActiveId(applied.id); nav('/editor'); };

  const ready = jd.trim().length >= MIN_JD && Boolean(resumeId) && !busy;
  const actions = result?.recommendations?.length ? result.recommendations : FALLBACK_ACTIONS;
  const selected = resumes.find(r => r.id === resumeId);

  return (
    <AppShell>
      <h1 className="text-[26px] font-extrabold tracking-tight">Job description analyzer</h1>
      <p className="mt-1 max-w-[64ch] text-sm text-muted">Paste a posting, pick a resume, and see where the texts overlap. Estimates are heuristic — not hiring probabilities.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="card p-5">
          <label className="label" htmlFor="resume">Resume to compare</label>
          <select id="resume" className="input" value={resumeId ?? ''} onChange={e => { setResumeId(e.target.value); clearOutcome(); }}>
            {resumes.length === 0 && <option value="">No resumes yet</option>}
            {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          {isOnline() && (
            <div className="mt-2">
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={onFilePicked} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={importing} className="btn-secondary w-full">
                <Upload size={15} /> {importing ? 'Reading and structuring…' : 'Import résumé from file'}
              </button>
              <p className="hint">PDF, DOCX, TXT or MD · up to 5 MB · stored as a new résumé in your account.</p>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <label className="label mb-0" htmlFor="jd">Job description</label>
            <button onClick={() => { setJd(SAMPLE_JD); clearOutcome(); }} className="btn-ghost text-[13px]">Load sample posting</button>
          </div>
          <textarea id="jd" rows={14} value={jd} onChange={e => { setJd(e.target.value); clearOutcome(); }} placeholder="Paste the full job description here…" className="input mt-1 font-mono !text-[13px] leading-relaxed" />
          <p className="hint">{jd.length} characters · minimum {MIN_JD}</p>
          <button disabled={!ready} onClick={() => analyze()} className="btn-primary mt-3 w-full"><ScanSearch size={16} /> {busy ? 'Analyzing…' : 'Analyze compatibility'}</button>
        </div>

        <div>
          {!result && <div className="card grid h-full min-h-[300px] place-items-center p-10 text-center"><div><ScanSearch className="mx-auto text-stone-300" size={36} /><p className="mt-2 font-bold">No analysis yet</p><p className="mx-auto mt-1 max-w-sm text-sm text-muted">Paste a job description and run the analysis. {isOnline() ? 'It is analysed on your API and saved to your account.' : 'Nothing leaves your browser.'}</p></div></div>}
          {result && (
            <div className="space-y-3">
              <div className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="section-title">Compatibility estimate</p><p className="mt-1 text-2xl font-extrabold tracking-tight">{result.coverage}% <span className="text-sm font-semibold text-muted">· {result.band}</span></p></div>
                  <div className="h-2.5 w-full max-w-[220px] overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuenow={result.coverage} aria-valuemin={0} aria-valuemax={100} aria-label="Coverage"><div className="h-full rounded-full bg-accent-600 transition-all" style={{ width: result.coverage + '%' }} /></div>
                </div>
                <p className="mt-3 flex gap-1.5 rounded-lg bg-soft p-3 text-[13px] leading-relaxed text-muted"><Info size={15} className="mt-0.5 shrink-0" /> Based only on keyword overlap between the posting and your resume text. It ignores experience quality, portfolio, and referrals — treat it as a checklist, not a verdict.</p>
              </div>

              {isOnline() && (
                <div className="card p-5">
                  {applied ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-bold"><CheckCircle2 size={15} className="text-emerald-600" /> {applied.asCopy ? 'Saved as a new tailored copy' : 'Applied to this résumé'}</p>
                        <p className="mt-1 text-[13px] text-muted">Re-run the analysis to see the updated match.</p>
                      </div>
                      <button className="btn-primary" onClick={openEditor}>Open in editor <ArrowRight size={15} /></button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="max-w-[52ch]">
                        <p className="flex items-center gap-1.5 text-sm font-bold"><Wand2 size={15} className="text-accent-600" /> Autoconfigure for this job</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-muted">Rewrites your summary, bullets, and skill order to target this posting — using only what is already in your résumé. You review every change before anything is saved.</p>
                        {tailoring && <p className="hint mt-2">Asking the AI to rewrite your résumé — this usually takes 5–20 seconds.</p>}
                      </div>
                      <button className="btn-primary" disabled={tailoring} onClick={autoconfigure}>
                        <Wand2 size={16} /> {tailoring ? 'Configuring…' : 'Autoconfigure résumé'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="card p-5"><p className="flex items-center gap-1.5 text-sm font-bold"><CheckCircle2 size={15} className="text-emerald-600" /> Matching ({result.matched.length})</p><div className="mt-2 flex flex-wrap gap-1.5">{result.matched.length === 0 && <span className="text-sm text-muted">None detected.</span>}{result.matched.map(s => <span key={s} className="chip !border-emerald-200 !bg-emerald-50">{s}</span>)}</div>
                  <ul className="mt-3 space-y-1 text-[13px] text-muted">{result.strengths.map((s, i) => <li key={i}>· {s}</li>)}</ul></div>
                <div className="card p-5"><p className="flex items-center gap-1.5 text-sm font-bold"><AlertTriangle size={15} className="text-amber-600" /> Not demonstrated ({result.missing.length})</p><div className="mt-2 flex flex-wrap gap-1.5">{result.missing.length === 0 && <span className="text-sm text-muted">Full coverage — strong.</span>}{result.missing.map(s => <span key={s} className="chip !border-amber-200 !bg-amber-50">{s}</span>)}</div>
                  <ul className="mt-3 space-y-1 text-[13px] text-muted">{result.suggestions.map((s, i) => <li key={i}>· {s}</li>)}</ul></div>
              </div>
              <div className="card p-5"><p className="flex items-center gap-1.5 text-sm font-bold"><Lightbulb size={15} className="text-accent-600" /> Next actions</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-muted">
                  {actions.map((a, i) => <li key={i}>{a}</li>)}
                </ol>
                <p className="hint mt-2">{result.engine === 'llm' ? 'AI analysis · provider-backed model call.' : 'Simulated analysis · deterministic keyword match, no model call.'}</p></div>
            </div>
          )}
        </div>
      </div>

      {tailored && (
        <TailorDialog
          tailored={tailored}
          template={selected?.template ?? 'minimal'}
          busy={applying}
          onApply={apply}
          onClose={() => setTailored(null)}
        />
      )}
    </AppShell>
  );
}

/** Review dialog: changelog + live preview before anything is persisted. */
function TailorDialog({ tailored, template, busy, onApply, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tailor-title" className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="card max-h-[88vh] w-full max-w-2xl overflow-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="tailor-title" className="text-lg font-extrabold">Autoconfigured résumé</h2>
            <p className="mt-1 text-[13px] text-muted">Review before saving — nothing has been changed yet.{tailored.model ? ` Tailored by ${tailored.model}.` : ''}</p>
          </div>
          <button onClick={onClose} className="btn-ghost" aria-label="Close"><X size={16} /></button>
        </div>

        <div className="mt-4">
          <p className="section-title">What changed ({tailored.changes.length})</p>
          {tailored.changes.length === 0
            ? <p className="mt-1 text-sm text-muted">The model reported no changes to the text.</p>
            : <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed">{tailored.changes.map((c, i) => <li key={i}>{c}</li>)}</ol>}
        </div>

        {tailored.warnings.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="flex items-center gap-1.5 text-[13px] font-bold"><AlertTriangle size={14} className="text-amber-600" /> Worth verifying</p>
            <ul className="mt-1 space-y-1 text-[13px] leading-relaxed">{tailored.warnings.map((w, i) => <li key={i}>· {w}</li>)}</ul>
          </div>
        )}

        <details className="mt-4 rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-sm font-semibold">Preview tailored résumé</summary>
          <div className="mt-3 max-h-[50vh] overflow-auto">
            <ResumePreview resume={{ ...tailored.content, template }} template={template} />
          </div>
        </details>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button className="btn-primary" disabled={Boolean(busy)} autoFocus onClick={() => onApply(false)}>
            <Wand2 size={15} /> {busy === 'apply' ? 'Applying…' : 'Apply to this résumé'}
          </button>
          <button className="btn-secondary" disabled={Boolean(busy)} onClick={() => onApply(true)}>{busy === 'copy' ? 'Saving…' : 'Save as a copy'}</button>
          <button className="btn-ghost" disabled={Boolean(busy)} onClick={onClose}>Cancel</button>
        </div>
        <p className="hint mt-2">Applying saves a version snapshot first, so the current résumé stays recoverable. “Save as a copy” leaves this résumé untouched.</p>
      </div>
    </div>
  );
}
