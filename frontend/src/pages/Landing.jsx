import { Link } from 'react-router-dom';
import { ArrowRight, FileText, ScanSearch, Sparkles, KanbanSquare, Check, Zap, ShieldCheck } from 'lucide-react';
import { MarketingNav, Footer } from '../components/layout/Chrome';

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <MarketingNav />
      {/* HERO — split: copy left, product preview right */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div>
          <p className="chip mb-4"><Sparkles size={13} className="text-accent-600" /> AI-assisted · ATS-conscious · Private by default</p>
          <h1 className="max-w-[18ch] text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
            A resume that reads like you on your best day.
          </h1>
          <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-muted">
            Applyzen helps you write sharper bullets, tailor each application to the job description, and track every application — without inventing a single fact.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/dashboard" className="btn-primary !px-5 !py-3 !text-[15px]">Build my resume <ArrowRight size={16} /></Link>
            <Link to="/templates" className="btn-secondary !px-5 !py-3 !text-[15px]">Browse templates</Link>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-muted">
            <li className="flex items-center gap-1.5"><Check size={15} className="text-emerald-600" /> No account needed to try</li>
            <li className="flex items-center gap-1.5"><Check size={15} className="text-emerald-600" /> Data stays in your browser</li>
            <li className="flex items-center gap-1.5"><Check size={15} className="text-emerald-600" /> Print to real PDF</li>
          </ul>
        </div>
        {/* product preview */}
        <div className="card overflow-hidden" aria-label="Product preview">
          <div className="flex items-center gap-1.5 border-b border-line bg-soft px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300" /><span className="h-2.5 w-2.5 rounded-full bg-stone-300" /><span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            <span className="ml-2 rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">applyzen.app/editor</span>
          </div>
          <div className="grid grid-cols-[1fr_1.4fr]">
            <div className="space-y-2.5 border-r border-line p-4">
              <div className="h-2 w-20 rounded bg-ink/80" /><div className="h-1.5 w-28 rounded bg-stone-200" />
              {[75, 90, 60, 82].map((w, i) => (
                <div key={i} className="rounded-lg border border-line p-2">
                  <div className="h-1.5 rounded bg-stone-200" style={{ width: w + '%' }} />
                  <div className="mt-1.5 h-1.5 w-2/3 rounded bg-stone-100" />
                </div>
              ))}
              <div className="rounded-lg bg-accent-50 p-2 text-[11px] font-semibold text-accent-800 dark:bg-accent-600/20 dark:text-accent-200">✦ Lead with the outcome… <span className="ml-1 font-normal">Accept · Edit</span></div>
            </div>
            <div className="bg-soft p-4">
              <div className="rounded-md bg-white p-4 shadow-doc">
                <div className="text-[15px] font-extrabold tracking-tight">Maya Krishnan</div>
                <div className="text-[10px] font-semibold text-accent-700">Product Designer</div>
                <div className="my-2 h-px bg-stone-200" />
                {[92, 100, 85, 96, 70].map((w, i) => <div key={i} className="mb-1.5 h-1.5 rounded bg-stone-200" style={{ width: w + '%' }} />)}
                <div className="mt-2 flex gap-1.5">{['Figma', 'Research', 'Systems'].map(s => <span key={s} className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold">{s}</span>)}</div>
              </div>
              <div className="mx-auto mt-2 w-fit rounded-full bg-ink px-3 py-1 text-[10px] font-semibold text-paper">78% overlap · Senior UI Designer</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="max-w-[30ch] text-[28px] font-extrabold tracking-tight">Everything between “blank page” and “applied”.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Feature icon={FileText} title="Structured editor, live document" desc="Edit sections with proper labels and validation; watch a true A4 preview update as you type. Four ATS-conscious templates included." />
            <Feature icon={ScanSearch} title="Job-description matching" desc="Paste any posting. See required skills, what you already demonstrate, and what's missing — as a text estimate, never a fake hiring probability." />
            <Feature icon={Zap} title="Writing assistance that cites evidence" desc="Get bullet rewrites that strengthen verbs and add numbers. Every suggestion can be accepted, edited, or rejected. Nothing is invented about you." />
            <Feature icon={KanbanSquare} title="Application tracker" desc="Company, role, date, and status from Saved to Offer. Search, filter, and update in one table that works on your phone." />
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-[28px] font-extrabold tracking-tight">How it works</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {[['1', 'Create or import', 'Start blank or from a sample. Your draft autosaves locally.'], ['2', 'Paste the job', 'The analyzer extracts required and preferred skills.'], ['3', 'Strengthen bullets', 'Accept AI-assisted rewrites with verbs and metrics.'], ['4', 'Export & track', 'Print to PDF, then log the application status.']].map(([n, t, d]) => (
            <li key={n} className="card p-5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-50 text-sm font-extrabold text-accent-800 dark:bg-accent-600/20 dark:text-accent-200">{n}</span>
              <p className="mt-3 text-[15px] font-bold">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* TEMPLATES strip */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex items-end justify-between"><h2 className="text-[28px] font-extrabold tracking-tight">Templates with a point of view</h2><Link to="/templates" className="btn-ghost">View all <ArrowRight size={15} /></Link></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {[['Classic Professional', 'Serif · ruled sections', 'font-serif'], ['Modern Minimal', 'Sans · quiet dividers', 'font-sans'], ['Technical', 'Mono · dense detail', 'font-mono'], ['Compact One-Page', 'Two-column · tight', 'font-sans']].map(([n, d, f]) => (
              <Link key={n} to="/templates" className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-doc">
                <div className="bg-soft p-4"><div className={`rounded bg-white p-3 shadow-sm ${f}`}><div className="h-2 w-2/3 rounded bg-ink/70" /><div className="mt-1.5 h-1 w-1/2 rounded bg-accent-600/60" /><div className="mt-2 space-y-1">{[90, 95, 80].map((w, i) => <div key={i} className="h-1 rounded bg-stone-200" style={{ width: w + '%' }} />)}</div></div></div>
                <div className="p-4"><p className="text-sm font-bold group-hover:text-accent-700">{n}</p><p className="text-xs text-muted">{d}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-[28px] font-extrabold tracking-tight">Simple pricing</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Price name="Starter" price="Free" desc="For trying things out." feats={['1 resume', '2 templates', 'Local autosave', 'Print to PDF']} cta="Start free" />
          <Price name="Pro" price="₹499/mo" desc="For active job seekers." feats={['Unlimited resumes', 'All 4 templates', 'Job analyzer + AI rewrites', 'Application tracker']} cta="Go Pro" hot />
          <Price name="Team" price="Contact us" desc="For placement cells & coaches." feats={['Everything in Pro', 'Shared template library', 'Review workflows']} cta="Talk to us" />
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-[13px] text-muted"><ShieldCheck size={15} /> This prototype runs fully in your browser — no payment or account required.</p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-2xl bg-ink px-8 py-14 text-center text-paper">
          <h2 className="mx-auto max-w-[24ch] text-3xl font-extrabold tracking-tight">Stop staring at a blank page. Start with structure.</h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-[15px] text-paper/70">Open the editor, paste a job description, and leave with a tailored, exportable resume.</p>
          <Link to="/editor" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-paper px-6 py-3 text-[15px] font-bold text-ink transition hover:bg-accent-100 dark:hover:bg-white">Open the resume editor <ArrowRight size={16} /></Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function Feature({ icon: Icon, title, desc }) {
  return <div className="card p-5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-50 text-accent-700 dark:bg-accent-600/20 dark:text-accent-200"><Icon size={18} /></span><p className="mt-3 text-[15px] font-bold">{title}</p><p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p></div>;
}
function Price({ name, price, desc, feats, cta, hot }) {
  return <div className={`card p-6 ${hot ? 'border-accent-600 ring-2 ring-accent-600/20' : ''}`}>{hot && <span className="chip mb-3 !border-accent-200 !bg-accent-50 !text-accent-800 dark:!bg-accent-600/20 dark:!text-accent-200">Most popular</span>}<p className="text-sm font-bold">{name}</p><p className="mt-1 text-2xl font-extrabold tracking-tight">{price}</p><p className="mt-1 text-sm text-muted">{desc}</p><ul className="mt-4 space-y-2">{feats.map(f => <li key={f} className="flex items-center gap-2 text-sm"><Check size={15} className="text-emerald-600" />{f}</li>)}</ul><Link to="/dashboard" className={`${hot ? 'btn-primary' : 'btn-secondary'} mt-5 w-full`}>{cta}</Link></div>;
}
