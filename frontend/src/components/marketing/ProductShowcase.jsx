import { FileText } from 'lucide-react';
import { ResumeSheet } from '../resume/ResumePreview';
import { heroResume } from '../../lib/marketing';

function PreviewBar({ label, badge }) {
  return (
    <div className="flex items-center gap-2 border-b border-line bg-paper/60 px-3 py-2">
      <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
      <span className="text-[9px] font-semibold tracking-wide text-muted">{label}</span>
      <span className="ml-auto rounded-full border border-line bg-surface px-2 py-0.5 text-[8px] font-medium text-muted">{badge}</span>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <PreviewBar label="ApplyZen / Dashboard" badge="Sample workspace" />
      <div className="grid min-h-[328px] grid-cols-[78px_1fr] sm:grid-cols-[96px_1fr]">
        <aside className="border-r border-line bg-paper/50 p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-accent-600 text-[8px] font-bold text-accent-foreground">A</span>
            <span className="text-[9px] font-semibold text-ink">ApplyZen</span>
          </div>
          <div className="mt-4 space-y-1">
            {['Dashboard', 'Editor', 'Analyzer', 'Templates', 'Applications'].map((label, index) => (
              <div key={label} className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[8px] font-medium ${index === 0 ? 'bg-accent-50 text-accent-800 dark:bg-accent-600/15 dark:text-accent-200' : 'text-muted'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${index === 0 ? 'bg-accent-600' : 'bg-line-strong'}`} />
                {label}
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-line pt-2">
            <div className="flex items-center gap-1.5">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent-100 text-[7px] font-bold text-accent-800 dark:bg-accent-600/20 dark:text-accent-200">MK</span>
              <span className="truncate text-[8px] font-medium text-ink">Maya K.</span>
            </div>
          </div>
        </aside>

        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] font-semibold tracking-tight text-ink">Good morning, Maya.</p>
              <p className="mt-0.5 text-[8.5px] text-muted">Pick up where you left off.</p>
            </div>
            <span className="rounded-md bg-accent-600 px-2 py-1 text-[8px] font-semibold text-accent-foreground">New résumé</span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[['Résumés', '3'], ['Applications', '12'], ['Templates', '8']].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-paper/40 px-2 py-2">
                <p className="text-[13px] font-semibold tabular-nums text-ink">{value}</p>
                <p className="text-[7.5px] font-medium text-muted">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-line p-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">Recent résumés</p>
              <span className="text-[7.5px] text-muted">View all</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {[
                ['Senior Software Engineer', 'Northloop · Minimal', '2h ago'],
                ['Product Designer — 2026', 'Paperplane · Classic', 'Yesterday'],
                ['Tailored — Stripe', 'Stripe · Engineer Pro', '3d ago'],
              ].map(([title, meta, time]) => (
                <div key={title} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2 py-1.5">
                  <span className="grid h-5 w-5 place-items-center rounded bg-soft text-muted"><FileText size={10} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[8.5px] font-semibold text-ink">{title}</p>
                    <p className="truncate text-[7.5px] text-muted">{meta}</p>
                  </div>
                  <span className="shrink-0 text-[7px] text-muted">{time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg border border-line p-2.5">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">Pipeline</p>
              <div className="mt-1.5 flex items-end gap-1">
                {[4, 5, 2, 1].map((n, i) => (
                  <div key={i} className="flex-1">
                    <div className="rounded-sm bg-accent-600/20" style={{ height: `${8 + n * 4}px` }} />
                    <p className="mt-1 text-center text-[6.5px] text-muted">{['S', 'A', 'I', 'O'][i]}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-line p-2.5">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">Next action</p>
              <p className="mt-1.5 text-[8.5px] font-medium leading-snug text-ink">Tailor the Northloop résumé for the platform role.</p>
              <p className="mt-1 text-[7.5px] text-accent-700 dark:text-accent-300">Open editor →</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <PreviewBar label="ApplyZen / Editor" badge="Autosaved" />
      <div className="grid min-h-[328px] grid-cols-[92px_1fr] sm:grid-cols-[112px_1fr]">
        <aside className="border-r border-line bg-paper/50 p-2.5">
          <p className="text-[7.5px] font-semibold uppercase tracking-[0.14em] text-muted">Sections</p>
          <div className="mt-2 space-y-1">
            {['Personal', 'Summary', 'Experience', 'Skills', 'Education'].map((label, index) => (
              <div key={label} className={`rounded-md px-1.5 py-1 text-[8px] font-medium ${index === 2 ? 'bg-accent-50 text-accent-800 dark:bg-accent-600/15 dark:text-accent-200' : 'text-muted'}`}>
                {label}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-line bg-surface p-2">
            <p className="text-[7px] font-semibold uppercase tracking-[0.12em] text-muted">Visibility</p>
            <div className="mt-1.5 space-y-1">
              {['Summary', 'Projects', 'Skills'].map((label) => (
                <div key={label} className="flex items-center justify-between text-[7.5px] text-muted">
                  {label}
                  <span className="h-2 w-2 rounded-full bg-accent-500" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="relative overflow-hidden bg-soft/50 p-3">
          <div className="flex items-center justify-between text-[8px] text-muted">
            <span className="font-medium">Resume 1 · Minimal</span>
            <span className="flex items-center gap-1 text-accent-700 dark:text-accent-300"><span className="h-1.5 w-1.5 rounded-full bg-accent-600" /> Saved</span>
          </div>
          <div className="mt-2 flex justify-center">
            <div className="relative h-[288px] w-[204px] overflow-hidden rounded-sm ring-1 ring-black/5">
              <div className="origin-top-left scale-[.258]">
                <ResumeSheet resume={heroResume} template="minimal" className="shadow-doc" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-line bg-surface/95 p-2 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent-600 text-accent-foreground">✦</span>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-semibold text-ink">Writing assistant</p>
                <p className="truncate text-[7.5px] text-muted">Lead with the outcome: “Cut p95 load by 40%…”</p>
              </div>
              <span className="rounded border border-line px-1.5 py-0.5 text-[7px] font-medium text-muted">Accept</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductShowcase() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-2xl">
          <p className="section-title">Inside ApplyZen</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
            One calm workspace, from first draft to final send.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            A dashboard that shows what matters, an editor that feels like paper, and a tracker that keeps the search moving. No noisy metrics, no invented scores.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-line bg-surface/60 p-3 sm:p-4" aria-hidden="true">
          <div className="grid gap-3 lg:grid-cols-2">
            <DashboardPreview />
            <EditorPreview />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-accent-600" /> True A4 print fidelity</span>
          <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-accent-600" /> Version history on every save</span>
          <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-accent-600" /> Offline drafts when you need them</span>
        </div>
      </div>
    </section>
  );
}
