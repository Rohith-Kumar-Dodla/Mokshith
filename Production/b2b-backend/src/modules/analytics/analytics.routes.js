import express from 'express';
import * as analyticsController from './analytics.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication; finance routes require SUPER_ADMIN
router.use(protect);

// Finance and revenue endpoints - SUPER_ADMIN only
router.get('/dashboard', authorize('SUPER_ADMIN'), analyticsController.getDashboard);
router.get('/sales', authorize('SUPER_ADMIN'), analyticsController.getDashboard);
router.get('/orders-trends', authorize('SUPER_ADMIN'), analyticsController.getDashboard);
router.get('/categories', authorize('SUPER_ADMIN'), analyticsController.getDashboard);
router.get('/top-products', authorize('SUPER_ADMIN'), analyticsController.getDashboard);
router.get('/revenue', authorize('SUPER_ADMIN'), analyticsController.getDashboard);

// Delivery analytics can be accessed by Admins and Super Admins
router.get('/delivery', authorize('ADMIN', 'SUPER_ADMIN'), analyticsController.getDeliveryAnalytics);

export default router;