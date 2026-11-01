import * as auth from '../services/auth.service.js';
import { ok } from '../utils/http.js';
import { setAuthCookies, clearAuthCookies, hashRefreshToken } from '../utils/tokens.js';
import * as sessions from '../repositories/sessions.repo.js';

export async function register(req, res) {
  const result = await auth.register(req.body);
  return ok(res, {
    user: result.user,
    verification_required: result.verification_required,
    email_sent: result.email_sent,
  }, 201);
}

export async function verifyEmail(req, res) {
  const result = await auth.verifyEmail(req.body.token);
  return ok(res, result);
}

export async function resendVerification(req, res) {
  const result = await auth.resendVerification(req.body.email);
  return ok(res, result);
}

export async function forgotPassword(req, res) {
  const result = await auth.forgotPassword(req.body.email);
  return ok(res, result);
}

export async function resetPassword(req, res) {
  const result = await auth.resetPassword(req.body);
  return ok(res, result);
}

export async function login(req, res) {
  const result = await auth.login(req.body);
  setAuthCookies(res, result);
  return ok(res, { user: result.user });
}

export async function me(req, res) {
  const user = await auth.getCurrentUser(req.userId);
  return ok(res, { user });
}

export async function refresh(req, res) {
  const result = await auth.refresh(req.cookies?.az_rt);
  setAuthCookies(res, result);
  return ok(res, { user: result.user });
}

export async function logout(req, res) {
  // Revoke only the current session — other devices stay signed in.
  await auth.logout({ userId: req.userId, sessionId: req.sessionId });
  clearAuthCookies(res);
  return ok(res, { logged_out: true });
}

export async function logoutAll(req, res) {
  await auth.logoutAll(req.userId);
  clearAuthCookies(res);
  return ok(res, { logged_out: true });
}

export async function listSessions(req, res) {
  const items = await auth.listUserSessions(req.userId);
  const currentId = req.cookies?.az_rt
    ? (await sessions.findLiveSession(hashRefreshToken(req.cookies.az_rt)))?.id ?? null
    : null;
  return ok(res, { items: items.map((s) => ({ ...s, current: s.id === currentId })) });
}

export async function revokeSession(req, res) {
  const revoked = await auth.revokeUserSession({ userId: req.userId, sessionId: req.params.id });
  if (!revoked) return ok(res, { revoked: false }, 404);
  return ok(res, { revoked: true });
}
