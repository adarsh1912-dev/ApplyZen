import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { ResumeSheet } from '../resume/ResumePreview';
import { heroResume, heroScore } from '../../lib/marketing';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

export default function HeroPreview() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  const handleMove = (event) => {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    });
  };
  const reset = () => setTilt({ x: 0, y: 0 });
  const shiftX = (factor) => (reduced ? 0 : tilt.x * factor);
  const shiftY = (factor) => (reduced ? 0 : tilt.y * factor);

  return (
    <div
      className="relative mx-auto mt-10 w-full max-w-[560px] lg:mt-0"
      onPointerMove={handleMove}
      onPointerLeave={reset}
      aria-hidden="true"
    >
      <div className="hero-stage relative h-[440px] sm:h-[520px] lg:h-[560px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="hero-sheet opacity-55"
            style={{ transform: `translate3d(${shiftX(-10)}px, ${shiftY(-8)}px, 0) rotate(-8deg) scale(calc(var(--hero-scale) * 0.82))` }}
          >
            <ResumeSheet resume={heroResume} template="engineer" className="rounded-sm shadow-doc ring-1 ring-black/5" />
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="hero-sheet opacity-80"
            style={{ transform: `translate3d(${shiftX(8)}px, ${shiftY(-5)}px, 0) rotate(5deg) scale(calc(var(--hero-scale) * 0.92))` }}
          >
            <ResumeSheet resume={heroResume} template="classic" className="rounded-sm shadow-doc ring-1 ring-black/5" />
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="hero-sheet"
            style={{ transform: `translate3d(${shiftX(14)}px, ${shiftY(10)}px, 0) rotate(-1deg) scale(var(--hero-scale))` }}
          >
            <ResumeSheet resume={heroResume} template="minimal" className="rounded-sm shadow-float ring-1 ring-black/5" />
          </div>
        </div>

        <div className="pointer-events-none absolute right-0 top-1 z-30 hidden items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1.5 text-[11px] font-semibold text-accent-800 shadow-sm sm:flex dark:border-accent-600/30 dark:bg-accent-950 dark:text-accent-200">
          <Sparkles size={13} /> Tailored for Senior Frontend Engineer
        </div>

        <div className="absolute -bottom-2 left-0 z-30 w-[216px] rounded-xl border border-line bg-surface p-4 shadow-float sm:bottom-2 sm:-left-3 sm:w-[236px]">
          <div className="flex items-center gap-3">
            <div
              className="relative h-14 w-14 shrink-0 rounded-full"
              style={{ background: `conic-gradient(rgb(var(--success)) 0 ${heroScore.coverage}%, rgb(var(--line)) ${heroScore.coverage}% 100%)` }}
            >
              <div className="absolute inset-[4px] grid place-items-center rounded-full bg-surface text-[13px] font-bold tabular-nums text-ink">
                {heroScore.coverage}%
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">ATS match</p>
              <p className="mt-0.5 text-[13px] font-semibold text-ink">{heroScore.band}</p>
              <p className="text-[10.5px] text-muted">Example analysis</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {heroScore.matched.slice(0, 3).map((skill) => (
              <span key={skill} className="chip !px-2 !py-0.5 !text-[9.5px]">{skill}</span>
            ))}
            <span className="chip chip-warning !px-2 !py-0.5 !text-[9.5px]">1 gap</span>
          </div>
        </div>
      </div>
    </div>
  );
}
