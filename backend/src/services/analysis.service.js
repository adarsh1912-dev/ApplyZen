import { getResume } from '../repositories/resumes.repo.js';
import * as analyses from '../repositories/analyses.repo.js';
import { notFound } from '../utils/http.js';
import { heuristicAnalysis } from './heuristic.js';
import { llmAnalysis, llmConfigured } from './llm-provider.js';

export async function runAnalysis({ userId, resumeId, jobDescription, jobTitle, company }) {
  // Ownership check first: the resume must belong to the caller.
  const resume = await getResume({ userId, resumeId });
  if (!resume) throw notFound('Resume not found.');

  let result = heuristicAnalysis(resume.content, jobDescription);
  let engine = 'heuristic';
  if (llmConfigured()) {
    try {
      result = await llmAnalysis(resume.content, jobDescription);
      engine = 'llm';
    } catch (err) {
      // Provider failure is never exposed; fall back loudly-internally only.
      console.error('[analysis] LLM provider failed, using heuristic:', err.message);
      result = heuristicAnalysis(resume.content, jobDescription);
      engine = 'heuristic';
    }
  }
  // Stamp the engine so clients can label results honestly.
  const stamped = { ...result, engine, simulated: engine === 'heuristic' };
  const row = await analyses.createAnalysis({
    userId, resumeId, jobTitle, company, jobDescription, result: stamped, engine,
  });
  return { ...row, result: stamped };
}

export async function listUserAnalyses({ userId, page, perPage }) {
  return analyses.listAnalyses({ userId, page, perPage });
}

export async function getUserAnalysis({ userId, id }) {
  const row = await analyses.getAnalysis({ userId, id });
  if (!row) throw notFound('Analysis not found.');
  return row;
}
