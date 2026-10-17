import { Router } from 'express';
import { ah } from '../utils/async.js';
import * as c from '../controllers/applications.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { createApplicationSchema, listApplicationsQuery, patchApplicationSchema, uuidParam } from '../schemas/index.js';

const r = Router();
r.use(authenticate);

// Static route before :id so "stats" is not treated as an identifier.
r.get('/stats', ah(c.applicationStats));
r.post('/', validateBody(createApplicationSchema), ah(c.createApplication));
r.get('/', validateQuery(listApplicationsQuery), ah(c.listApplications));
r.get('/:id', validateParams(uuidParam), ah(c.getApplication));
r.patch('/:id', validateParams(uuidParam), validateBody(patchApplicationSchema), ah(c.patchApplication));
r.delete('/:id', validateParams(uuidParam), ah(c.deleteApplication));

export default r;
