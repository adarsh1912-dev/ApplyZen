import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TEMPLATES } from '../../lib/store';

// A4 at 96dpi: 210mm × 297mm = 794 × 1123 CSS pixels.
const A4_W = 794;
const A4_H = 1123;
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;

// One memorable element: a realistic A4 document. Four genuinely distinct templates.
export default function ResumePreview({ resume, template, zoom = 1, printMode = false, onScaleChange, onZoomChange }) {
  const t = template || resume.template;
  const frameRef = useRef(null);
  const pageRef = useRef(null);
  const panRef = useRef(null);
  const [fit, setFit] = useState(1);
  const [pageH, setPageH] = useState(A4_H);
  const [panning, setPanning] = useState(false);

  // Fit the fixed A4 sheet to the frame's content width (never above 1:1).
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || printMode) return;
    const measure = () => {
      const cs = getComputedStyle(frame);
      const inner = frame.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      if (inner > 0) setFit(Math.min(1, inner / A4_W));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    return () => ro.disconnect();
  }, [printMode]);

  // Track the document's real (pre-transform) height so the zoomed wrapper reserves the right space.
  useEffect(() => {
    const page = pageRef.current;
    if (!page || printMode) return;
    const measure = () => setPageH(Math.max(A4_H, page.offsetHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(page);
    return () => ro.disconnect();
  }, [printMode, resume, template]);

  const scale = printMode ? 1 : fit * zoom;
  useEffect(() => { onScaleChange?.(scale); }, [scale, onScaleChange]);

  // Wheel zoom: scroll up → zoom in, scroll down → zoom out, anchored under the cursor.
  // Native non-passive listener — React's onWheel is passive and cannot preventDefault.
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  const anchorRef = useRef(null);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || printMode || !onZoomChange) return;
    const onWheel = (e) => {
      e.preventDefault();
      const wrap = frame.firstElementChild;
      if (!wrap) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current * (1 - dy * 0.0015)));
      if (+next.toFixed(3) === zoomRef.current) return;
      // Remember where the cursor sits on the sheet so we can keep it there after zoom.
      const fRect = frame.getBoundingClientRect();
      const cs = getComputedStyle(frame);
      const wRect = wrap.getBoundingClientRect();
      anchorRef.current = {
        fx: wRect.width > 0 ? (e.clientX - wRect.left) / wRect.width : 0,
        fy: wRect.height > 0 ? (e.clientY - wRect.top) / wRect.height : 0,
        visX: e.clientX - fRect.left - (parseFloat(cs.paddingLeft) || 0),
        visY: e.clientY - fRect.top - (parseFloat(cs.paddingTop) || 0),
      };
      zoomRef.current = +next.toFixed(3); // optimistic — rapid wheel events arrive before re-render
      onZoomChange(zoomRef.current);
    };
    frame.addEventListener('wheel', onWheel, { passive: false });
    return () => frame.removeEventListener('wheel', onWheel);
  }, [printMode, onZoomChange]);

  // After a wheel zoom re-renders, shift scroll so the anchored point stays under the cursor.
  useEffect(() => {
    const a = anchorRef.current;
    const frame = frameRef.current;
    const wrap = frame?.firstElementChild;
    if (!a || !frame || !wrap) return;
    anchorRef.current = null;
    const fRect = frame.getBoundingClientRect();
    const cs = getComputedStyle(frame);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padT = parseFloat(cs.paddingTop) || 0;
    const wRect = wrap.getBoundingClientRect();
    const wrapLeft = wRect.left - fRect.left - padL + frame.scrollLeft;
    const wrapTop = wRect.top - fRect.top - padT + frame.scrollTop;
    frame.scrollLeft = wrapLeft + a.fx * wRect.width - a.visX;
    frame.scrollTop = wrapTop + a.fy * wRect.height - a.visY;
  }, [scale]);

  // Grab-to-pan only once zoomed beyond fit (the sheet overflows the frame).
  const pannable = !printMode && scale > fit + 0.001;

  const onPointerDown = (e) => {
    if (!pannable || e.button !== 0 || e.pointerType === 'touch') return; // touch keeps native scroll
    const frame = frameRef.current;
    if (!frame) return;
    panRef.current = { x: e.clientX, y: e.clientY, sl: frame.scrollLeft, st: frame.scrollTop };
    setPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const p = panRef.current;
    const frame = frameRef.current;
    if (!p || !frame) return;
    frame.scrollLeft = p.sl - (e.clientX - p.x);
    frame.scrollTop = p.st - (e.clientY - p.y);
  };
  const endPan = (e) => {
    if (!panRef.current) return;
    panRef.current = null;
    setPanning(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
  };

  const frameClass = printMode
    ? 'print-doc'
    : `preview-frame scroll-thin overflow-auto rounded-xl border border-line bg-soft/70 p-4 shadow-inset sm:p-8 dark:bg-black/30 ${
        pannable ? (panning ? 'cursor-grabbing select-none' : 'cursor-grab') : ''
      }`;

  return (
    <div
      ref={frameRef}
      className={frameClass}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onDragStart={(e) => { if (pannable) e.preventDefault(); }}
    >
      <div
        className="relative mx-auto"
        style={printMode ? undefined : { width: A4_W * scale, height: pageH * scale }}
      >
        <ResumeSheet
          ref={pageRef}
          resume={resume}
          template={t}
          className={printMode ? 'print-doc' : 'absolute left-0 top-0 shadow-doc'}
          style={{
            transform: printMode ? undefined : `scale(${scale})`,
            transformOrigin: 'top left',
            fontSize: 13.5,
          }}
        />
      </div>
    </div>
  );
}

