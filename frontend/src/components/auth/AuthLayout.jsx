import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../layout/Chrome';
import { ResumeSheet } from '../resume/ResumePreview';
import { heroResume } from '../../lib/marketing';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[.46fr_.54fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-accent-950 p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-accent-50 text-[15px] font-bold text-accent-950">A</span>
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-accent-50">Apply<span className="text-accent-300">Zen</span></span>
        </div>

        <div className="my-8">
          <div className="mx-auto h-[460px] w-[328px] overflow-hidden" aria-hidden="true">
            <div className="origin-top-left rotate-[-3deg] scale-[.4]">
              <ResumeSheet resume={heroResume} template="minimal" className="rounded-sm shadow-float ring-1 ring-black/10" />
            </div>
          </div>
          <div className="mx-auto -mt-4 flex w-fit items-center gap-2 rounded-full border border-accent-700 bg-accent-900 px-3 py-1.5 text-[10px] font-medium text-accent-100 shadow-float">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-300" /> Saved · version history on
          </div>
        </div>

        <div className="max-w-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-200/70">The writing desk</p>
          <p className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-[-0.03em] text-accent-50">A resume that gets you hired.</p>
          <p className="mt-3 text-[12.5px] leading-relaxed text-accent-100/75">Structured editing, honest matching, and a document that prints exactly as it looks.</p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Logo />
          <Link to="/" className="btn-ghost"><ArrowLeft size={14} /> Back home</Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-8">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
