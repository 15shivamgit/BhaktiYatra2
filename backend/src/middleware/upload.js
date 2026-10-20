import { fileTypeFromBuffer } from 'file-type';
import multer from 'multer';
import { ERROR_CODES } from '../config/constants.js';
import { MAX_IMAGE_BYTES } from '../config/content.js';
import { AppError } from '../utils/app-error.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Multipart image upload kept in memory (never written to disk), with the real type sniffed
 * from the bytes rather than trusting the file name or Content-Type (NFR-SEC-06).
 * @param {{ field: string, maxFiles: number }} options
 */
export function imageUpload({ field, maxFiles }) {
  const parser = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES, files: maxFiles, fields: 20 },
  });
  const parse = maxFiles === 1 ? parser.single(field) : parser.array(field, maxFiles);

  const parseStep = (req, res, next) =>
    parse(req, res, (error) => {
      if (!error) return next();
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return next(
            new AppError(413, ERROR_CODES.PAYLOAD_TOO_LARGE, 'Each image must be 5 MB or smaller'),
          );
        }
        return next(
          AppError.validation([
            {
              path: error.field ?? field,
              message: `Upload up to ${maxFiles} image${maxFiles > 1 ? 's' : ''} in the "${field}" field`,
            },
          ]),
        );
      }
      return next(error);
    });

  const sniffStep = async (req, _res, next) => {
    const files = req.files ?? (req.file ? [req.file] : []);
    if (files.length === 0) {
      return next(AppError.validation([{ path: field, message: 'Choose at least one image' }]));
    }
    for (const file of files) {
      const type = await fileTypeFromBuffer(file.buffer);
      if (!type || !ALLOWED_MIME.has(type.mime)) {
        return next(
          new AppError(
            415,
            ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
            `${file.originalname} is not a JPEG, PNG or WebP image`,
          ),
        );
      }
      file.detectedMime = type.mime;
    }
    req.uploadedFiles = files;
    return next();
  };

  return [parseStep, sniffStep];
}
