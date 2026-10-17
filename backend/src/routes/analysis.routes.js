import { Router } from 'express';
import { ah } from '../utils/async.js';
import * as c from '../controllers/analyses.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { analysisLimiter } from '../middleware/rate-limit.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { createAnalysisSchema, listResumesQuery, uuidParam } from '../schemas/index.js';

const r = Router();
r.use(authenticate);

r.post('/', analysisLimiter, validateBody(createAnalysisSchema), ah(c.createAnalysis));
r.get('/', validateQuery(listResumesQuery), ah(c.listAnalyses));
r.get('/:id', validateParams(uuidParam), ah(c.getAnalysis));

export default r;
