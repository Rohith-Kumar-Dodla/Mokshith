import { cloudinaryService } from '../services/cloudinary.service.js';
import { s3Service } from '../services/s3.service.js';
import { uploadFile } from '../services/fileUpload.service.js';
import { logger } from '../config/logger.js';

export async function deleteStoredAsset(publicId) {
  if (!publicId) return;

  try {
    if (cloudinaryService.isEnabled()) {
      await cloudinaryService.delete(publicId);
      return;
    }

    if (s3Service.isEnabled()) {
      await s3Service.delete(publicId);
    }
  } catch (error) {
    logger.warn('Failed to delete previous uploaded asset', {
      publicId,
      error: error.message,
    });
  }
}

export async function applyUploadedImage(data, file, folder = 'images') {
  if (!file) {
    return data;
  }

  const uploadResult = await uploadFile(file, folder);

  return {
    ...data,
    image: uploadResult.url,
    imageUrl: uploadResult.url,
    imagePublicId: uploadResult.publicId || null,
  };
}

export function stripImageFields(data = {}) {
  const next = { ...data };
  delete next.image;
  delete next.imageUrl;
  delete next.imagePublicId;
  return next;
}

export async function replaceStoredImage(existingRecord, data, file, folder = 'images') {
  const payload = stripImageFields(data);

  if (file) {
    const next = await applyUploadedImage(payload, file, folder);

    const previousPublicId = existingRecord?.imagePublicId;
    const nextPublicId = next.imagePublicId;

    if (previousPublicId && previousPublicId !== nextPublicId) {
      await deleteStoredAsset(previousPublicId);
    }

    return next;
  }

  // Allow pre-uploaded image URLs (upload endpoint already stored the asset)
  if (data.imageUrl) {
    return {
      ...payload,
      image: data.imageUrl,
      imageUrl: data.imageUrl,
      imagePublicId: data.imagePublicId ?? existingRecord?.imagePublicId ?? null,
    };
  }

  return payload;
}

export function appendCacheBust(url, version) {
  if (!url || !version) {
    return url || '';
  }

  const stamp = typeof version === 'string' || version instanceof Date
    ? new Date(version).getTime()
    : Number(version);

  if (!stamp || Number.isNaN(stamp)) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${stamp}`;
}
