// Typed client for the Applyzen API. Cookie-based auth (credentials: include).
// Base URL: same-origin by default; set VITE_API_URL=http://localhost:4000 for local dev.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function rawRequest(path, { method = 'GET', body, query } = {}) {
  const url = BASE + path + (query ? '?' + new URLSearchParams(query).toString() : '');
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const e = json?.error ?? {};
    throw new ApiError(res.status, e.code ?? 'REQUEST_FAILED', e.message ?? `Request failed (${res.status}).`, e.details ?? []);
  }
  return json.data;
}

// A 401 on these means bad credentials, not an expired session.
const NO_REFRESH_PATHS = new Set(['/api/auth/login', '/api/auth/register', '/api/auth/refresh']);

let refreshPromise = null;

/**
 * Call the API, refreshing the 15-minute access token once on 401 and retrying.
 * Concurrent 401s share one refresh so token rotation cannot race itself.
 */
async function request(path, opts = {}) {
  try {
    return await rawRequest(path, opts);
  } catch (err) {
    const canRefresh = err instanceof ApiError
      && err.status === 401
      && apiEnabled()
      && !NO_REFRESH_PATHS.has(path);
    if (!canRefresh) throw err;

    refreshPromise ??= rawRequest('/api/auth/refresh', { method: 'POST' }).finally(() => {
      refreshPromise = null;
    });

    try {
      await refreshPromise;
    } catch {
      throw err;
    }
    return rawRequest(path, opts);
  }
}

export const api = {
  // auth
  register: (b) => request('/api/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/api/auth/login', { method: 'POST', body: b }),
  me: () => request('/api/auth/me'),
  refresh: () => request('/api/auth/refresh', { method: 'POST' }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  logoutAll: () => request('/api/auth/logout-all', { method: 'POST' }),
  sessions: () => request('/api/auth/sessions'),
  revokeSession: (id) => request(`/api/auth/sessions/${id}`, { method: 'DELETE' }),
  // resumes
  resumes: {
    list: (q) => request('/api/resumes', { query: q }),
    create: (b) => request('/api/resumes', { method: 'POST', body: b }),
    get: (id) => request(`/api/resumes/${id}`),
    patch: (id, b) => request(`/api/resumes/${id}`, { method: 'PATCH', body: b }),
    remove: (id) => request(`/api/resumes/${id}`, { method: 'DELETE' }),
    duplicate: (id) => request(`/api/resumes/${id}/duplicate`, { method: 'POST' }),
    versions: (id) => request(`/api/resumes/${id}/versions`),
    snapshot: (id) => request(`/api/resumes/${id}/versions`, { method: 'POST' }),
    tailor: (id, b) => request(`/api/resumes/${id}/tailor`, { method: 'POST', body: b }),
    importFile: (b) => request('/api/resumes/import', { method: 'POST', body: b }),
  },
  // applications
  applications: {
    list: (q) => request('/api/applications', { query: q }),
    create: (b) => request('/api/applications', { method: 'POST', body: b }),
    get: (id) => request(`/api/applications/${id}`),
    patch: (id, b) => request(`/api/applications/${id}`, { method: 'PATCH', body: b }),
    remove: (id) => request(`/api/applications/${id}`, { method: 'DELETE' }),
    stats: () => request('/api/applications/stats'),
  },
  // analyses
  analyses: {
    create: (b) => request('/api/analyses', { method: 'POST', body: b }),
    list: (q) => request('/api/analyses', { query: q }),
    get: (id) => request(`/api/analyses/${id}`),
  },
  templates: () => request('/api/templates'),
};

/** True when the build is pointed at a backend (local dev sets VITE_API_URL). */
export const apiEnabled = () => Boolean(import.meta.env.VITE_API_URL);
