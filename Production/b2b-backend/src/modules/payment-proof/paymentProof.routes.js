import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import * as controller from './paymentProof.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';
import AppError from '../../errors/AppError.js';
import {
  uploadPaymentProofSchema,
  rejectPaymentProofSchema,
  paymentProofIdSchema,
  orderIdParamSchema,
} from './paymentProof.validation.js';

const router = express.Router();

const PAYMENT_PROOF_MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

const paymentProofStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'payment-proofs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(sanitizedOriginalName);
    const basename = path.basename(sanitizedOriginalName, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const paymentProofUpload = multer({
  storage: paymentProofStorage,
  limits: { fileSize: PAYMENT_PROOF_MAX_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new AppError('Invalid file type. Allowed: jpg, jpeg, png, pdf', 400), false);
    }
    cb(null, true);
  },
});

router.get('/bank-details', protect, controller.getBankDetails);

router.post(
  '/upload',
  protect,
  csrfProtection,
  paymentProofUpload.single('screenshot'),
  validate(uploadPaymentProofSchema),
  controller.uploadPaymentProof
);

router.get(
  '/pending',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.getPendingPaymentProofs
);

router.get(
  '/order/:orderId',
  protect,
  validate(orderIdParamSchema),
  controller.getPaymentProofByOrderId
);

router.patch(
  '/:id/approve',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  csrfProtection,
  validate(paymentProofIdSchema),
  controller.approvePaymentProof
);

router.patch(
  '/:id/reject',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  csrfProtection,
  validate(rejectPaymentProofSchema),
  controller.rejectPaymentProof
);

export default router;
