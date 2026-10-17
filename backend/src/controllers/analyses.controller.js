import * as service from '../services/analysis.service.js';
import { ok } from '../utils/http.js';

export async function createAnalysis(req, res) {
  const row = await service.runAnalysis({
    userId: req.userId,
    resumeId: req.body.resume_id,
    jobDescription: req.body.job_description,
    jobTitle: req.body.job_title,
    company: req.body.company,
  });
  return ok(res, { analysis: row }, 201);
}

export async function listAnalyses(req, res) {
  const { items, total } = await service.listUserAnalyses({
    userId: req.userId,
    page: req.query.page,
    perPage: req.query.per_page,
  });
  return ok(res, { items, page: req.query.page, per_page: req.query.per_page, total });
}

export async function getAnalysis(req, res) {
  const row = await service.getUserAnalysis({ userId: req.userId, id: req.params.id });
  return ok(res, { analysis: row });
}
