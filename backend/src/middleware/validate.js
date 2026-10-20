import { AppError } from '../utils/app-error.js';

/**
 * Validate params, query and body with Zod schemas. Parsed (coerced, stripped) values are
 * placed on `req.valid` because Express 5 makes `req.query` read-only.
 * @param {{ params?: import('zod').ZodType, query?: import('zod').ZodType, body?: import('zod').ZodType }} schemas
 */
export function validate(schemas) {
  return (req, _res, next) => {
    const valid = {};
    const details = [];

    for (const part of /** @type {const} */ (['params', 'query', 'body'])) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part] ?? {});
      if (result.success) {
        valid[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({ path: [part, ...issue.path].join('.'), message: issue.message });
        }
      }
    }

    if (details.length > 0) return next(AppError.validation(details));
    req.valid = valid;
    return next();
  };
}
