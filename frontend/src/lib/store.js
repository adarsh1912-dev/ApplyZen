// Central mock-data / service layer. Swap with API calls later without changing UI.
const LS = { resumes: 'az_resumes_v1', apps: 'az_apps_v1', active: 'az_active_v1' };

// One-time migration: carry offline drafts over from the pre-rename (rp_) keys.
try {
  for (const [key, legacy] of [
    [LS.resumes, 'rp_resumes_v1'],
    [LS.apps, 'rp_apps_v1'],
    [LS.active, 'rp_active_v1'],
  ]) {
    if (localStorage.getItem(key) == null && localStorage.getItem(legacy) != null) {
      localStorage.setItem(key, localStorage.getItem(legacy));
    }
  }
} catch { /* ignore */ }

export const TEMPLATES = [
  { id: 'classic', name: 'Classic Professional', desc: 'Serif headlines, ruled sections. Finance, law, consulting.', tags: ['ATS-safe', 'Serif'] },
  { id: 'minimal', name: 'Modern Minimal', desc: 'Clean sans, generous whitespace. Product, design, marketing.', tags: ['ATS-safe', 'Sans'] },
  { id: 'technical', name: 'Technical', desc: 'Dense, mono details, skill groups. Software & data roles.', tags: ['ATS-safe', 'Dense'] },
  { id: 'compact', name: 'Compact One-Page', desc: 'Two-column, tight spacing for experienced hires.', tags: ['1-page', 'Two-col'] },
  { id: 'engineer', name: 'Engineer Pro', desc: 'Grouped skills, impact-first bullets. Backend, frontend & platform SWEs.', tags: ['ATS-safe', 'SWE'] },
  { id: 'terminal', name: 'Terminal', desc: 'Monospace CLI aesthetic — developer personality that still prints clean.', tags: ['Mono', 'Dev'] },
  { id: 'opensource', name: 'Open Source', desc: 'Projects-forward layout with link chips for full-stack & OSS engineers.', tags: ['Projects', 'Dev'] },
  { id: 'staff', name: 'Staff Engineer', desc: 'Senior IC polish: scope, systems thinking, dense skill bar.', tags: ['Senior', 'ATS-safe'] },
];

export function blankResume(title = 'Untitled resume') {
  return {
    id: 'r_' + Math.random().toString(36).slice(2, 9),
    title, template: 'minimal', updatedAt: Date.now(),
    personal: { name: '', role: '', email: '', phone: '', location: '', website: '', linkedin: '' },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    visible: { summary: true, experience: true, education: true, skills: true, projects: true, certifications: true },
    order: ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
  };
}

export function sampleResume() {
  const r = blankResume('Product Designer — 2026');
  r.template = 'minimal';
  r.personal = { name: 'Maya Krishnan', role: 'Product Designer', email: 'maya.k@example.com', phone: '+91 98200 12345', location: 'Bengaluru, IN', website: 'mayak.design', linkedin: 'linkedin.com/in/mayak' };
  r.summary = 'Product designer with 4 years across B2B SaaS. Led onboarding redesign lifting trial-to-paid conversion 18%. Systems thinker, strong on research and prototyping.';
  r.experience = [
    { id: 'e1', role: 'Product Designer', company: 'Northloop', dates: '2023 — Present', bullets: ['Redesigned onboarding flow; trial-to-paid conversion rose 18% across 40k users.', 'Built design system with 60+ components adopted by 3 product squads.'] },
    { id: 'e2', role: 'UI Designer', company: 'Paperplane', dates: '2021 — 2023', bullets: ['Shipped analytics dashboard used by 12k weekly teams.', 'Ran 25+ usability sessions; cut support tickets for reporting by 30%.'] },
  ];
  r.education = [{ id: 'd1', school: 'NID Ahmedabad', degree: 'B.Des, Communication Design', dates: '2017 — 2021' }];
  r.skills = ['Figma', 'Design systems', 'User research', 'Prototyping', 'Interaction design', 'SQL basics'];
  r.projects = [{ id: 'p1', name: 'Onboard.js — open-source checklist', detail: '2.1k stars; drop-in onboarding components for React.' }];
  r.certifications = [{ id: 'c1', name: 'NN/g UX Certification', detail: '2023' }];
  r.updatedAt = Date.now();
  return r;
}

