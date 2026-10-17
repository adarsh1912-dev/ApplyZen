import { Router } from 'express';
import { ok } from '../utils/http.js';

// Static template catalog (mirrors the frontend gallery). Read-only, no auth needed.
const TEMPLATES = [
  { id: 'classic', name: 'Classic Professional', desc: 'Serif headlines, ruled sections.', tags: ['ATS-safe', 'Serif'] },
  { id: 'minimal', name: 'Modern Minimal', desc: 'Clean sans, generous whitespace.', tags: ['ATS-safe', 'Sans'] },
  { id: 'technical', name: 'Technical', desc: 'Dense, mono details, skill groups.', tags: ['ATS-safe', 'Dense'] },
  { id: 'compact', name: 'Compact One-Page', desc: 'Two-column, tight spacing.', tags: ['1-page', 'Two-col'] },
  { id: 'engineer', name: 'Engineer Pro', desc: 'Grouped skills, impact-first bullets.', tags: ['ATS-safe', 'SWE'] },
  { id: 'terminal', name: 'Terminal', desc: 'Monospace CLI aesthetic for developers.', tags: ['Mono', 'Dev'] },
  { id: 'opensource', name: 'Open Source', desc: 'Projects-forward layout with link chips.', tags: ['Projects', 'Dev'] },
  { id: 'staff', name: 'Staff Engineer', desc: 'Senior IC polish, dense skill bar.', tags: ['Senior', 'ATS-safe'] },
];

const r = Router();
r.get('/', (_req, res) => ok(res, { items: TEMPLATES }));

export default r;
