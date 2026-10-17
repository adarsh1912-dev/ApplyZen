import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { AppShell } from '../components/layout/Chrome';
import { TEMPLATES, getActiveId } from '../lib/store';
import { useEffect, useState } from 'react';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../lib/auth';
import { listTemplates, listResumes, patchResume } from '../lib/data';

export default function Templates() {
  const { push } = useToast();
  const { user, online, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState(TEMPLATES);
  const [active, setActive] = useState(null);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    let on = true;
    listTemplates()
      .then((items) => { if (on && items?.length) setTemplates(items); })
      .catch(() => { /* keep the bundled catalog */ });
    return () => { on = false; };
  }, []);

  // The active resume is a personal pointer — only load it for signed-in users
  // (or in offline mode, where everything lives in localStorage).
  useEffect(() => {
    if (online && (authLoading || !user)) return;
    let on = true;
    listResumes()
      .then((rs) => { if (on) setActive(rs.find(r => r.id === getActiveId()) ?? rs[0] ?? null); })
      .catch(() => { /* templates stay browsable */ });
    return () => { on = false; };
  }, [user, authLoading, online]);

  const apply = async (id) => {
    if (!active) { push(online && !user ? 'Sign in to use templates on your resume.' : 'Create a resume first.', 'error'); return; }
    if (online && !user) { push('Sign in to use templates on your resume.', 'error'); return; }
    try {
      const next = await patchResume(active.id, { template: id });
      setActive(a => ({ ...a, template: next.template }));
      push(`“${templates.find(t => t.id === id).name}” applied to “${active.title}”.`);
    } catch (e) {
      push(e.message || 'Could not apply the template.', 'error');
    }
  };

  return (
    <AppShell>
      <h1 className="text-[26px] font-extrabold tracking-tight">Templates</h1>
      <p className="mt-1 max-w-[60ch] text-sm text-muted">Readable, ATS-conscious layouts. Decorative graphics are deliberately avoided — parsers and hiring managers both prefer structure.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {templates.map(t => (
          <article key={t.id} className="card overflow-hidden">
            <button onClick={() => setSel(t.id)} className="block w-full bg-soft p-5 text-left" aria-label={`Preview ${t.name}`}>
              <MiniPreview id={t.id} />
            </button>
            <div className="flex items-start justify-between gap-3 p-5">
              <div><p className="text-[15px] font-bold">{t.name}</p><p className="mt-0.5 text-[13px] text-muted">{t.desc}</p>
                <div className="mt-2 flex gap-1.5">{(t.tags ?? []).map(g => <span key={g} className="chip !text-[11px]">{g}</span>)}</div></div>
            </div>
            <div className="flex gap-2 border-t border-line p-4">
              <button onClick={() => apply(t.id)} className="btn-secondary flex-1 !py-2 text-[13px]">Use template</button>
              <button onClick={() => setSel(t.id)} className="btn-ghost text-[13px]">Detail</button>
            </div>
            {active?.template === t.id && <p className="flex items-center gap-1 border-t border-line bg-emerald-50 px-5 py-2 text-xs font-semibold text-emerald-800"><Check size={13} /> Active on “{active.title}”</p>}
          </article>
        ))}
      </div>

      {sel && (
        <div role="dialog" aria-modal="true" aria-label="Template detail" className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setSel(null)}>
          <div className="card max-h-[90vh] w-full max-w-lg overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <p className="text-lg font-extrabold">{templates.find(t => t.id === sel).name}</p>
            <p className="mt-1 text-sm text-muted">{templates.find(t => t.id === sel).desc}</p>
            <div className="mt-4 rounded-lg bg-soft p-4"><MiniPreview id={sel} large /></div>
            <ul className="mt-4 space-y-1.5 text-sm text-muted">
              <li>· Single-column reading order (Compact excepted, still linear).</li>
              <li>· Standard section headings parsers recognise.</li>
              <li>· No text baked into images; minimum 11px body type.</li>
            </ul>
            <div className="mt-5 flex gap-2">
              <button onClick={() => { apply(sel); setSel(null); }} className="btn-primary flex-1">Use this template</button>
              <button onClick={() => setSel(null)} className="btn-secondary">Close</button>
            </div>
            <p className="mt-4 text-center text-xs text-muted"><Link to="/editor" className="underline">Open in editor</Link></p>
          </div>
        </div>
      )}
    </AppShell>
  );
}

