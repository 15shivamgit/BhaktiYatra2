import { v2 as cloudinary } from 'cloudinary';

/**
 * @typedef {object} ImageStore
 * @property {boolean} enabled
 * @property {(buffer: Buffer, opts: { folder: string, publicId: string }) => Promise<{ url: string, publicId: string, width: number, height: number }>} uploadImage
 * @property {(publicId: string) => Promise<void>} destroy
 */

/**
 * Cloudinary image storage. Uploads are always signed server-side; unsigned presets are never used.
 * @param {{ cloudName?: string, apiKey?: string, apiSecret?: string }} config
 * @returns {ImageStore}
 */
export function createCloudinaryProvider({ cloudName, apiKey, apiSecret }) {
  const enabled = Boolean(cloudName && apiKey && apiSecret);
  if (enabled) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  return {
    enabled,

    uploadImage(buffer, { folder, publicId }) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, public_id: publicId, resource_type: 'image', overwrite: false },
          (error, result) => {
            if (error || !result) {
              reject(new Error(error?.message ?? 'Cloudinary upload failed'));
              return;
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
            });
          },
        );
        stream.end(buffer);
      });
    },

    async destroy(publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    },
  };
}
