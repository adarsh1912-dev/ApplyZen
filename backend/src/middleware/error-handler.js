import { AppError } from '../utils/http.js';

/** Central error handler: stable envelope, no leaked internals. */
export function errorHandler(err, _req, res, _next) {
  // Zod-safe AppErrors pass through.
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details ?? [] },
    });
  }

  // Expected Postgres failures mapped without exposing SQL.
  if (err?.code === '23505') {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'A record with these details already exists.', details: [] },
    });
  }
  if (err?.code === '23503') {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Referenced record does not exist.', details: [] },
    });
  }
  if (err?.code && (err.code.startsWith('22') || err.code.startsWith('23'))) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'The request contains invalid values.', details: [] },
    });
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large.', details: [] },
    });
  }

  // Log full detail server-side only (never passwords/tokens — callers must not attach them).
  console.error('[unhandled]', err?.message ?? err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Try again later.', details: [] },
  });
}

export function notFoundHandler(_req, res) {
  return res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found.', details: [] },
  });
}
