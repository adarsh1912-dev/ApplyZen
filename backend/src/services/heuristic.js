// Deterministic heuristic engine: skill-lexicon extraction + text overlap.
// NEVER invents qualifications — every claim cites text already present.
// Results are always labeled engine: 'heuristic' so clients can say so.
const SKILL_LEXICON = [
  'react', 'javascript', 'typescript', 'node', 'python', 'sql', 'figma',
  'research', 'prototyping', 'communication', 'leadership', 'testing',
  'git', 'aws', 'docker', 'machine learning', 'data analysis', 'agile',
  'seo', 'marketing', 'excel', 'customer support', 'java', 'go',
  'kubernetes', 'ci/cd', 'rest', 'graphql', 'mentoring', 'stakeholder management',
];

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function extractSkills(text = '') {
  const low = String(text).toLowerCase();
  return SKILL_LEXICON.filter((s) => low.includes(s)).map(titleCase);
}

const WEAK_OPENERS = [/responsible for/i, /worked on/i, /helped with/i, /various tasks/i];

function resumeText(content) {
  return JSON.stringify(content ?? {}).toLowerCase();
}

export function heuristicAnalysis(content, jobDescription) {
  const text = resumeText(content);
  const required = extractSkills(jobDescription);
  const matched = required.filter((s) => text.includes(s.toLowerCase()));
  const missing = required.filter((s) => !text.includes(s.toLowerCase()));
  const coverage = required.length ? Math.round((matched.length / required.length) * 100) : 0;
  const band = coverage >= 70 ? 'Strong overlap' : coverage >= 40 ? 'Partial overlap' : 'Limited overlap';

  // Cite the roles whose text mentions each matched skill (evidence, not invention).
  const roles = Array.isArray(content?.experience) ? content.experience : [];
  const relevantExperience = [];
  for (const r of roles.slice(0, 8)) {
    const blob = JSON.stringify(r).toLowerCase();
    const hits = matched.filter((s) => blob.includes(s.toLowerCase()));
    if (hits.length > 0 && relevantExperience.length < 10) {
      relevantExperience.push(`${r.role || 'Role'} at ${r.company || 'company'} touches: ${hits.slice(0, 4).join(', ')}.`);
    }
  }

  // Bullet-level checks reference bullet position only — no fabricated rewrites.
  const suggestions = [];
  const bullets = roles.flatMap((r) => (Array.isArray(r.bullets) ? r.bullets : []));
  bullets.slice(0, 12).forEach((b, idx) => {
    const s = String(b ?? '');
    if (s.length > 0 && s.length < 20 && suggestions.length < 10) {
      suggestions.push(`Bullet ${idx + 1} is very short — expand it with what you did and the outcome.`);
    } else if (WEAK_OPENERS.some((rx) => rx.test(s)) && suggestions.length < 10) {
      suggestions.push(`Bullet ${idx + 1} opens weakly — start with a strong verb and add a metric.`);
    } else if (s.length >= 20 && !/\d/.test(s) && suggestions.length < 10) {
      suggestions.push(`Bullet ${idx + 1} states no number — add scale, time, or result if you have one.`);
    }
  });
  for (const m of missing.slice(0, 5)) {
    if (suggestions.length >= 10) break;
    suggestions.push(`“${m}” is requested but absent — add a bullet only where you genuinely have that experience.`);
  }

  return {
    coverage,
    band,
    required_skills: required,
    matched_skills: matched,
    missing_skills: missing,
    strengths: matched.slice(0, 5).map((s) => `“${s}” appears in your resume with concrete context.`),
    suggestions,
    relevant_experience: relevantExperience,
    recommendations: [
      'Mirror the posting’s vocabulary for skills you truly hold.',
      'Add one evidence-backed bullet per missing skill — never invent qualifications.',
      'Re-run this analysis after editing the resume.',
    ],
    warnings: [
      'Heuristic estimate from keyword overlap only — not a hiring probability.',
    ],
  };
}
