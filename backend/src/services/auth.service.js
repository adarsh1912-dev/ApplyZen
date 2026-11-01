import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { withTransaction } from '../config/database.js';
import * as users from '../repositories/users.repo.js';
import * as sessions from '../repositories/sessions.repo.js';
import { AppError, conflict, unauthorized } from '../utils/http.js';
import { hashRefreshToken, newRefreshToken, signAccessToken } from '../utils/tokens.js';
import { sendPasswordResetEmail, sendVerificationEmail } from './email.service.js';
import { issueAuthToken, resetPasswordWithToken, verifyEmailToken } from './auth-token.service.js';

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  email_verified: Boolean(u.email_verified_at),
  created_at: u.created_at,
});

const emailVerificationTtlMs = env.emailVerificationTtlHours * 60 * 60 * 1000;
const passwordResetTtlMs = env.passwordResetTtlMinutes * 60 * 1000;

function refreshExpiry() {
  return new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
}

async function issueSessionPair(userId) {
  const refreshToken = newRefreshToken();
  const session = await sessions.createSession(null, {
    userId,
    refreshHash: hashRefreshToken(refreshToken),
    expiresAt: refreshExpiry(),
  });
  // Access token is bound to the session row so revocation takes effect instantly.
  const accessToken = signAccessToken(userId, session.id);
  return { accessToken, refreshToken, sessionId: session.id };
}

export async function register({ name, email, password }) {
  const existing = await users.findUserByEmail(email);
  if (existing) throw conflict('An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  let user;
  try {
    user = await users.createUser({ name, email, passwordHash });
  } catch (err) {
    if (err?.code === '23505') throw conflict('An account with this email already exists.');
    throw err;
  }

  const token = await issueAuthToken({
    userId: user.id,
    purpose: 'email_verification',
    ttlMs: emailVerificationTtlMs,
  });

  let emailSent = true;
  try {
    await sendVerificationEmail({ to: user.email, name: user.name, token });
  } catch (err) {
    emailSent = false;
    console.error('[email] verification send failed:', err.message);
  }

  return {
    user: publicUser(user),
    verification_required: true,
    email_sent: emailSent,
  };
}

export async function login({ email, password }) {
  const user = await users.findUserByEmail(email);
  // Same message whether the email or password is wrong (no user enumeration).
  if (!user) throw unauthorized('Incorrect email or password.');
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw unauthorized('Incorrect email or password.');
  if (!user.email_verified_at) {
    throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email before signing in.');
  }
  const pair = await issueSessionPair(user.id);
  return { user: publicUser(user), ...pair };
}

/** Mark an email verified using a one-time token. */
export async function verifyEmail(token) {
  const userId = await verifyEmailToken(token);
  if (!userId) {
    throw new AppError(400, 'INVALID_TOKEN', 'This verification link is invalid or has expired.');
  }
  return { verified: true };
}

/**
 * Send a fresh verification link. Always returns the same response so the
 * endpoint cannot be used to discover which addresses have accounts.
 */
export async function resendVerification(email) {
  const user = await users.findUserByEmail(email);
  if (!user || user.email_verified_at) return { sent: true };

  const token = await issueAuthToken({
    userId: user.id,
    purpose: 'email_verification',
    ttlMs: emailVerificationTtlMs,
  });
  try {
    await sendVerificationEmail({ to: user.email, name: user.name, token });
  } catch (err) {
    console.error('[email] verification resend failed:', err.message);
  }
  return { sent: true };
}

/**
 * Send a password-reset link. Always returns the same response so the endpoint
 * cannot be used to discover which addresses have accounts.
 */
export async function forgotPassword(email) {
  const user = await users.findUserByEmail(email);
  if (!user) return { sent: true };

  const token = await issueAuthToken({
    userId: user.id,
    purpose: 'password_reset',
    ttlMs: passwordResetTtlMs,
  });
  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, token });
  } catch (err) {
    console.error('[email] password reset send failed:', err.message);
  }
  return { sent: true };
}

/** Consume a reset token, change the password, and revoke every session. */
export async function resetPassword({ token, password }) {
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const userId = await resetPasswordWithToken(token, passwordHash);
  if (!userId) {
    throw new AppError(400, 'INVALID_TOKEN', 'This reset link is invalid or has expired.');
  }
  return { reset: true };
}

/** Rotate refresh token: old session revoked, new pair issued — atomic. */
export async function refresh(refreshToken) {
  if (!refreshToken) throw unauthorized('Session expired. Please sign in again.');
  return withTransaction(async (client) => {
    const live = await sessions.findLiveSession(hashRefreshToken(refreshToken));
    if (!live) throw unauthorized('Session expired. Please sign in again.');
    await sessions.revokeSession(client, { sessionId: live.id, userId: live.user_id });
    const next = newRefreshToken();
    const created = await sessions.createSession(client, {
      userId: live.user_id,
      refreshHash: hashRefreshToken(next),
      expiresAt: refreshExpiry(),
    });
    const user = await users.findUserById(live.user_id);
    if (!user) throw unauthorized('Session expired. Please sign in again.');
    return {
      user: publicUser(user),
      accessToken: signAccessToken(user.id, created.id),
      refreshToken: next,
      sessionId: created.id,
    };
  });
}

export async function logout({ userId, sessionId }) {
  if (sessionId) await sessions.revokeSession(null, { sessionId, userId });
}

export async function getCurrentUser(userId) {
  const user = await users.findUserById(userId);
  if (!user) throw unauthorized('Session expired. Please sign in again.');
  return publicUser(user);
}

export async function listUserSessions(userId) {
  const rows = await sessions.listSessions(userId);
  return rows.map((s) => ({
    id: s.id,
    created_at: s.created_at,
    expires_at: s.expires_at,
    revoked: s.revoked_at !== null,
  }));
}

export async function revokeUserSession({ userId, sessionId }) {
  const count = await sessions.revokeSession(null, { sessionId, userId });
  return count > 0;
}

export async function logoutAll(userId) {
  await sessions.revokeAllSessions(userId);
}
