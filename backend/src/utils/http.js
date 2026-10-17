/** Application error with an HTTP status + stable machine-readable code. */
export class AppError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message = 'The request is invalid.', details = []) =>
  new AppError(400, 'BAD_REQUEST', message, details);
export const unauthorized = (message = 'Authentication required.') =>
  new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'Access forbidden.') =>
  new AppError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Resource not found.') =>
  new AppError(404, 'NOT_FOUND', message);
export const conflict = (message = 'Resource conflict.', details = []) =>
  new AppError(409, 'CONFLICT', message, details);
export const payloadTooLarge = (message = 'Request body too large.') =>
  new AppError(413, 'PAYLOAD_TOO_LARGE', message);

/** Success envelope: { success: true, data } */
export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}
