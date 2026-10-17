import { z } from 'zod';

export const uuidParam = z.object({ id: z.string().uuid('Must be a valid UUID.') });

const text = (min, max) => z.string().min(min).max(max);
const optText = (max) => z.string().max(max).optional().default('');

// ---- Auth ----
export const registerSchema = z.object({
  name: text(1, 120),
  email: z.string().trim().toLowerCase().email('Must be a valid email.').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email.').max(254),
  password: z.string().min(1, 'Password is required.').max(128),
});

// ---- Resume content (mirrors the frontend's data model, bounded) ----
export const TEMPLATE_KEYS = ['classic', 'minimal', 'technical', 'compact', 'engineer', 'terminal', 'opensource', 'staff'];

const bulletSchema = z.string().max(500).default('');
const experienceSchema = z.object({
  id: z.string().max(60).optional(),
  role: optText(200),
  company: optText(200),
  dates: optText(100),
  bullets: z.array(bulletSchema).max(30).default([]),
});

export const resumeContentSchema = z.object({
  personal: z.object({
    name: optText(200),
    role: optText(200),
    email: optText(254),
    phone: optText(60),
    location: optText(200),
    website: optText(300),
    linkedin: optText(300),
  }).default({}),
  summary: z.string().max(2000).default(''),
  experience: z.array(experienceSchema).max(50).default([]),
  education: z.array(z.object({
    id: z.string().max(60).optional(),
    school: optText(200),
    degree: optText(200),
    dates: optText(100),
  })).max(20).default([]),
  skills: z.array(z.string().max(80)).max(100).default([]),
  projects: z.array(z.object({
    id: z.string().max(60).optional(),
    name: optText(200),
    detail: optText(500),
  })).max(30).default([]),
  certifications: z.array(z.object({
    id: z.string().max(60).optional(),
    name: optText(200),
    detail: optText(300),
  })).max(30).default([]),
  visible: z.object({
    summary: z.boolean(), experience: z.boolean(), education: z.boolean(),
    skills: z.boolean(), projects: z.boolean(), certifications: z.boolean(),
  }).partial().default({}),
  order: z.array(z.enum(['summary', 'experience', 'education', 'skills', 'projects', 'certifications'])).max(10).default([]),
});

export const createResumeSchema = z.object({
  title: text(1, 200),
  template_key: z.enum(TEMPLATE_KEYS).default('minimal'),
  content: resumeContentSchema.default({}),
});

export const patchResumeSchema = z.object({
  title: text(1, 200).optional(),
  template_key: z.enum(TEMPLATE_KEYS).optional(),
  content: resumeContentSchema.optional(),
  // Optimistic concurrency: pass the updated_at you last read; mismatch → 409.
  expected_updated_at: z.string().datetime({ offset: true }).optional(),
}).refine((v) => v.title !== undefined || v.template_key !== undefined || v.content !== undefined, {
  message: 'Provide at least one of title, template_key, or content.',
});

// ---- Applications (frontend labels: Saved/Applied/Assessment/Interview/Offer/Rejected) ----
const STATUS_LABELS = ['Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected'];
export const statusLabelToDb = (s) => String(s).toLowerCase();
export const statusDbToLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const statusSchema = z.string().refine((s) => STATUS_LABELS.map((x) => x.toLowerCase()).includes(s.toLowerCase()), {
  message: `Status must be one of: ${STATUS_LABELS.join(', ')}.`,
}).transform((s) => s.toLowerCase());

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date.');

export const createApplicationSchema = z.object({
  company: text(1, 200),
  job_title: text(1, 200),
  status: statusSchema.default('saved'),
  applied_on: dateSchema.nullish(),
  notes: z.string().max(5000).nullish(),
  resume_id: z.string().uuid().nullish(),
  job_description: z.string().max(20000).nullish(),
});

export const patchApplicationSchema = z.object({
  company: text(1, 200).optional(),
  job_title: text(1, 200).optional(),
  status: statusSchema.optional(),
  applied_on: dateSchema.nullish(),
  notes: z.string().max(5000).nullish(),
  resume_id: z.string().uuid().nullish(),
  job_description: z.string().max(20000).nullish(),
}).refine((v) => Object.values(v).some((x) => x !== undefined), {
  message: 'Provide at least one field to update.',
});

const SORT_COLUMNS = ['applied_on', 'created_at', 'updated_at', 'company'];
export const listApplicationsQuery = z.object({
  status: z.string().optional(),
  q: z.string().max(200).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(SORT_COLUMNS).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const listResumesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

// ---- Analyses ----
export const createAnalysisSchema = z.object({
  resume_id: z.string().uuid('resume_id must be a valid UUID.'),
  job_description: z.string().min(50, 'Job description must be at least 50 characters.').max(20000),
  job_title: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
});

// Validated shape for LLM structured output (and the persisted result contract).
export const analysisResultSchema = z.object({
  coverage: z.number().min(0).max(100),
  band: z.string().max(80),
  required_skills: z.array(z.string().max(80)).max(60),
  matched_skills: z.array(z.string().max(80)).max(60),
  missing_skills: z.array(z.string().max(80)).max(60),
  strengths: z.array(z.string().max(300)).max(10),
  suggestions: z.array(z.string().max(300)).max(10),
  relevant_experience: z.array(z.string().max(300)).max(10),
  recommendations: z.array(z.string().max(300)).max(10),
  warnings: z.array(z.string().max(300)).max(10),
});

// ---- Resume tailoring (autoconfigure) ----
export const tailorResumeSchema = z.object({
  job_description: z.string().min(50, 'Job description must be at least 50 characters.').max(20000),
});

// Slim provider output: only fields the model may rewrite. The service
// reassembles the full resume content around these, so education, projects,
// certifications, contact details, visibility, and section order can never be
// lost or altered by the model.
export const tailorOutputSchema = z.object({
  role: z.string().max(200).optional().default(''),
  summary: z.string().max(2000).default(''),
  experience: z.array(z.object({
    id: z.string().max(60).optional(),
    bullets: z.array(z.string().max(500)).max(30).default([]),
  })).max(50).default([]),
  skills: z.array(z.string().max(80)).max(100).default([]),
  changes: z.array(z.string().max(300)).max(20).default([]),
  warnings: z.array(z.string().max(300)).max(10).default([]),
});

// ---- Resume import (file upload → structured résumé) ----
export const importResumeSchema = z.object({
  filename: z.string().min(1).max(200),
  data_base64: z.string().min(1).max(8_000_000),
});

// Provider output for file structuring. Ids, visible, and order are added by
// the service, so the model cannot influence them.
export const importOutputSchema = z.object({
  personal: z.object({
    name: optText(200),
    role: optText(200),
    email: optText(254),
    phone: optText(60),
    location: optText(200),
    website: optText(300),
    linkedin: optText(300),
  }).default({}),
  summary: z.string().max(2000).default(''),
  experience: z.array(z.object({
    role: optText(200),
    company: optText(200),
    dates: optText(100),
    bullets: z.array(z.string().max(500)).max(30).default([]),
  })).max(50).default([]),
  education: z.array(z.object({
    school: optText(200),
    degree: optText(200),
    dates: optText(100),
  })).max(20).default([]),
  skills: z.array(z.string().max(80)).max(100).default([]),
  projects: z.array(z.object({
    name: optText(200),
    detail: optText(500),
  })).max(30).default([]),
  certifications: z.array(z.object({
    name: optText(200),
    detail: optText(300),
  })).max(30).default([]),
  warnings: z.array(z.string().max(300)).max(10).default([]),
});
