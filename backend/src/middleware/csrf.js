import { allowedOrigins, env } from '../config/env.js';
import { AppError } from '../utils/http.js';

/**
 * CSRF defense for cookie-authenticated mutations. Cookies use SameSite=Lax,
 * which already blocks cross-site POSTs; this adds strict origin validation
 * whenever the browser sends Origin/Referer (fetch, forms). Requests without
 * either header (same-origin navigations, curl, tests) are allowed through.
 */
export function csrfOriginCheck(req, _res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  if (!req.cookies?.az_at && !req.cookies?.az_rt) return next();
  const origin = req.get('origin') || req.get('referer');
  if (!origin) return next();
  try {
    const host = new URL(origin).origin;
    if (!allowedOrigins.includes(host)) {
      return next(new AppError(403, 'CSRF_BLOCKED', 'Cross-origin request blocked.'));
    }
  } catch {
    return next(new AppError(403, 'CSRF_BLOCKED', 'Cross-origin request blocked.'));
  }
  return next();
}

export { env };
