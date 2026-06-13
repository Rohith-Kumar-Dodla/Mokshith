import fs from 'fs';
import { cloudinaryService } from './cloudinary.service.js';
import { s3Service } from './s3.service.js';
import { logger } from '../config/logger.js';

export const uploadFile = async (file, folder = 'images') => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  if (cloudinaryService.isEnabled()) {
    const result = await cloudinaryService.upload(file, folder);
    return {
      url: result.url,
      publicId: result.publicId,
    };
  }

  if (s3Service.isEnabled()) {
    const result = await s3Service.upload(file, folder);
    return {
      url: result.url,
      publicId: result.key,
    };
  }

  if (file.path && fs.existsSync(file.path)) {
    const filename = file.filename || file.path.split(/[/\\]/).pop();
    logger.info('File stored locally', { filename });
    return {
      url: `/uploads/${filename}`,
      publicId: null,
    };
  }

  if (file.buffer) {
    throw new Error('Cloud storage is not configured. Set Cloudinary credentials in the backend environment.');
  }

  throw new Error('File upload failed: no storage backend available');
};
