import { Link } from 'react-router-dom';
import { ArrowRight, Check, KanbanSquare, LayoutTemplate, ScanSearch, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    number: '01',
    icon: Sparkles,
    title: 'AI-assisted writing',
    body: 'Turn flat bullets into evidence-led lines with stronger verbs and real metrics. Accept, edit, or reject every suggestion.',
  },
  {
    number: '02',
    icon: LayoutTemplate,
    title: 'Modern resume templates',
    body: 'Eight ATS-conscious layouts, from editorial serif to a clean engineering sheet. Switch the look without losing content.',
  },
  {
    number: '03',
    icon: ScanSearch,
    title: 'Job-description matching',
    body: 'See which skills your resume demonstrates, what is missing, and exactly where to add evidence — not a fake hiring score.',
  },
  {
    number: '04',
    icon: KanbanSquare,
    title: 'Application tracking',
    body: 'Keep every role, stage, and next action in one calm view. Move from saved to offer without losing the thread.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Start from what you have',
    body: 'Begin blank, import a PDF or DOCX, or open a sample. Everything autosaves as you type.',
  },
  {
    number: '02',
    title: 'Match it to the posting',
    body: 'Paste the job description. See the overlap, the gaps, and the evidence already in your resume.',
  },
  {
    number: '03',
    title: 'Tailor, export, track',
    body: 'Review AI changes before applying them, print a clean A4 PDF, and keep the application moving.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    suffix: '',
    description: 'For trying the workflow without an account.',
    features: ['Unlimited local drafts', 'All eight templates', 'Print to real PDF', 'Job matching'],
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    suffix: '/ month',
    description: 'For an active search that needs leverage.',
    features: ['AI tailoring and import', 'Application tracker', 'Version history', 'Cloud sync across devices'],
    cta: 'Start free',
    featured: true,
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="border-y border-line bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-title">The workspace</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
              A quieter, sharper resume workflow.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Everything is built around the document — not around a dashboard. Edit honestly, tailor deliberately, and export something you would actually send.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="card card-hover p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-50 text-accent-700 dark:bg-accent-600/15 dark:text-accent-200">
                  <feature.icon size={18} strokeWidth={2.1} />
                </span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted">{feature.number}</span>
              </div>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-ink">{feature.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-2xl">
          <p className="section-title">How it works</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
            A clear path from draft to offer.
          </h2>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {STEPS.map((step) => (
            <div key={step.number} className="relative">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-line bg-paper font-mono text-[11px] font-semibold text-accent-700 dark:text-accent-300">
                {step.number}
              </span>
              <h3 className="mt-5 text-[16px] font-semibold tracking-tight text-ink">{step.title}</h3>
              <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-title">Pricing</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
            Simple pricing. No surprises.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Start free, keep your drafts local, and upgrade when you want cloud sync and AI assistance.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          {PLANS.map((plan) => (
            <article key={plan.name} className={`card p-6 sm:p-7 ${plan.featured ? 'border-accent-600/30 ring-1 ring-accent-600/10' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-ink">{plan.name}</p>
                  <p className="mt-1 text-sm text-muted">{plan.description}</p>
                </div>
                {plan.featured && <span className="chip chip-accent">Most popular</span>}
              </div>

              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-[-0.04em] text-ink">{plan.price}</span>
                {plan.suffix && <span className="text-xs font-medium text-muted">{plan.suffix}</span>}
              </p>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted">
                    <Check size={14} className="mt-0.5 shrink-0 text-accent-600 dark:text-accent-300" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link to="/dashboard" className={`${plan.featured ? 'btn-primary' : 'btn-secondary'} mt-7 w-full`}>
                {plan.cta} <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-xl text-center text-[11px] leading-relaxed text-muted">
          This is a portfolio build. No payment is collected — every feature is available in the demo.
        </p>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
      <div className="overflow-hidden rounded-2xl bg-accent-950 px-6 py-12 text-accent-foreground sm:px-10 sm:py-14 lg:px-14">
        <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-200/80">Start with structure</p>
            <h2 className="mt-3 max-w-[18ch] text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Stop staring at a blank page.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-accent-100/85">
              Open the editor, paste a job description, and leave with a tailored, exportable resume.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row lg:justify-end">
            <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-50 px-4 py-2.5 text-sm font-semibold text-accent-950 transition-colors duration-150 hover:bg-accent-100">
              Build my resume <ArrowRight size={15} />
            </Link>
            <Link to="/templates" className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent-200/30 px-4 py-2.5 text-sm font-semibold text-accent-100 transition-colors duration-150 hover:bg-accent-900">
              Browse templates
            </Link>
          </div>
        </div>
        <p className="mt-8 text-[11px] text-accent-200/70">No account needed to try · Data stays in your browser · Print to real PDF</p>
      </div>
    </section>
  );
}
