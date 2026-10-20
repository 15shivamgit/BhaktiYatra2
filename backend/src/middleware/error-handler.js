import mongoose from 'mongoose';
import { ERROR_CODES } from '../config/constants.js';
import { AppError } from '../utils/app-error.js';

/** 404 for any route that no router handled. */
export function notFound() {
  return (req, _res, next) => next(AppError.notFound(`Route ${req.method} ${req.path} not found`));
}

/** Translate known library errors into AppErrors; return null for unknown errors. */
function toAppError(err) {
  if (err instanceof AppError) return err;
  if (err?.type === 'entity.parse.failed') return AppError.badRequest('Malformed JSON body');
  if (err?.type === 'entity.too.large') {
    return new AppError(413, ERROR_CODES.PAYLOAD_TOO_LARGE, 'Request body too large');
  }
  if (err instanceof mongoose.Error.CastError) {
    return AppError.badRequest(`Invalid value for ${err.path}`);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return AppError.validation(details);
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    return new AppError(409, ERROR_CODES.CONFLICT, `A record with this ${field} already exists`);
  }
  return null;
}

/**
 * Final error middleware: always replies with the error envelope and never leaks stack traces.
 * @param {import('pino').Logger} logger
 */
export function errorHandler(logger) {
  // Express identifies error middleware by its four parameters, so _next must stay.
  return (err, req, res, _next) => {
    const known = toAppError(err);
    const status = known?.status ?? 500;

    if (status >= 500) {
      (req.log ?? logger).error({ err, requestId: req.id }, 'Unhandled error');
    }

    const body = {
      success: false,
      code: known?.code ?? ERROR_CODES.INTERNAL_ERROR,
      message: known?.message ?? 'Something went wrong. Please try again.',
      requestId: req.id,
    };
    if (known?.details !== undefined) body.details = known.details;
    res.status(status).json(body);
  };
}
