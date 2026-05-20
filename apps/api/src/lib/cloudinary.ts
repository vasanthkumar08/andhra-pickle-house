import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';

if (env.hasCloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function getCloudinaryStatus() {
  return {
    configured: env.hasCloudinary,
    cloudName: env.CLOUDINARY_CLOUD_NAME ?? null,
  };
}

export async function verifyCloudinary() {
  if (!env.hasCloudinary) {
    return { ok: false, configured: false, message: 'Cloudinary credentials not configured' };
  }

  await cloudinary.api.ping();
  return { ok: true, configured: true, message: 'Cloudinary connected' };
}

export function createSignedUploadParams(folder = env.CLOUDINARY_UPLOAD_FOLDER) {
  if (!env.hasCloudinary || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured.');
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    env.CLOUDINARY_API_SECRET
  );

  return {
    timestamp,
    folder,
    signature,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
  };
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: UploadApiOptions = {}
): Promise<UploadApiResponse> {
  if (!env.hasCloudinary) {
    throw new Error('Cloudinary is not configured.');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: env.CLOUDINARY_UPLOAD_FOLDER,
        resource_type: 'auto',
        overwrite: false,
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary upload returned no result.'));
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

export function buildOptimizedImageUrl(publicId: string, width = 1200) {
  if (!env.hasCloudinary) {
    throw new Error('Cloudinary is not configured.');
  }

  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{ width, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  });
}

export { cloudinary };

