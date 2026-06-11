import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import vendorRoutes from './vendorRoutes.js';
import deliveryPartnerRoutes from './deliveryPartnerRoutes.js';
import adminUserRoutes from './adminUserRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import AppConstants from '../constants/appConstants.js';

const router = express.Router();

// Health check route
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Vendor routes
router.use('/vendors', vendorRoutes);

// Delivery partner routes
router.use('/delivery-partners', deliveryPartnerRoutes);

// Admin user management routes
router.use('/admin/users', adminUserRoutes);

// Category management routes
router.use('/categories', categoryRoutes);

// Placeholder for future routes
// router.use('/products', productRoutes);
// router.use('/orders', orderRoutes);

export default router;
