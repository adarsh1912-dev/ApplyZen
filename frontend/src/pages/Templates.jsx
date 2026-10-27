import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { AppShell } from '../components/layout/Chrome';
import { TEMPLATES, getActiveId } from '../lib/store';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../lib/auth';
import { listTemplates, listResumes, patchResume } from '../lib/data';
import { ResumeSheet } from '../components/resume/ResumePreview';
import { heroResume } from '../lib/marketing';

function TemplateThumbnail({ id, scale = 0.26 }) {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-sm bg-white shadow-card ring-1 ring-line"
      style={{ width: 794 * scale, height: 1123 * scale }}
    >
      <div className="origin-top-left" style={{ transform: `scale(${scale})` }}>
        <ResumeSheet resume={{ ...heroResume, template: id }} template={id} />
      </div>
    </div>
  );
}

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

  useEffect(() => {
    if (online && (authLoading || !user)) return;
    let on = true;
    listResumes()
      .then((rs) => { if (on) setActive(rs.find((r) => r.id === getActiveId()) ?? rs[0] ?? null); })
      .catch(() => { /* templates stay browsable */ });
    return () => { on = false; };
  }, [user, authLoading, online]);

  const apply = async (id) => {
    if (!active) {
      push(online && !user ? 'Sign in to use templates on your resume.' : 'Create a resume first.', 'error');
      return;
    }
    if (online && !user) {
      push('Sign in to use templates on your resume.', 'error');
      return;
    }
    try {
      const next = await patchResume(active.id, { template: id });
      setActive((a) => ({ ...a, template: next.template }));
      push(`“${templates.find((t) => t.id === id).name}” applied to “${active.title}”.`);
    } catch (e) {
      push(e.message || 'Could not apply the template.', 'error');
    }
  };

  const selected = templates.find((t) => t.id === sel);

  return (
    <AppShell>
      <div>
        <p className="section-title">Template library</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">Templates</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Readable, ATS-conscious layouts. Switch the look without changing a word of your content. Decorative graphics stay out of the document.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => (
          <article key={t.id} className="card overflow-hidden">
            <button
              onClick={() => setSel(t.id)}
              className="group block w-full bg-soft/50 p-5 text-left"
              aria-label={`Preview ${t.name}`}
            >
              <div className="mx-auto w-fit transition-transform duration-200 ease-out group-hover:-translate-y-1">
                <TemplateThumbnail id={t.id} />
              </div>
            </button>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-ink">{t.name}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{t.desc}</p>
                </div>
                {active?.template === t.id && <span className="chip chip-accent shrink-0 !text-[9px]">Active</span>}
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(t.tags ?? []).map((tag) => <span key={tag} className="chip !text-[10px]">{tag}</span>)}
              </div>

              <div className="mt-4 flex gap-2 border-t border-line pt-3">
                <button onClick={() => apply(t.id)} className="btn-secondary flex-1 !py-2 text-[12px]">Use template</button>
                <button onClick={() => setSel(t.id)} className="btn-ghost text-[12px]">Preview</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.name} template detail`}
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setSel(null)}
        >
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-auto p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">{selected.name}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{selected.desc}</p>
              </div>
              <button onClick={() => setSel(null)} className="btn-ghost" aria-label="Close"><X size={16} /></button>
            </div>

            <div className="mt-4 flex justify-center overflow-auto rounded-xl border border-line bg-soft/50 p-4">
              <TemplateThumbnail id={selected.id} scale={0.4} />
            </div>

            <ul className="mt-4 space-y-1.5 text-[13px] text-muted">
              <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 shrink-0 text-accent-600" /> Single-column reading order, except the deliberate two-column Compact layout.</li>
              <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 shrink-0 text-accent-600" /> Standard section headings that parsers recognise.</li>
              <li className="flex items-start gap-2"><Check size={14} className="mt-0.5 shrink-0 text-accent-600" /> No text baked into images; readable body type and clean print rules.</li>
            </ul>

            <div className="mt-5 flex gap-2">
              <button onClick={() => { apply(selected.id); setSel(null); }} className="btn-primary flex-1">Use this template</button>
              <button onClick={() => setSel(null)} className="btn-secondary">Close</button>
            </div>
            <p className="mt-4 text-center text-[11px] text-muted"><Link to="/editor" className="underline decoration-line underline-offset-4 hover:text-ink">Open in editor</Link></p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
