import { ERROR_CODES } from '../config/constants.js';

/**
 * Expected, client-facing error. Anything that is not an AppError is treated as a bug
 * and reported as 500 INTERNAL_ERROR without leaking details.
 */
export class AppError extends Error {
  /**
   * @param {number} status HTTP status code
   * @param {string} code machine-readable code
   * @param {string} message human-readable message safe to show users
   * @param {unknown} [details] optional structured details (e.g. validation issues)
   */
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details) {
    return new AppError(400, ERROR_CODES.BAD_REQUEST, message, details);
  }

  static notFound(message = 'Not found') {
    return new AppError(404, ERROR_CODES.NOT_FOUND, message);
  }

  static unauthenticated(code = ERROR_CODES.UNAUTHENTICATED, message = 'Please log in') {
    return new AppError(401, code, message);
  }

  static forbidden(code = ERROR_CODES.FORBIDDEN, message = 'You do not have access to this') {
    return new AppError(403, code, message);
  }

  static conflict(code, message) {
    return new AppError(409, code, message);
  }

  static validation(details, message = 'Validation failed') {
    return new AppError(422, ERROR_CODES.VALIDATION_ERROR, message, details);
  }
}