const Bar = ({ children }) => <div className="mb-1 h-1.5 rounded bg-stone-300" style={{ width: children + '%' }} />;
function MiniPreview({ id, large }) {
  const H = Bar;
  if (id === 'classic') return <div className={`rounded bg-white p-4 shadow-sm font-serif ${large ? 'scale-100' : ''}`}><div className="mx-auto h-2.5 w-1/2 rounded bg-stone-800" /><div className="mx-auto mt-1 h-px w-full bg-stone-800" /><div className="mt-2 space-y-1"><H>90</H><H>100</H><H>80</H></div><div className="mt-2 h-px bg-stone-300" /><div className="mt-2 space-y-1"><H>95</H><H>85</H></div></div>;
  if (id === 'technical') return <div className="rounded bg-white p-4 font-mono shadow-sm"><div className="rounded bg-stone-900 p-2 text-[10px] text-white">your_name — engineer</div><div className="mt-2 space-y-1"><H>85</H><H>95</H><H>75</H></div></div>;
  if (id === 'compact') return <div className="grid grid-cols-[1fr_2fr] gap-2"><div className="rounded bg-indigo-950 p-2"><div className="h-2 w-3/4 rounded bg-white/80" /><div className="mt-2 space-y-1"><div className="h-1 rounded bg-white/30" /><div className="h-1 rounded bg-white/30" /></div></div><div className="rounded bg-white p-2 shadow-sm"><H>90</H><H>95</H><H>80</H></div></div>;
  if (id === 'engineer') return <div className="rounded bg-white p-4 shadow-sm"><div className="flex items-end justify-between"><div className="h-2.5 w-1/3 rounded bg-stone-800" /><div className="h-1.5 w-1/4 rounded bg-stone-300" /></div><div className="mt-1 h-1.5 w-1/4 rounded bg-indigo-500" /><div className="mt-2 h-px w-full bg-stone-200" /><div className="mt-2 space-y-1"><H>88</H><H>95</H></div><div className="mt-2 flex gap-1"><span className="h-3 w-10 rounded-sm bg-indigo-100" /><span className="h-3 w-12 rounded-sm bg-stone-200" /><span className="h-3 w-8 rounded-sm bg-stone-200" /></div><div className="mt-2 space-y-1"><H>70</H></div></div>;
  if (id === 'terminal') return <div className="rounded bg-white p-4 font-mono shadow-sm"><p className="text-[9px] text-stone-400">$ whoami</p><div className="h-2.5 w-1/2 rounded bg-stone-800" /><div className="mt-1 h-1.5 w-1/3 rounded bg-emerald-600" /><div className="mt-2 border-t border-stone-200 pt-1.5 text-[9px] text-stone-400">$ ./experience</div><div className="mt-1 space-y-1"><H>85</H><H>92</H></div></div>;
  if (id === 'opensource') return <div className="rounded border-l-[3px] border-indigo-600 bg-white p-4 shadow-sm"><div className="h-2.5 w-1/3 rounded bg-stone-800" /><div className="mt-2 flex gap-1"><span className="h-3 w-10 rounded-full border border-stone-300 bg-stone-50" /><span className="h-3 w-12 rounded-full border border-stone-300 bg-stone-50" /><span className="h-3 w-8 rounded-full border border-stone-300 bg-stone-50" /></div><div className="mt-2 space-y-1"><H>90</H><H>80</H></div><div className="mt-2 h-1.5 w-2/5 rounded bg-indigo-100" /></div>;
  if (id === 'staff') return <div className="rounded bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><div className="h-2.5 w-24 rounded bg-stone-800" /><div className="mt-1 h-1 w-16 rounded bg-stone-400" /></div><div className="h-1 w-12 rounded bg-stone-300" /></div><div className="mt-2 border-t-2 border-stone-800" /><div className="mt-[2px] border-t border-stone-300" /><div className="mt-2 flex items-center gap-1.5"><span className="h-1 w-10 rounded bg-stone-400" /><span className="h-px flex-1 bg-stone-200" /></div><div className="mt-1 space-y-1"><H>92</H><H>85</H></div></div>;
  return <div className="rounded bg-white p-4 shadow-sm"><div className="h-2.5 w-2/5 rounded bg-stone-900" /><div className="mt-1 h-1.5 w-1/4 rounded bg-indigo-500" /><div className="mt-2 space-y-1"><H>95</H><H>100</H><H>82</H></div></div>;
}
