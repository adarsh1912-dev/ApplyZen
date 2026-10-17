import * as repo from '../repositories/applications.repo.js';
import { notFound } from '../utils/http.js';
import { ok } from '../utils/http.js';

export async function createApplication(req, res) {
  const row = await repo.createApplication({ userId: req.userId, data: req.body });
  return ok(res, { application: row }, 201);
}

export async function listApplications(req, res) {
  const { items, total } = await repo.listApplications({ userId: req.userId, filters: req.query });
  return ok(res, { items, page: req.query.page, per_page: req.query.per_page, total });
}

export async function getApplication(req, res) {
  const row = await repo.getApplication({ userId: req.userId, id: req.params.id });
  if (!row) throw notFound('Application not found.');
  return ok(res, { application: row });
}

export async function patchApplication(req, res) {
  const row = await repo.updateApplication({ userId: req.userId, id: req.params.id, patch: req.body });
  if (!row) throw notFound('Application not found.');
  return ok(res, { application: row });
}

export async function deleteApplication(req, res) {
  const count = await repo.deleteApplication({ userId: req.userId, id: req.params.id });
  if (count === 0) throw notFound('Application not found.');
  return res.status(204).end();
}

export async function applicationStats(req, res) {
  const stats = await repo.applicationStats(req.userId);
  return ok(res, stats);
}
