import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { allowedOrigins, env } from './config/env.js';
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
  app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: (origin, cb) => {
      // Same-origin / non-browser requests carry no Origin header.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS origin not allowed'));
    },
    credentials: true,
  }));
  // Resume import posts a base64 file (≤ 5 MB decoded): allow a larger JSON
  // body on that one route before the global 1 MB parser sees the request.
  app.use('/api/resumes/import', express.json({ limit: '8mb' }));
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
