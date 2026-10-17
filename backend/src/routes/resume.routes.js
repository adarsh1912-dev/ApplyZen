import { Router } from 'express';
import { ah } from '../utils/async.js';
import * as c from '../controllers/resumes.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { createResumeSchema, importResumeSchema, listResumesQuery, patchResumeSchema, tailorResumeSchema, uuidParam } from '../schemas/index.js';
import { analysisLimiter } from '../middleware/rate-limit.js';
import { z } from 'zod';

const r = Router();
r.use(authenticate);

r.post('/', validateBody(createResumeSchema), ah(c.createResume));
r.post('/import', validateBody(importResumeSchema), analysisLimiter, ah(c.importResume));
r.get('/', validateQuery(listResumesQuery), ah(c.listResumes));
r.get('/:id', validateParams(uuidParam), ah(c.getResume));
r.patch('/:id', validateParams(uuidParam), validateBody(patchResumeSchema), ah(c.patchResume));
r.delete('/:id', validateParams(uuidParam), ah(c.deleteResume));
r.post('/:id/duplicate', validateParams(uuidParam), ah(c.duplicateResume));
r.post('/:id/tailor', validateParams(uuidParam), validateBody(tailorResumeSchema), analysisLimiter, ah(c.tailorResume));
r.get('/:id/versions', validateParams(uuidParam), ah(c.listVersions));
r.post('/:id/versions', validateParams(uuidParam), ah(c.createVersion));
r.get(
  '/:id/versions/:version',
  validateParams(uuidParam.extend({ version: z.coerce.number().int().min(1) })),
  ah(c.getVersion),
);

export default r;
