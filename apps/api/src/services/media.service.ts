import {
  buildOptimizedImageUrl,
  createSignedUploadParams,
  getCloudinaryStatus,
  uploadBufferToCloudinary,
} from '../lib/cloudinary';

export class MediaService {
  status() {
    return getCloudinaryStatus();
  }

  signedUpload(folder?: string) {
    return createSignedUploadParams(folder);
  }

  async uploadImage(buffer: Buffer, filename?: string) {
    const result = await uploadBufferToCloudinary(buffer, {
      public_id: filename,
      resource_type: 'image',
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      optimizedUrl: buildOptimizedImageUrl(result.public_id),
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }

  optimizedUrl(publicId: string, width?: number) {
    return buildOptimizedImageUrl(publicId, width);
  }
}

export const mediaService = new MediaService();

