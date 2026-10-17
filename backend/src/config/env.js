import 'dotenv/config';

// Fail fast on missing required configuration.
const required = ['DATABASE_URL', 'ACCESS_TOKEN_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}. See backend/.env.example.`);
}

if ((process.env.ACCESS_TOKEN_SECRET?.length ?? 0) < 32 && process.env.NODE_ENV === 'production') {
  throw new Error('ACCESS_TOKEN_SECRET must be at least 32 characters in production.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: (process.env.NODE_ENV ?? 'development') === 'production',
  isTest: (process.env.NODE_ENV ?? 'development') === 'test',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshPepper: process.env.REFRESH_TOKEN_PEPPER ?? '',
  frontendOrigin: (process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173').replace(/\/$/, ''),
  cookieSecure: process.env.COOKIE_SECURE === 'true' || (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false'),
  accessTokenTtlSec: Number(process.env.ACCESS_TOKEN_TTL_SEC ?? 900), // 15 min
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? (process.env.NODE_ENV === 'test' ? 4 : 12)),
  llm: {
    url: process.env.LLM_API_URL || '',
    key: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || '',
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 25000),
  },
};

export const allowedOrigins = [env.frontendOrigin];