export function loadResumes() {
  try {
    const raw = localStorage.getItem(LS.resumes);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const seed = [sampleResume()];
  localStorage.setItem(LS.resumes, JSON.stringify(seed));
  return seed;
}
export function saveResumes(list) { localStorage.setItem(LS.resumes, JSON.stringify(list)); }
export function getActiveId() { return localStorage.getItem(LS.active); }
export function setActiveId(id) { localStorage.setItem(LS.active, id); }

const SEED_APPS = [
  { id: 'a1', company: 'Razorpay', title: 'Product Designer', date: '2026-10-02', status: 'Interview', notes: 'Round 2 with hiring manager.', url: '' },
  { id: 'a2', company: 'Zeta', title: 'Senior UI Designer', date: '2026-09-28', status: 'Applied', notes: '', url: '' },
  { id: 'a3', company: 'Figma', title: 'Design Intern', date: '2026-09-10', status: 'Saved', notes: '', url: '' },
];
export function loadApps() {
  try { const raw = localStorage.getItem(LS.apps); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
  localStorage.setItem(LS.apps, JSON.stringify(SEED_APPS));
  return SEED_APPS;
}
export function saveApps(list) { localStorage.setItem(LS.apps, JSON.stringify(list)); }

export const STATUSES = ['Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected'];

// ---- Deterministic mock "AI" helpers (clearly simulated) ----
const SKILL_LEXICON = ['react','javascript','typescript','node','python','sql','figma','research','prototyping','communication','leadership','testing','git','aws','docker','machine learning','data analysis','agile','seo','marketing','excel','customer support'];

export function extractSkills(text = '') {
  const low = text.toLowerCase();
  return SKILL_LEXICON.filter(s => low.includes(s)).map(s => s.replace(/\b\w/g, c => c.toUpperCase()));
}

export function analyzeMatch(resume, jdText) {
  const jdSkills = extractSkills(jdText);
  const resumeText = JSON.stringify(resume).toLowerCase();
  const matched = jdSkills.filter(s => resumeText.includes(s.toLowerCase()));
  const missing = jdSkills.filter(s => !resumeText.includes(s.toLowerCase()));
  const coverage = jdSkills.length ? Math.round((matched.length / jdSkills.length) * 100) : 0;
  const band = coverage >= 70 ? 'Strong overlap' : coverage >= 40 ? 'Partial overlap' : 'Limited overlap';
  return {
    jdSkills, matched, missing, coverage, band,
    simulated: true,
    suggestions: missing.slice(0, 5).map(s => `Add evidence of “${s}” — a bullet showing where you used it and the outcome.`),
    strengths: matched.slice(0, 5).map(s => `“${s}” appears in your resume with concrete context.`),
  };
}

const WEAK = [/responsible for/i, /worked on/i, /helped with/i, /various tasks/i, /\bgood\b.*\bskills\b/i];
export function bulletSuggestions(bullet) {
  const out = [];
  if (!bullet || bullet.length < 20) out.push({ kind: 'Clarity', text: 'Too short to evaluate — add what you did, how, and the result.', rewrite: '' });
  if (WEAK.some(rx => rx.test(bullet))) out.push({ kind: 'Impact', text: 'Replace weak opener (“responsible for”) with a strong verb + metric.', rewrite: bullet.replace(/responsible for|worked on|helped with/i, 'Led').trim() });
  if (!/\d/.test(bullet)) out.push({ kind: 'Evidence', text: 'No number or outcome. Add scale, time, or result (%, users, days).', rewrite: '' });
  if (bullet.split(' ').length > 32) out.push({ kind: 'Concision', text: 'Long bullet — split into two or cut filler to one line.', rewrite: '' });
  if (!out.length) out.push({ kind: 'Polish', text: 'Solid bullet. Consider starting with the outcome for skimmability.', rewrite: '' });
  return out;
}

export function improveBullet(bullet) {
  let s = bullet.replace(/responsible for|worked on|helped with/i, 'Led').trim();
  if (!/\d/.test(s)) s += ' — impacting 10k+ users.';
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.]$/.test(s)) s += '.';
  return s;
}

export function exportPdf(resumeId, title) {
  // Real, readable PDF via print: open print dialog scoped to document via CSS.
  window.print();
  return { ok: true, note: `Used browser print-to-PDF for “${title}”.` };
}

export function fmtDate(ts) {
  try { return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; }
}
