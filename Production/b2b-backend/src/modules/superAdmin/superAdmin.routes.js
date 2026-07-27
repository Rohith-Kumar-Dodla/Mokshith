import express from 'express';
import * as controller from './superAdmin.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  updateUserRoleSchema,
  createAdminSchema,
  updateAdminSchema,
  createDeliveryAgentSchema,
  updateDeliveryAgentSchema,
  listStaffSchema,
} from './superAdmin.validation.js';

const router = express.Router();

// 🔥 Only SUPER_ADMIN access
router.use(protect, authorize('SUPER_ADMIN'));

// 👤 Users
router.get('/users', controller.getUsers);
router.get('/admins', validate(listStaffSchema), controller.getAdmins);
router.post('/admins', validate(createAdminSchema), controller.createAdmin);
router.patch('/admins/:id', validate(updateAdminSchema), controller.updateAdmin);
router.delete('/admins/:id', controller.deleteAdmin);

router.get('/delivery-agents', validate(listStaffSchema), controller.getDeliveryAgents);
router.post('/delivery-agents', validate(createDeliveryAgentSchema), controller.createDeliveryAgent);
router.patch('/delivery-agents/:id', validate(updateDeliveryAgentSchema), controller.updateDeliveryAgent);
router.delete('/delivery-agents/:id', controller.deleteDeliveryAgent);

// 🔄 Change role
router.patch(
  '/users/:id/role',
  validate(updateUserRoleSchema),
  controller.updateUserRole
);

// 📊 System stats
router.get('/stats', controller.getStats);
router.get('/metrics', controller.getMetrics);
router.get('/audit-logs', controller.getAuditLogs);
router.get('/audit-logs/export', controller.exportAuditLogs);

// ⚙️ Config
router.get('/config', controller.getConfig);
router.post('/config', controller.updateConfig);

// 🛍️ Catalog
router.get('/categories', controller.getCategories);
router.post('/categories', controller.createCategory);
router.patch('/categories/:id', controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

export default router;
