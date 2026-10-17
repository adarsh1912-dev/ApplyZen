import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(userId, sessionId) {
  return jwt.sign({ sub: userId, typ: 'access', sid: sessionId }, env.accessTokenSecret, {
    expiresIn: env.accessTokenTtlSec,
    jwtid: crypto.randomUUID(),
  });
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.accessTokenSecret, { algorithms: ['HS256'] });
  if (payload.typ !== 'access' || typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
    throw new Error('invalid token type');
  }
  return { userId: payload.sub, sessionId: payload.sid };
}

/** Opaque refresh token (returned to client once); only its hash is stored. */
export function newRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(env.refreshPepper + token).digest('hex');
}

const accessCookieBase = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax',
  path: '/',
});

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie('az_at', accessToken, { ...accessCookieBase(), maxAge: env.accessTokenTtlSec * 1000 });
  res.cookie('az_rt', refreshToken, {
    ...accessCookieBase(),
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res) {
  const base = accessCookieBase();
  res.clearCookie('az_at', base);
  res.clearCookie('az_rt', base);
}
