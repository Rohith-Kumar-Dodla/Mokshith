import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AppError from '../errors/AppError.js';
import crypto from 'crypto';

// 🔥 Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 🔥 Ensure we save to the EXACT SAME root uploads folder being served
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Auto-create folder if missing (failsafe)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 🔥 Security: Generate unique filename to prevent path traversal
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(sanitizedOriginalName);
    const basename = path.basename(sanitizedOriginalName, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// 🔥 File filter for security
const fileFilter = (req, file, cb) => {
  // Check file type based on mimetype
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new AppError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`, 400), false);
  }
  
  // Additional security: check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];
  
  if (!allowedExts.includes(ext)) {
    return cb(new AppError('Invalid file extension', 400), false);
  }
  
  cb(null, true);
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Max 5 files at once
  }
});

// Specialized upload for images only
export const uploadImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new AppError('Only image files are allowed', 400), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  }
});