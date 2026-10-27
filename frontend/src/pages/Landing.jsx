import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Footer, MarketingNav } from '../components/layout/Chrome';
import HeroPreview from '../components/marketing/HeroPreview';
import ProductShowcase from '../components/marketing/ProductShowcase';
import { FeatureGrid, FinalCTA, HowItWorks, PricingSection } from '../components/marketing/LandingSections';

const TRUST = [
  'No account needed to try',
  'Data stays in your browser',
  'Print to real PDF',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <MarketingNav />

      <main>
        <section className="paper-canvas relative overflow-hidden border-b border-line/70">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.02fr_.98fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-24">
            <div className="max-w-2xl">
              <span className="chip chip-accent gap-1.5">
                <Sparkles size={13} />
                AI-assisted · ATS-conscious · Private by default
              </span>

              <h1 className="mt-6 text-balance text-[42px] font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-[56px] lg:text-[64px]">
                A resume that <span className="text-accent-700 dark:text-accent-300">gets you hired.</span>
              </h1>

              <p className="mt-6 max-w-xl text-[15.5px] leading-7 text-muted">
                Write sharper bullets, match your resume to any posting, and keep every application moving — without inventing a single fact.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/dashboard" className="btn-primary !px-5 !py-3 !text-[14px]">
                  Build my resume <ArrowRight size={16} />
                </Link>
                <Link to="/templates" className="btn-secondary !px-5 !py-3 !text-[14px]">
                  Browse templates
                </Link>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5 text-[12.5px] font-medium text-muted">
                {TRUST.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check size={14} className="text-accent-600 dark:text-accent-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <HeroPreview />
          </div>
        </section>

        <FeatureGrid />
        <ProductShowcase />
        <HowItWorks />
        <PricingSection />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