function ResumeContent({ resume, template }) {
  return (
    <>
      {template === 'classic' && <Classic r={resume} />}
      {template === 'minimal' && <Minimal r={resume} />}
      {template === 'technical' && <Technical r={resume} />}
      {template === 'compact' && <Compact r={resume} />}
      {template === 'engineer' && <Engineer r={resume} />}
      {template === 'terminal' && <Terminal r={resume} />}
      {template === 'opensource' && <OpenSource r={resume} />}
      {template === 'staff' && <Staff r={resume} />}
    </>
  );
}

/** Static A4 document sheet shared by the editor, landing preview, and template gallery. */
export const ResumeSheet = forwardRef(function ResumeSheet({ resume, template, className = '', style, ...rest }, ref) {
  const t = template || resume.template;
  return (
    <article
      ref={ref}
      className={`doc-page bg-white text-left ${className}`}
      style={{ fontSize: 13.5, ...style }}
      aria-label={`Résumé preview — ${TEMPLATES.find((x) => x.id === t)?.name}`}
      {...rest}
    >
      <ResumeContent resume={resume} template={t} />
    </article>
  );
});

const px = { pad: '2rem 2.2rem' };

function Classic({ r }) {
  const vis = (k) => r.visible?.[k] !== false;
  return (
    <div style={{ padding: px.pad }} className="font-serif text-stone-900">
      <header className="border-b-2 border-stone-900 pb-3 text-center">
        <h1 className="text-[26px] font-semibold tracking-tight">{r.personal.name || 'Your Name'}</h1>
        <p className="mt-0.5 text-[12px] italic text-stone-600">{r.personal.role || 'Professional title'}</p>
        <p className="mt-1 text-[11px] text-stone-600">{[r.personal.email, r.personal.phone, r.personal.location].filter(Boolean).join('  ·  ')}</p>
      </header>
      {vis('summary') && <DocSection title="Summary" serif><p className="text-[12.5px] leading-relaxed">{r.summary || 'Two-line professional summary…'}</p></DocSection>}
      {vis('experience') && <DocSection title="Experience" serif>
        {r.experience.length === 0 && <Empty />}
        {r.experience.map(e => (
          <div key={e.id} className="mb-3">
            <div className="flex justify-between text-[13px] font-semibold"><span>{e.role} — {e.company}</span><span className="font-normal text-stone-500">{e.dates}</span></div>
            <ul className="ml-4 list-disc text-[12px] leading-relaxed">{e.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
          </div>
        ))}
      </DocSection>}
      {vis('education') && <DocSection title="Education" serif>{r.education.map(e => <p key={e.id} className="text-[12px]"><b>{e.school}</b> — {e.degree} <span className="text-stone-500">({e.dates})</span></p>)}</DocSection>}
      {vis('skills') && <SkillsLine skills={r.skills} serif />}
    </div>
  );
}

function Minimal({ r }) {
  const vis = (k) => r.visible?.[k] !== false;
  return (
    <div style={{ padding: '2.2rem 2.4rem' }} className="font-sans text-stone-900">
      <header>
        <h1 className="text-[30px] font-extrabold leading-none tracking-[-0.03em]">{r.personal.name || 'Your Name'}</h1>
        <p className="mt-1 text-[13px] font-semibold text-accent-700">{r.personal.role || 'Professional title'}</p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-stone-500">{[r.personal.email, r.personal.phone, r.personal.location, r.personal.website].filter(Boolean).join('   ·   ') || 'email · phone · location'}</p>
      </header>
      <div className="my-4 h-px bg-stone-200" />
      {vis('summary') && r.summary && (<section className="mb-4"><MiniH title="Summary" /><p className="max-w-[62ch] text-[12.5px] leading-relaxed text-stone-700">{r.summary}</p></section>)}
      {vis('experience') && <section className="mb-4"><MiniH title="Experience" />
        {r.experience.length === 0 && <Empty />}
        {r.experience.map(e => (
          <div key={e.id} className="mb-3.5">
            <div className="flex items-baseline justify-between"><p className="text-[13.5px] font-bold">{e.role} <span className="font-medium text-stone-500">· {e.company}</span></p><span className="text-[11px] font-medium text-stone-400">{e.dates}</span></div>
            <ul className="mt-1 space-y-1">{e.bullets.map((b, i) => <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-stone-700"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-600" />{b}</li>)}</ul>
          </div>
        ))}
      </section>}
      <div className="grid grid-cols-2 gap-6">
        {vis('skills') && <section><MiniH title="Skills" /><div className="flex flex-wrap gap-1.5">{r.skills.map(s => <span key={s} className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium">{s}</span>)}</div></section>}
        {vis('education') && <section><MiniH title="Education" />{r.education.map(e => <p key={e.id} className="text-[12px]"><b>{e.school}</b><br /><span className="text-stone-500">{e.degree} · {e.dates}</span></p>)}</section>}
      </div>
      {((vis('projects') && r.projects?.length > 0) || r.certifications?.length > 0) && (
        <section className="mt-4"><MiniH title="Projects & Certifications" />
          {vis('projects') && r.projects.map(p => <p key={p.id} className="text-[12px]"><b>{p.name}</b> — <span className="text-stone-600">{p.detail}</span></p>)}
          {r.certifications.map(c => <p key={c.id} className="text-[12px]"><b>{c.name}</b> <span className="text-stone-500">· {c.detail}</span></p>)}
        </section>
      )}
    </div>
  );
}

function Technical({ r }) {
  const vis = (k) => r.visible?.[k] !== false;
  return (
    <div style={{ padding: '1.8rem 2rem' }} className="font-sans text-stone-900">
      <header className="flex items-start justify-between rounded-lg bg-accent-950 px-5 py-4 text-white">
        <div><h1 className="font-mono text-[20px] font-bold tracking-tight">{r.personal.name || 'your_name'}</h1>
          <p className="font-mono text-[11.5px] text-stone-300">{r.personal.role || 'software_engineer'} — {r.personal.location}</p></div>
        <div className="text-right font-mono text-[10.5px] leading-relaxed text-stone-300">{r.personal.email}<br />{r.personal.website || r.personal.linkedin}</div>
      </header>
      {vis('summary') && r.summary && <p className="mt-3 border-l-2 border-stone-900 pl-3 font-mono text-[11.5px] leading-relaxed text-stone-700">{r.summary}</p>}
      {vis('experience') && <>
        <TechH title="experience" />
        {r.experience.map(e => (
          <div key={e.id} className="mb-2.5"><p className="font-mono text-[12px] font-bold">▸ {e.role} @ {e.company} <span className="font-normal text-stone-400">[{e.dates}]</span></p>
            <ul className="ml-5 list-square font-mono text-[11.5px] leading-relaxed text-stone-700">{e.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul></div>
        ))}
      </>}
      {vis('skills') && <>
        <TechH title="skills" />
        <p className="font-mono text-[11.5px] leading-relaxed">{r.skills.join('  |  ') || 'Add skills separated by commas in the editor.'}</p>
      </>}
      {vis('education') && <>
        <TechH title="education" />
        {r.education.map(e => <p key={e.id} className="font-mono text-[11.5px]">{e.degree} — {e.school} ({e.dates})</p>)}
      </>}
      {vis('projects') && r.projects?.length > 0 && (<><TechH title="projects" />{r.projects.map(p => <p key={p.id} className="font-mono text-[11.5px]"><b>{p.name}:</b> {p.detail}</p>)}</>)}
    </div>
  );
}

function Compact({ r }) {
  const vis = (k) => r.visible?.[k] !== false;
  return (
    <div style={{ padding: '1.6rem 1.8rem' }} className="grid grid-cols-[1fr_2fr] gap-6 font-sans text-stone-900">
      <aside className="rounded-lg bg-accent-950 p-4 text-white">
        <h1 className="text-[18px] font-extrabold leading-tight">{r.personal.name || 'Your Name'}</h1>
        <p className="text-[11px] font-medium text-accent-200">{r.personal.role}</p>
        <div className="my-3 h-px bg-white/15" />
        <SideH t="Contact" /><p className="text-[10.5px] leading-relaxed text-accent-100">{[r.personal.email, r.personal.phone, r.personal.location, r.personal.website].filter(Boolean).join('\n') || 'contact details'}</p>
        {vis('skills') && <><SideH t="Skills" /><ul className="space-y-1">{r.skills.map(s => <li key={s} className="text-[10.5px]">— {s}</li>)}</ul></>}
        {vis('education') && <><SideH t="Education" />{r.education.map(e => <p key={e.id} className="text-[10.5px]"><b>{e.school}</b><br />{e.degree}<br /><span className="text-accent-200">{e.dates}</span></p>)}</>}
      </aside>
      <div>
        {vis('summary') && r.summary && <><SideH t="Profile" dark /><p className="text-[11.5px] leading-relaxed text-stone-700">{r.summary}</p></>}
        {vis('experience') && <>
          <SideH t="Experience" dark />
          {r.experience.map(e => (
            <div key={e.id} className="mb-2.5"><p className="text-[12px] font-bold">{e.role} · {e.company} <span className="ml-1 font-normal text-stone-400">{e.dates}</span></p>
              <ul className="ml-4 list-disc text-[11.5px] leading-relaxed text-stone-700">{e.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul></div>
          ))}
        </>}
        {vis('projects') && r.projects?.length > 0 && (<><SideH t="Projects" dark />{r.projects.map(p => <p key={p.id} className="text-[11.5px]"><b>{p.name}</b> — {p.detail}</p>)}</>)}
      </div>
    </div>
  );
}

/* ---------- SWE-focused templates ---------- */

// Bucket flat skills into languages / frameworks / infra for the Engineer template.
const SKILL_BUCKETS = [
  { title: 'Languages', items: ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'sql', 'html', 'css', 'bash', 'shell'] },
  { title: 'Frameworks & libraries', items: ['react', 'node', 'next', 'vue', 'angular', 'svelte', 'django', 'flask', 'rails', 'spring', 'express', 'graphql', 'tailwind'] },
  { title: 'Infrastructure & data', items: ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'ci', 'cd', 'redis', 'kafka', 'postgres', 'mongodb', 'elasticsearch', 'spark', 'snowflake', 'bigquery'] },
];
const SKILL_ALIASES = { js: 'javascript', ts: 'typescript', k8s: 'kubernetes', postgresql: 'postgres', nodejs: 'node', golang: 'go' };
// Match on the full (normalized) skill name or its first word — so "Node.js"/"Next.js"
// land in frameworks, not languages, while "React Native" still matches react.
function skillKeys(s) {
  const words = s.toLowerCase().replace(/[.#/]/g, ' ').split(/\s+/).filter(Boolean);
  const full = words.length === 1 ? (SKILL_ALIASES[words[0]] ?? words[0]) : words.join(' ');
  return { full, first: words[0] ?? '' };
}
function groupSkills(skills) {
  const used = new Set();
  const groups = [];
  for (const b of SKILL_BUCKETS) {
    const items = skills.filter((s) => {
      const { full, first } = skillKeys(s);
      if (b.items.includes(full) || b.items.includes(first)) { used.add(s); return true; }
      return false;
    });
    if (items.length) groups.push({ title: b.title, items });
  }
  const rest = skills.filter((s) => !used.has(s));
  if (rest.length) groups.push({ title: 'Tools & platforms', items: rest });
  return groups;
}

// Engineer Pro — grouped skills, impact-first bullets. Backend/frontend/platform SWEs.
function Engineer({ r }) {
  const vis = (k) => r.visible?.[k] !== false;
  const groups = groupSkills(r.skills);
  return (
    <div style={{ padding: '1.9rem 2.1rem' }} className="font-sans text-stone-900">
      <header className="flex items-end justify-between gap-4 border-b border-stone-300 pb-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">{r.personal.name || 'Your Name'}</h1>
          <p className="mt-0.5 text-[12.5px] font-semibold text-accent-700">{r.personal.role || 'Software Engineer'}</p>
        </div>
        <p className="text-right text-[10.5px] leading-relaxed text-stone-500">
          {[r.personal.email, r.personal.phone].filter(Boolean).join('  ·  ')}<br />
          {[r.personal.location, r.personal.website, r.personal.linkedin].filter(Boolean).join('  ·  ')}
        </p>
      </header>
      {vis('summary') && r.summary && (
        <><EngH title="Summary" /><p className="mb-3 text-[12px] leading-relaxed text-stone-700">{r.summary}</p></>
      )}
      {vis('experience') && (
        <><EngH title="Experience" />
          {r.experience.length === 0 && <Empty />}
          {r.experience.map(e => (
            <div key={e.id} className="mb-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-bold">{e.role} <span className="font-medium text-accent-700">· {e.company}</span></p>
                <span className="shrink-0 text-[11px] font-medium text-stone-400">{e.dates}</span>
              </div>
              <ul className="mt-1 space-y-0.5 text-[11.5px] leading-relaxed text-stone-700">{e.bullets.map((b, i) => <li key={i} className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-600" />{b}</li>)}</ul>
            </div>
          ))}
        </>
      )}
      {vis('skills') && (
        <><EngH title="Skills" />
          {r.skills.length === 0 && <Empty />}
          {groups.map(g => (
            <p key={g.title} className="mb-1 text-[11.5px] leading-relaxed"><span className="font-bold">{g.title}</span><span className="text-stone-400"> — </span><span className="text-stone-700">{g.items.join(', ')}</span></p>
          ))}
        </>
      )}
      {vis('projects') && r.projects?.length > 0 && (
        <><EngH title="Projects" />
          {r.projects.map(p => <p key={p.id} className="mb-1 text-[11.5px] leading-relaxed"><b>{p.name}</b> — <span className="text-stone-600">{p.detail}</span></p>)}
        </>
      )}
      {vis('education') && r.education.length > 0 && (
        <><EngH title="Education" />
          {r.education.map(e => <p key={e.id} className="mb-0.5 text-[11.5px]"><b>{e.school}</b> — {e.degree} <span className="text-stone-500">({e.dates})</span></p>)}
        </>
      )}
    </div>
  );
}

// Terminal — monospace CLI aesthetic that still prints clean.
function Terminal({ r }) {
  const vis = (k) => r.visible?.[k] !== false;
  return (
    <div style={{ padding: '1.7rem 1.9rem' }} className="font-mono text-stone-900">
      <header className="border-b-2 border-stone-900 pb-2.5">
        <p className="text-[10.5px] text-stone-400">$ whoami</p>
        <h1 className="text-[21px] font-bold tracking-tight">{r.personal.name || 'your_name'}</h1>
        <p className="text-[11.5px] font-medium text-accent-700">{r.personal.role || 'software_engineer'}</p>
        <p className="mt-1 text-[10.5px] leading-relaxed text-stone-500">
          {[r.personal.email, r.personal.phone, r.personal.location].filter(Boolean).join('  |  ')}<br />
          {[r.personal.website, r.personal.linkedin].filter(Boolean).join('  |  ')}
        </p>
      </header>
      {vis('summary') && r.summary && (
        <><TermH title="summary" /><p className="text-[11px] leading-relaxed text-stone-700">{r.summary}</p></>
      )}
      {vis('experience') && (
        <><TermH title="experience" />
          {r.experience.length === 0 && <Empty />}
          {r.experience.map(e => (
            <div key={e.id} className="mb-2.5">
              <p className="text-[12px] font-bold">▸ {e.role} <span className="font-normal text-stone-500">@ {e.company}</span> <span className="text-[10.5px] font-normal text-stone-400">[{e.dates}]</span></p>
              <ul className="mt-0.5 space-y-0.5 text-[11px] leading-relaxed text-stone-700">{e.bullets.map((b, i) => <li key={i}>· {b}</li>)}</ul>
            </div>
          ))}
        </>
      )}
      {vis('skills') && (
        <><TermH title="stack" />
          <p className="text-[11px] leading-relaxed text-stone-700">{r.skills.join('  ·  ') || 'add_skills_in_the_editor'}</p>
        </>
      )}
      {vis('projects') && r.projects?.length > 0 && (
        <><TermH title="projects" />
          {r.projects.map(p => <p key={p.id} className="mb-1 text-[11px] leading-relaxed"><span className="text-accent-700">▶</span> <b>{p.name}</b> — <span className="text-stone-600">{p.detail}</span></p>)}
        </>
      )}
      {vis('education') && r.education.length > 0 && (
        <><TermH title="education" />
          {r.education.map(e => <p key={e.id} className="mb-0.5 text-[11px] text-stone-700">{e.degree} <span className="text-stone-400">—</span> {e.school} <span className="text-stone-400">({e.dates})</span></p>)}
        </>
      )}
    </div>
  );
}

// Open Source — projects-forward, GitHub-flavoured link chips, forest accent rule.
function OpenSource({ r }) {
  const vis = (k) => r.visible?.[k] !== false;
  const links = [r.personal.website, r.personal.linkedin, r.personal.email].filter(Boolean);
  return (
    <div style={{ padding: '1.8rem 1.7rem 1.8rem 1.4rem', borderLeft: '3px solid #245743' }} className="font-sans text-stone-900">
      <header>
        <h1 className="text-[23px] font-bold tracking-tight">{r.personal.name || 'Your Name'}</h1>
        <p className="mt-0.5 text-[12px] font-medium text-stone-600">{r.personal.role || 'Software Engineer'}{r.personal.location ? ` · ${r.personal.location}` : ''}</p>
        {links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {links.map(l => <span key={l} className="rounded-full border border-stone-300 px-2 py-[1px] font-mono text-[9.5px] text-stone-600">{l}</span>)}
          </div>
        )}
      </header>
      {vis('summary') && r.summary && (
        <><OssH title="Profile" /><p className="mb-3 text-[12px] leading-relaxed text-stone-700">{r.summary}</p></>
      )}
      {vis('experience') && (
        <><OssH title="Experience" />
          {r.experience.length === 0 && <Empty />}
          {r.experience.map(e => (
            <div key={e.id} className="mb-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[12.5px] font-bold">{e.role} <span className="font-medium text-accent-700">@ {e.company}</span></p>
                <span className="shrink-0 text-[11px] text-stone-400">{e.dates}</span>
              </div>
              <ul className="ml-4 mt-1 list-disc space-y-0.5 text-[11.5px] leading-relaxed text-stone-700">{e.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </div>
          ))}
        </>
      )}
      {vis('projects') && r.projects?.length > 0 && (
        <><OssH title="Selected work" />
          {r.projects.map(p => <p key={p.id} className="mb-1.5 text-[11.5px] leading-relaxed"><b>{p.name}</b> — <span className="text-stone-600">{p.detail}</span></p>)}
        </>
      )}
      {vis('skills') && (
        <><OssH title="Skills" />
          <div className="flex flex-wrap gap-1.5">{r.skills.map(s => <span key={s} className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10.5px] font-medium text-stone-700">{s}</span>)}</div>
        </>
      )}
      {vis('education') && r.education.length > 0 && (
        <><OssH title="Education" />
          {r.education.map(e => <p key={e.id} className="mb-0.5 text-[11.5px]"><b>{e.school}</b> — {e.degree} <span className="text-stone-500">({e.dates})</span></p>)}
        </>
      )}
    </div>
  );
}

// Staff Engineer — senior IC polish: ledger rules, scope-first summary, dense skill bar.
function Staff({ r }) {
  const vis = (k) => r.visible?.[k] !== false;
  return (
    <div style={{ padding: '2rem 2.2rem' }} className="font-sans text-stone-900">
      <header>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[25px] font-semibold tracking-[-0.02em]">{r.personal.name || 'Your Name'}</h1>
            <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.22em] text-stone-500">{r.personal.role || 'Software Engineer'}</p>
          </div>
          <p className="text-right text-[10.5px] leading-relaxed text-stone-500">
            {r.personal.email}<br />{r.personal.phone}<br />{r.personal.location}
          </p>
        </div>
        <div className="mt-3 border-t-2 border-stone-900" />
        <div className="mt-[2px] border-t border-stone-400" />
      </header>
      {vis('summary') && r.summary && (
        <StaffSec title="Profile"><p className="text-[12px] italic leading-relaxed text-stone-700">{r.summary}</p></StaffSec>
      )}
      {vis('experience') && (
        <StaffSec title="Experience">
          {r.experience.length === 0 && <Empty />}
          {r.experience.map(e => (
            <div key={e.id} className="mb-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-semibold">{e.role}<span className="font-normal text-stone-500">, {e.company}</span></p>
                <span className="shrink-0 text-[11px] text-stone-400">{e.dates}</span>
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11.5px] leading-relaxed text-stone-700">{e.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </div>
          ))}
        </StaffSec>
      )}
      {vis('skills') && (
        <StaffSec title="Core skills"><p className="text-[11.5px] leading-relaxed text-stone-700">{r.skills.join('  ·  ') || '—'}</p></StaffSec>
      )}
      {vis('projects') && r.projects?.length > 0 && (
        <StaffSec title="Selected projects">
          {r.projects.map(p => <p key={p.id} className="mb-1 text-[11.5px] leading-relaxed"><b>{p.name}</b> — <span className="text-stone-600">{p.detail}</span></p>)}
        </StaffSec>
      )}
      {vis('education') && r.education.length > 0 && (
        <StaffSec title="Education">
          {r.education.map(e => <p key={e.id} className="mb-0.5 text-[11.5px]"><b>{e.school}</b> — {e.degree} <span className="text-stone-500">({e.dates})</span></p>)}
        </StaffSec>
      )}
    </div>
  );
}

const MiniH = ({ title }) => <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">{title}</h2>;
const EngH = ({ title }) => (
  <h2 className="mb-1.5 mt-3.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-stone-600">
    <span className="h-2 w-2 shrink-0 rounded-[2px] bg-accent-600" />{title}
  </h2>
);
const TermH = ({ title }) => (
  <h2 className="mb-1.5 mt-3 border-b border-stone-300 pb-0.5 text-[11px] font-bold uppercase tracking-widest">
    <span className="text-accent-700">$</span> <span className="text-stone-500">./{title}</span>
  </h2>
);
const OssH = ({ title }) => (
  <h2 className="mb-2 mt-3.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-stone-700">
    <span className="h-1.5 w-1.5 shrink-0 bg-accent-600" />{title}
  </h2>
);
const StaffSec = ({ title, children }) => (
  <section className="mt-3.5">
    <div className="mb-1.5 flex items-center gap-2">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-600">{title}</h2>
      <span className="h-px flex-1 bg-stone-300" />
    </div>
    {children}
  </section>
);
const TechH = ({ title }) => <h2 className="mb-1 mt-3 border-b border-stone-200 pb-1 font-mono text-[11px] font-bold uppercase tracking-widest text-stone-500">// {title}</h2>;
const SideH = ({ t, dark }) => <h2 className={`mb-1.5 mt-3 text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-stone-400' : 'text-accent-300'}`}>{t}</h2>;
const Empty = () => <p className="text-[12px] italic text-stone-400">No entries yet — add one in the left panel.</p>;
function DocSection({ title, children, serif }) {
  return <section className="mt-3"><h2 className={`border-b border-stone-300 pb-0.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-700 ${serif ? '' : ''}`}>{title}</h2><div className="mt-2">{children}</div></section>;
}
function SkillsLine({ skills, serif }) {
  return <section className="mt-3"><h2 className="border-b border-stone-300 pb-0.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-700">Skills</h2><p className={`mt-2 text-[12px] ${serif ? '' : ''}`}>{skills.join(', ') || '—'}</p></section>;
}
