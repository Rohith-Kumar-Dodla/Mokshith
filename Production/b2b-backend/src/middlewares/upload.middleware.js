import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AppError from '../errors/AppError.js';
import crypto from 'crypto';
import { s3Service } from '../services/s3.service.js';
import { cloudinaryService } from '../services/cloudinary.service.js';
import { logger } from '../config/logger.js';
import { validateAndSanitizeUpload } from '../services/fileValidation.service.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const memoryStorage = multer.memoryStorage();

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(sanitizedOriginalName);
    const basename = path.basename(sanitizedOriginalName, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  try {
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new AppError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`, 400), false);
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];

    if (!allowedExts.includes(ext)) {
      return cb(new AppError('Invalid file extension', 400), false);
    }

    cb(null, true);
  } catch (error) {
    logger.error('File filter error:', error);
    cb(new AppError('File validation error', 400), false);
  }
};

export const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
});

export const uploadImage = multer({
  storage: diskStorage,
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new AppError('Only image files are allowed', 400), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

function shouldUseMemoryStorage() {
  return s3Service.isEnabled() || cloudinaryService.isEnabled();
}

function createUploader(maxFiles = 1) {
  return multer({
    storage: shouldUseMemoryStorage() ? memoryStorage : diskStorage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: maxFiles,
    },
  });
}

/**
 * Parse multipart uploads only. Cloud upload happens in controllers via imageUpload.utils.
 */
export const parseUpload = (fieldName, options = {}) => {
  const { maxFiles = 1 } = options;

  return async (req, res, next) => {
    const uploader = createUploader(maxFiles);
    const uploadHandler = maxFiles === 1
      ? uploader.single(fieldName)
      : uploader.array(fieldName, maxFiles);

    uploadHandler(req, res, async (err) => {
      if (err) {
        return next(new AppError(err.message, 400));
      }

      try {
        if (req.file) {
          if (!req.file.buffer && req.file.path) {
            req.file.buffer = fs.readFileSync(req.file.path);
          }

          req.file = validateAndSanitizeUpload(req.file, 'images');
        } else if (req.files?.length) {
          req.files = req.files.map((file) => {
            if (!file.buffer && file.path) {
              file.buffer = fs.readFileSync(file.path);
            }
            return validateAndSanitizeUpload(file, 'images');
          });
        }

        next();
      } catch (error) {
        logger.error('File upload validation error:', {
          message: error.message,
          field: fieldName,
          originalname: req.file?.originalname,
          mimetype: req.file?.mimetype,
          size: req.file?.size,
          hasBuffer: Boolean(req.file?.buffer?.length),
        });
        return next(new AppError(error.message || 'Failed to process uploaded file', 400));
      }
    });
  };
};

/** @deprecated Use parseUpload — kept for backward compatibility */
export const uploadToCloud = (fieldName, options = {}) => parseUpload(fieldName, options);

export const uploadImageToCloud = (fieldName = 'image') => parseUpload(fieldName, { maxFiles: 1 });

export const uploadImagesToCloud = (fieldName = 'images', maxFiles = 5) => parseUpload(fieldName, { maxFiles });
