import { randomToken } from '../../utils/crypto.js';
import { AppError } from '../../utils/app-error.js';
import { ERROR_CODES } from '../../config/constants.js';

/** @typedef {{ env: any, logger: import('pino').Logger, providers: { images: import('../../providers/cloudinary.provider.js').ImageStore } }} Ctx */

export function assertImageStore(ctx) {
  if (!ctx.providers.images.enabled) {
    throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Image storage is not configured');
  }
}

/**
 * True when the asset lives in this app's Cloudinary folder. Images that were referenced from
 * elsewhere (for example the owner's original uploads used by the seed) are only unlinked,
 * never deleted from Cloudinary.
 */
export function isManagedAsset(ctx, publicId) {
  return typeof publicId === 'string' && publicId.startsWith(`${ctx.env.CLOUDINARY_FOLDER}/`);
}

export async function destroyIfManaged(ctx, publicId) {
  if (!isManagedAsset(ctx, publicId)) return;
  try {
    await ctx.providers.images.destroy(publicId);
  } catch (error) {
    // The record is already gone; an orphaned asset is harmless and can be cleaned up later.
    ctx.logger.warn({ publicId, err: error.message }, 'Cloudinary delete failed');
  }
}

/**
 * Upload files one by one so successful uploads are kept if a later one fails.
 * @param {Ctx} ctx
 * @param {Express.Multer.File[]} files
 * @param {{ folder: string, alts?: string[] }} options
 */
export async function uploadImages(ctx, files, { folder, alts = [] }) {
  assertImageStore(ctx);
  const uploaded = [];
  const failed = [];
  for (const [index, file] of files.entries()) {
    try {
      const result = await ctx.providers.images.uploadImage(file.buffer, {
        folder,
        publicId: randomToken(12),
      });
      uploaded.push({ ...result, alt: (alts[index] ?? '').trim().slice(0, 200) });
    } catch (error) {
      ctx.logger.warn({ file: file.originalname, err: error.message }, 'Image upload failed');
      failed.push({ name: file.originalname, reason: 'Upload to image storage failed' });
    }
  }
  if (uploaded.length === 0 && failed.length > 0) {
    throw new AppError(
      502,
      ERROR_CODES.PROVIDER_ERROR,
      'Image storage rejected the upload',
      failed,
    );
  }
  return { uploaded, failed };
}

/** Keep `order` contiguous and exactly one primary image (the first if none is flagged). */
export function normaliseImages(images) {
  const sorted = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const primaryIndex = Math.max(
    0,
    sorted.findIndex((image) => image.isPrimary),
  );
  return sorted.map((image, index) => ({
    url: image.url,
    publicId: image.publicId,
    alt: image.alt ?? '',
    width: image.width,
    height: image.height,
    order: index,
    isPrimary: index === primaryIndex,
  }));
}

/**
 * Apply alt/order/primary edits to existing images. Unknown publicIds are rejected; images not
 * mentioned keep their values.
 * @param {any[]} current
 * @param {{ publicId: string, alt?: string, order?: number, isPrimary?: boolean }[]} edits
 */
export function applyImageEdits(current, edits) {
  const byId = new Map(current.map((image) => [image.publicId, { ...image }]));
  const unknown = edits.filter((edit) => !byId.has(edit.publicId)).map((edit) => edit.publicId);
  if (unknown.length) {
    throw AppError.validation(
      unknown.map((id) => ({ path: 'images', message: `Unknown image ${id}` })),
    );
  }
  const primaryEdits = edits.filter((edit) => edit.isPrimary === true);
  if (primaryEdits.length > 1) {
    throw AppError.validation([{ path: 'images', message: 'Only one image can be primary' }]);
  }
  if (primaryEdits.length === 1) {
    for (const image of byId.values()) image.isPrimary = false;
  }
  for (const edit of edits) {
    const image = byId.get(edit.publicId);
    if (edit.alt !== undefined) image.alt = edit.alt;
    if (edit.order !== undefined) image.order = edit.order;
    if (edit.isPrimary !== undefined) image.isPrimary = edit.isPrimary;
  }
  return normaliseImages([...byId.values()]);
}
