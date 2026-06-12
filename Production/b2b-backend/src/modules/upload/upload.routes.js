import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';
import { uploadImageToCloud } from '../../middlewares/upload.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/responseHandler.js';
import { uploadFile } from '../../services/fileUpload.service.js';
import AppError from '../../errors/AppError.js';

const router = express.Router();

router.post(
  '/image',
  authenticate,
  csrfProtection,
  uploadImageToCloud('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('Please upload an image file', 400);
    }

    const folder = req.body.folder || 'uploads';
    const uploadResult = await uploadFile(req.file, folder);

    successResponse(res, {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    }, 'Image uploaded successfully');
  })
);

export default router;
