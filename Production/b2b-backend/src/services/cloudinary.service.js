import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../config/logger.js';

function readCloudinaryEnv() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY?.trim(),
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
  };
}

function ensureConfigured() {
  const { cloudName, apiKey, apiSecret } = readCloudinaryEnv();

  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

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

  if (!uploadSource) {
    throw new Error('Uploaded file is missing binary content');
  }

  const result = await cloudinary.uploader.upload(uploadSource, {
    folder,
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
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
