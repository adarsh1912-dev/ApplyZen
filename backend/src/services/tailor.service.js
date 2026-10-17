import { getResume } from '../repositories/resumes.repo.js';
import { AppError, notFound } from '../utils/http.js';
import { env } from '../config/env.js';
import { llmConfigured, tailorResume } from './llm-provider.js';

const notConfigured = () => new AppError(
  503,
  'AI_NOT_CONFIGURED',
  'AI tailoring is not configured on this server.',
);
const providerFailed = () => new AppError(
  502,
  'AI_PROVIDER_FAILED',
  'The AI provider could not tailor this résumé. Try again in a moment.',
);

/**
 * AI rewrite of a resume for a specific posting. Nothing is persisted here:
 * the client reviews the result and then applies it (with a version snapshot)
 * or saves it as a copy.
 *
 * Integrity rules enforced regardless of what the model returns:
 * - same number of experience entries (otherwise the call fails: a dropped or
 *   invented role is never saved);
 * - education, projects, certifications, contact details, visibility, and
 *   section order always come from the stored resume;
 * - bullets are only replaced when the model returned at least one.
 */
export async function tailorUserResume({ userId, resumeId, jobDescription }) {
  const resume = await getResume({ userId, resumeId });
  if (!resume) throw notFound('Resume not found.');
  if (!llmConfigured()) throw notConfigured();

  let out;
  try {
    out = await tailorResume(resume.content, jobDescription);
  } catch (err) {
    // Provider details stay server-side; the client gets a stable code.
    console.error('[tailor] LLM provider failed:', err.message);
    throw providerFailed();
  }

  const original = resume.content;
  if (out.experience.length !== original.experience.length) throw providerFailed();

  const experience = original.experience.map((e, i) => {
    const t = out.experience.find((x) => x.id && x.id === e.id) ?? out.experience[i];
    return { ...e, bullets: t.bullets.length ? t.bullets : e.bullets };
  });

  const content = {
    ...original,
    personal: { ...original.personal, role: out.role.trim() ? out.role : original.personal.role },
    summary: out.summary.trim() ? out.summary : original.summary,
    skills: out.skills.length ? out.skills : original.skills,
    experience,
  };

  return { content, changes: out.changes, warnings: out.warnings, engine: 'llm', model: env.llm.model };
}
