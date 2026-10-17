/** Express 4 does not catch async rejections — wrap every async handler. */
export const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);
