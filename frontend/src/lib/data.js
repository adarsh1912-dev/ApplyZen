// Unified data layer. Talks to the Applyzen API when VITE_API_URL is set;
// otherwise falls back to localStorage so the app keeps working offline.
// Pages only ever see frontend-native shapes — server field mapping lives here.
import { api, apiEnabled, ApiError } from './api';
import {
  TEMPLATES, blankResume, loadResumes, saveResumes, loadApps, saveApps, analyzeMatch,
} from './store';

/** True when a backend is configured (same switch auth uses). */
export const isOnline = () => apiEnabled();

const now = () => Date.now();
const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);

// ---------- shape mappers (server ⇄ UI) ----------

const contentFromUi = (r) => ({
  personal: r.personal,
  summary: r.summary,
  experience: r.experience,
  education: r.education,
  skills: r.skills,
  projects: r.projects,
  certifications: r.certifications,
  visible: r.visible,
  order: r.order,
});

const resumeFromApi = (row) => ({
  ...blankResume(),
  ...row.content,
  id: row.id,
  title: row.title,
  template: row.template_key,
  updatedAt: Date.parse(row.updated_at),
  updatedAtIso: row.updated_at,
});

const appFromApi = (a) => ({
  id: a.id,
  company: a.company,
  title: a.job_title,
  date: a.applied_on ?? '',
  status: a.status,
  notes: a.notes ?? '',
});

const appToApi = (a) => ({
  company: a.company,
  job_title: a.title,
  status: a.status,
  applied_on: a.date ? a.date : null,
  notes: a.notes ? a.notes : null,
});

const analysisFromApi = (analysis) => ({
  coverage: analysis.result.coverage,
  band: analysis.result.band,
  matched: analysis.result.matched_skills ?? [],
  missing: analysis.result.missing_skills ?? [],
  strengths: analysis.result.strengths ?? [],
  suggestions: analysis.result.suggestions ?? [],
  recommendations: analysis.result.recommendations ?? [],
  warnings: analysis.result.warnings ?? [],
  engine: analysis.engine,
  simulated: analysis.engine === 'heuristic',
});

// ---------- localStorage helpers (offline mode) ----------

function lsPatchResume(id, patch) {
  const next = loadResumes().map((r) => (r.id === id ? { ...r, ...patch, updatedAt: now() } : r));
  saveResumes(next);
  return next.find((r) => r.id === id) ?? null;
}

function lsPatchApp(id, patch) {
  const next = loadApps().map((a) => (a.id === id ? { ...a, ...patch } : a));
  saveApps(next);
  return next.find((a) => a.id === id) ?? null;
}

// ---------- resumes ----------

/** List for pickers/dashboard. Online rows omit content (fetch via getResume). */
export async function listResumes() {
  if (!isOnline()) return loadResumes();
  const { items } = await api.resumes.list({ per_page: 100 });
  return items.map((r) => ({
    id: r.id,
    title: r.title,
    template: r.template_key,
    updatedAt: Date.parse(r.updated_at),
    updatedAtIso: r.updated_at,
  }));
}

export async function getResume(id) {
  if (!isOnline()) return loadResumes().find((r) => r.id === id) ?? null;
  const { resume } = await api.resumes.get(id);
  return resumeFromApi(resume);
}

export async function createResume({ title } = {}) {
  if (!isOnline()) {
    const r = blankResume(title);
    saveResumes([r, ...loadResumes()]);
    return r;
  }
  const { resume } = await api.resumes.create({
    title: title || 'Untitled resume',
    template_key: 'minimal',
    content: contentFromUi(blankResume()),
  });
  return resumeFromApi(resume);
}

/** Partial update (title/template only) — used by the Templates page. */
export async function patchResume(id, patch) {
  if (!isOnline()) return lsPatchResume(id, patch);
  const body = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.template !== undefined) body.template_key = patch.template;
  const { resume } = await api.resumes.patch(id, body);
  return resumeFromApi(resume);
}

/**
 * Full autosave of an edited resume. Online this PATCHes with optimistic
 * concurrency; a stale token (another tab wrote first) is refreshed and
 * retried once so the latest local edit wins.
 */
export async function saveResumeFull(resume) {
  const fields = { title: resume.title, template: resume.template, ...contentFromUi(resume) };
  if (!isOnline()) return lsPatchResume(resume.id, fields);

  const body = { title: resume.title, template_key: resume.template, content: contentFromUi(resume) };
  if (resume.updatedAtIso) body.expected_updated_at = resume.updatedAtIso;
  try {
    const { resume: saved } = await api.resumes.patch(resume.id, body);
    return resumeFromApi(saved);
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      const fresh = await getResume(resume.id);
      if (fresh?.updatedAtIso) {
        const { resume: saved } = await api.resumes.patch(resume.id, {
          ...body,
          expected_updated_at: fresh.updatedAtIso,
        });
        return resumeFromApi(saved);
      }
    }
    throw e;
  }
}

