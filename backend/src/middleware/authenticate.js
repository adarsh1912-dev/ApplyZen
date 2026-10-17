import { verifyAccessToken } from '../utils/tokens.js';
import { findLiveSessionById } from '../repositories/sessions.repo.js';
import { unauthorized } from '../utils/http.js';

/**
 * Requires a valid access-token cookie bound to a LIVE server-side session.
 * Revoked/expired sessions reject immediately (one indexed PK lookup).
 * Resource ownership is additionally enforced inside every SQL query.
 */
export function authenticate(req, _res, next) {
  const token = req.cookies?.az_at;
  if (!token) return next(unauthorized('Sign in to continue.'));
  let claims;
  try {
    claims = verifyAccessToken(token);
  } catch {
    return next(unauthorized('Session expired. Please sign in again.'));
  }
  findLiveSessionById(claims.sessionId)
    .then((session) => {
      if (!session || session.user_id !== claims.userId) {
        return next(unauthorized('Session expired. Please sign in again.'));
      }
      req.userId = claims.userId;
      req.sessionId = claims.sessionId;
      return next();
    })
    .catch(next);
}
