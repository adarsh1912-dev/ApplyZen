import * as repo from '../repositories/resumes.repo.js';
import * as tailor from '../services/tailor.service.js';
import * as importer from '../services/import.service.js';
import { conflict, notFound } from '../utils/http.js';
import { ok } from '../utils/http.js';

export async function createResume(req, res) {
  const row = await repo.createResumeWithVersion({
    userId: req.userId,
    title: req.body.title,
    templateKey: req.body.template_key,
    content: req.body.content,
  });
  return ok(res, { resume: row }, 201);
}

export async function listResumes(req, res) {
  const { items, total } = await repo.listResumes({
    userId: req.userId,
    page: req.query.page,
    perPage: req.query.per_page,
  });
  return ok(res, {
    items,
    page: req.query.page,
    per_page: req.query.per_page,
    total,
  });
}

export async function getResume(req, res) {
  const row = await repo.getResume({ userId: req.userId, resumeId: req.params.id });
  if (!row) throw notFound('Resume not found.');
  return ok(res, { resume: row });
}

export async function patchResume(req, res) {
  const result = await repo.updateResume({
    userId: req.userId,
    resumeId: req.params.id,
    patch: {
      title: req.body.title,
      templateKey: req.body.template_key,
      content: req.body.content,
    },
    expectedUpdatedAt: req.body.expected_updated_at,
  });
  if (result === null) throw notFound('Resume not found.');
  if (result.conflict) {
    throw conflict('This resume changed elsewhere. Reload and retry.', [
      { path: 'expected_updated_at', message: 'Stale copy.', current_updated_at: result.currentUpdatedAt },
    ]);
  }
  return ok(res, { resume: result });
}

export async function deleteResume(req, res) {
  const count = await repo.deleteResume({ userId: req.userId, resumeId: req.params.id });
  if (count === 0) throw notFound('Resume not found.');
  return res.status(204).end();
}

export async function duplicateResume(req, res) {
  const row = await repo.duplicateResume({ userId: req.userId, resumeId: req.params.id });
  if (!row) throw notFound('Resume not found.');
  return ok(res, { resume: row }, 201);
}

/** AI rewrite for Autoconfigure. Returns content + changes; persists nothing. */
export async function tailorResume(req, res) {
  const tailored = await tailor.tailorUserResume({
    userId: req.userId,
    resumeId: req.params.id,
    jobDescription: req.body.job_description,
  });
  return ok(res, { tailored });
}

/** File upload → extraction → AI structuring → new stored résumé. */
export async function importResume(req, res) {
  const result = await importer.importResumeFromFile({
    userId: req.userId,
    filename: req.body.filename,
    dataBase64: req.body.data_base64,
  });
  return ok(res, result, 201);
}

export async function listVersions(req, res) {
  const resume = await repo.getResume({ userId: req.userId, resumeId: req.params.id });
  if (!resume) throw notFound('Resume not found.');
  const items = await repo.listVersions({ userId: req.userId, resumeId: req.params.id });
  return ok(res, { items });
}

export async function createVersion(req, res) {
  const row = await repo.createVersion({ userId: req.userId, resumeId: req.params.id });
  if (!row) throw notFound('Resume not found.');
  return ok(res, { version: row }, 201);
}

export async function getVersion(req, res) {
  const row = await repo.getVersion({
    userId: req.userId,
    resumeId: req.params.id,
    version: Number(req.params.version),
  });
  if (!row) throw notFound('Version not found.');
  return ok(res, { version: row });
}