export async function deleteResume(id) {
  if (!isOnline()) {
    saveResumes(loadResumes().filter((r) => r.id !== id));
    return null;
  }
  return api.resumes.remove(id);
}

export async function duplicateResume(id) {
  if (!isOnline()) {
    const list = loadResumes();
    const src = list.find((r) => r.id === id);
    if (!src) return null;
    const copy = {
      ...JSON.parse(JSON.stringify(src)),
      id: uid('r'),
      title: src.title + ' (copy)',
      updatedAt: now(),
    };
    saveResumes([copy, ...list]);
    return copy;
  }
  const { resume } = await api.resumes.duplicate(id);
  return resumeFromApi(resume);
}

/** Snapshot current content as a new version. Offline: no-op (returns null). */
export async function snapshotResume(id) {
  if (!isOnline()) return null;
  const { version } = await api.resumes.snapshot(id);
  return version;
}

// ---------- tailoring (autoconfigure) ----------

/**
 * AI-rewrite the resume for a posting. Online + configured provider only.
 * Returns { content, changes, warnings, engine, model } without persisting.
 */
export async function tailorResume({ resumeId, jobDescription }) {
  if (!isOnline()) throw new Error('Autoconfigure needs the online mode.');
  const { tailored } = await api.resumes.tailor(resumeId, { job_description: jobDescription });
  return tailored;
}

/**
 * Persist tailored content. Default: overwrite the resume in place after
 * snapshotting the current version as an undo point. asCopy: duplicate first
 * and write into the copy, leaving the original untouched.
 */
export async function applyTailoredResume({ resumeId, content, asCopy = false }) {
  if (!isOnline()) throw new Error('Autoconfigure needs the online mode.');
  const base = asCopy ? await duplicateResume(resumeId) : await getResume(resumeId);
  if (!base) throw new Error('Resume not found.');
  if (!asCopy) await snapshotResume(resumeId);
  const title = asCopy ? base.title.replace(/ \(copy\)$/, '') + ' — tailored' : base.title;
  return saveResumeFull({ ...base, ...content, id: base.id, title, template: base.template });
}

// ---------- import (file → résumé) ----------

/** Chunked base64: works in browsers and Node, avoids call-stack limits. */
const bytesToBase64 = (bytes) => {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
};

/**
 * Read a picked File, then import it server-side: text extraction (PDF/DOCX/
 * TXT/MD) + AI structuring into a new résumé. Online + provider required.
 * Returns { resume, warnings, model }.
 */
export async function importResumeFromFile(file) {
  if (!isOnline()) throw new Error('Résumé import needs the online mode.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Files are limited to 5 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { resume, warnings, model } = await api.resumes.importFile({
    filename: file.name,
    data_base64: bytesToBase64(bytes),
  });
  return { resume: resumeFromApi(resume), warnings, model };
}

// ---------- applications ----------

export async function listApplications({ perPage } = {}) {
  if (!isOnline()) {
    const all = loadApps();
    return perPage ? all.slice(0, perPage) : all;
  }
  const { items } = await api.applications.list({ per_page: perPage ?? 100 });
  return items.map(appFromApi);
}

export async function applicationStats() {
  if (!isOnline()) {
    const by = { Saved: 0, Applied: 0, Assessment: 0, Interview: 0, Offer: 0, Rejected: 0 };
    const all = loadApps();
    for (const a of all) if (by[a.status] !== undefined) by[a.status] += 1;
    return { total: all.length, by_status: by };
  }
  return api.applications.stats();
}

export async function createApplication(draft) {
  if (!isOnline()) {
    const a = { ...draft, id: uid('a') };
    saveApps([a, ...loadApps()]);
    return a;
  }
  const { application } = await api.applications.create(appToApi(draft));
  return appFromApi(application);
}

export async function patchApplication(id, patch) {
  if (!isOnline()) {
    const { id: _id, ...fields } = patch;
    return lsPatchApp(id, fields);
  }
  const { application } = await api.applications.patch(id, appToApi(patch));
  return appFromApi(application);
}

export async function deleteApplication(id) {
  if (!isOnline()) {
    saveApps(loadApps().filter((a) => a.id !== id));
    return null;
  }
  return api.applications.remove(id);
}

// ---------- analyses ----------

export async function runAnalysis({ resumeId, jobDescription }) {
  if (!isOnline()) {
    const resume = loadResumes().find((r) => r.id === resumeId);
    const r = analyzeMatch(resume, jobDescription);
    return {
      coverage: r.coverage,
      band: r.band,
      matched: r.matched,
      missing: r.missing,
      strengths: r.strengths,
      suggestions: r.suggestions,
      recommendations: [],
      warnings: [],
      engine: 'heuristic',
      simulated: true,
    };
  }
  const { analysis } = await api.analyses.create({
    resume_id: resumeId,
    job_description: jobDescription,
  });
  return analysisFromApi(analysis);
}

// ---------- templates ----------

export async function listTemplates() {
  if (!isOnline()) return TEMPLATES;
  const { items } = await api.templates();
  return items?.length ? items : TEMPLATES;
}
