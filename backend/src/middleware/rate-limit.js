import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const disabled = env.isTest ? { max: 10_000 } : {};

// Tight limits on credential endpoints; disabled-soft in tests so suites don't flake.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } },
  ...disabled,
});

export const analysisLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many analyses. Slow down.' } },
  ...disabled,
});
