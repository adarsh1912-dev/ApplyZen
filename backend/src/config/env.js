import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

// Fail fast on missing required configuration.
const required = ['DATABASE_URL', 'ACCESS_TOKEN_SECRET'];
if (isProd && !process.env.FRONTEND_ORIGIN) required.push('FRONTEND_ORIGIN');
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}. See backend/.env.example.`);
}

if ((process.env.ACCESS_TOKEN_SECRET?.length ?? 0) < 32 && isProd) {
  throw new Error('ACCESS_TOKEN_SECRET must be at least 32 characters in production.');
}

/** Parse a comma-separated env value into trimmed, non-empty entries. */
const list = (value) => String(value ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const normalizeOrigin = (origin) => {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
};

const configuredOrigins = list(process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173');
const frontendOrigins = configuredOrigins.map(normalizeOrigin);
if (frontendOrigins.some((origin) => origin === null)) {
  throw new Error('FRONTEND_ORIGIN must be a comma-separated list of valid origins, e.g. https://app.example.com.');
}

// Optional wildcard patterns for ephemeral origins (typically Vercel previews).
// Example: https://applyzen-*-your-team.vercel.app
const frontendOriginPatterns = list(process.env.FRONTEND_ORIGIN_PATTERNS)
  .map((pattern) => pattern.replace(/\/$/, ''));

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const originPatternRegexes = frontendOriginPatterns.map((pattern) => {
  if (!pattern.includes('://')) {
    throw new Error(
      `Invalid FRONTEND_ORIGIN_PATTERNS entry "${pattern}". Use an origin pattern like https://my-app-*.vercel.app.`,
    );
  }
  const host = pattern.slice(pattern.indexOf('://') + 3).split('/')[0];
  if (!host || host === '*') {
    throw new Error(`Refusing to allow every origin via FRONTEND_ORIGIN_PATTERNS entry "${pattern}".`);
  }
  return new RegExp(`^${pattern.split('*').map(escapeRegExp).join('.*')}$`, 'i');
});

/** True for exact configured origins and wildcard patterns (e.g. preview deployments). */
export function isAllowedOrigin(origin) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return frontendOrigins.includes(normalized) || originPatternRegexes.some((re) => re.test(normalized));
}

/**
 * Express "trust proxy" setting. Keep the default at 1 hop (Railway's edge).
 * Behind Vercel -> Railway, use 2. Supports a hop count, false, or an
 * Express-compatible string such as "loopback,10.0.0.0/8".
 */
const parseTrustProxy = (value) => {
  if (value === undefined || value === '') return 1;
  if (value === 'true') {
    throw new Error(
      'TRUST_PROXY=true trusts every hop and lets clients spoof rate-limit IPs. Use a hop count (e.g. 1 or 2) or a subnet list.',
    );
  }
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
};

export const env = {
  nodeEnv,
  isProd,
  isTest,
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === 'true',
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshPepper: process.env.REFRESH_TOKEN_PEPPER ?? '',
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  cookieSecure: process.env.COOKIE_SECURE === 'true' || (isProd && process.env.COOKIE_SECURE !== 'false'),
  accessTokenTtlSec: Number(process.env.ACCESS_TOKEN_TTL_SEC ?? 900), // 15 min
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? (isTest ? 4 : 12)),
  llm: {
    url: process.env.LLM_API_URL || '',
    key: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || '',
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 25000),
  },
};
