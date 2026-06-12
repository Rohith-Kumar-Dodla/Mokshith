import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../config/logger.js';

let configured = false;

function ensureConfigured() {
  if (configured) return true;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
  return true;
}

export function isCloudinaryEnabled() {
  return ensureConfigured();
}

export async function uploadToCloudinary(file, folder = 'mokshith') {
  if (!ensureConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const uploadSource = file.buffer
    ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    : file.path;

  const result = await cloudinary.uploader.upload(uploadSource, {
    folder,
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
  });

  logger.info('Image uploaded to Cloudinary', { publicId: result.public_id, folder });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

export async function deleteFromCloudinary(publicId) {
  if (!ensureConfigured() || !publicId) {
    return null;
  }

  return cloudinary.uploader.destroy(publicId);
}

export const cloudinaryService = {
  isEnabled: isCloudinaryEnabled,
  upload: uploadToCloudinary,
  delete: deleteFromCloudinary,
};

export default cloudinaryService;
