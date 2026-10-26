import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env, isAllowedOrigin } from './config/env.js';
import { query } from './config/database.js';
import { ok } from './utils/http.js';
import { csrfOriginCheck } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import applicationRoutes from './routes/application.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import templateRoutes from './routes/template.routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // One hop is Railway's edge; behind Vercel -> Railway set TRUST_PROXY=2 so
  // req.ip (and therefore rate limiting) sees the actual client.
  app.set('trust proxy', env.trustProxy);

  // The API only returns JSON. A deny-by-default policy keeps these responses
  // inert if a browser ever renders one directly.
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'none'"],
      },
    },
  }));
  app.use(cors({
    origin: (origin, cb) => {
      // Same-origin / non-browser requests carry no Origin header.
      if (!origin || isAllowedOrigin(origin)) return cb(null, true);
      // Omit CORS headers rather than throwing: a disallowed browser origin
      // should look like a normal CORS rejection, not a 500.
      return cb(null, false);
    },
    credentials: true,
  }));
  // Resume imports are base64 JSON. The 3 MB file cap expands to ~4 MB on the
  // wire, which stays under Vercel's proxy body limit when the API is proxied.
  app.use('/api/resumes/import', express.json({ limit: '4.5mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(csrfOriginCheck);

  app.get('/health', (_req, res) => ok(res, { status: 'ok', version: '0.1.0' }));
  app.get('/ready', async (_req, res) => {
    try {
      await query('SELECT 1');
      return ok(res, { status: 'ready', db: 'up' });
    } catch {
      return res.status(503).json({
        success: false,
        error: { code: 'NOT_READY', message: 'Database unavailable.', details: [] },
      });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/analyses', analysisRoutes);
  app.use('/api/templates', templateRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export { env };
