import { AppError } from '../utils/http.js';

/** Validate req.body / req.query / req.params against a Zod schema. */
export function validate(source, schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(new AppError(400, 'VALIDATION_ERROR', 'The request contains invalid fields.', details));
    }
    req[source] = parsed.data;
    return next();
  };
}

export const validateBody = (schema) => validate('body', schema);
export const validateQuery = (schema) => validate('query', schema);
export const validateParams = (schema) => validate('params', schema);
