import { getDocumentProxy, extractText } from 'unpdf';
import mammoth from 'mammoth';
import { AppError } from '../utils/http.js';
import { env } from '../config/env.js';
import { importResume, llmConfigured } from './llm-provider.js';
import { createResumeWithVersion } from '../repositories/resumes.repo.js';

const MAX_BYTES = 3 * 1024 * 1024;
const SUPPORTED = new Set(['pdf', 'docx', 'txt', 'md']);

const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const fail = (status, code, message) => new AppError(status, code, message);

/** Extract plain text from an uploaded resume file, by extension. */
async function extractResumeText(filename, buffer) {
  const ext = filename.toLowerCase().split('.').pop();
  if (!SUPPORTED.has(ext)) {
    throw fail(415, 'UNSUPPORTED_FILE',
      'Unsupported file type. Use PDF, DOCX, TXT, or MD — a legacy .doc must be re-saved as DOCX or PDF.');
  }
  if (ext === 'pdf') {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      return text;
    } catch {
      throw fail(422, 'IMPORT_UNREADABLE',
        'Could not read this PDF. If it is password-protected, remove the protection and try again.');
    }
  }
  if (ext === 'docx') {
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    } catch {
      throw fail(422, 'IMPORT_UNREADABLE',
        'Could not read this DOCX. If it is password-protected, remove the protection and try again.');
    }
  }
  return buffer.toString('utf8');
}

/**
 * File -> text -> LLM-structured résumé, stored as a new resume. Requires a
 * configured provider (structuring is inherently model work); the stored
 * resume is the review surface: the client can open the editor, analyze, and
 * autoconfigure it like any other.
 */
export async function importResumeFromFile({ userId, filename, dataBase64 }) {
  if (!llmConfigured()) {
    throw fail(503, 'AI_NOT_CONFIGURED', 'Résumé import is not configured on this server.');
  }
  const buffer = Buffer.from(dataBase64, 'base64');
  if (buffer.length === 0) throw fail(400, 'BAD_REQUEST', 'The uploaded file is empty.');
  if (buffer.length > MAX_BYTES) throw fail(413, 'PAYLOAD_TOO_LARGE', 'Files are limited to 3 MB.');

  const raw = (await extractResumeText(filename, buffer)) ?? '';
  const text = raw.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 100) {
    throw fail(422, 'IMPORT_EMPTY_TEXT',
      'Almost no text could be read from this file. If it is a scanned PDF (images), export a text-based PDF or DOCX instead.');
  }

  let out;
  try {
    out = await importResume(text);
  } catch (err) {
    console.error('[import] LLM provider failed:', err.message);
    throw fail(502, 'AI_PROVIDER_FAILED', 'The AI provider could not read this résumé. Try again in a moment.');
  }

  const content = {
    personal: out.personal,
    summary: out.summary,
    experience: out.experience.map((e) => ({ id: uid('e'), ...e })),
    education: out.education.map((d) => ({ id: uid('d'), ...d })),
    skills: out.skills,
    projects: out.projects.map((p) => ({ id: uid('p'), ...p })),
    certifications: out.certifications.map((c) => ({ id: uid('c'), ...c })),
    visible: { summary: true, experience: true, education: true, skills: true, projects: true, certifications: true },
    order: ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
  };

  const title = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim().slice(0, 200) || 'Imported résumé';
  const resume = await createResumeWithVersion({ userId, title, templateKey: 'minimal', content });
  return { resume, warnings: out.warnings, engine: 'llm', model: env.llm.model };
}
