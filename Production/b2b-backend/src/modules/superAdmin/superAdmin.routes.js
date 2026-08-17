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
import {
  createSupplierSchema,
  updateSupplierSchema,
  updateSupplierStatusSchema,
  supplierIdSchema,
  listSuppliersSchema,
} from '../supplier/supplier.validation.js';
import {
  listSupplierProductsSchema,
  createSupplierProductSchema,
  updateSupplierProductSchema,
  updateSupplierProductStatusSchema,
  supplierProductIdSchema,
  updateSupplierProductPriceSchema,
  listSupplierProductPriceHistorySchema,
  supplierComparisonSchema,
} from '../supplier/supplierProduct.validation.js';
import {
  procurementDemandQuerySchema,
  procurementPlanDateQuerySchema,
  createProcurementPlanSchema,
  procurementPlanIdSchema,
  updateProcurementPlanSchema,
  planSupplierOptionsSchema,
} from '../procurement/procurement.validation.js';

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

router.get(
  '/products/:productId/supplier-comparison',
  validate(supplierComparisonSchema),
  controller.getSupplierComparison
);
router.get(
  '/procurement/demand',
  validate(procurementDemandQuerySchema),
  controller.getProcurementDemand
);
router.get(
  '/procurement/plans/:id/products/:productId/suppliers',
  validate(planSupplierOptionsSchema),
  controller.getProcurementPlanSupplierOptions
);
router.post(
  '/procurement/plans/:id/confirm',
  validate(procurementPlanIdSchema),
  controller.confirmProcurementPlan
);
router.post(
  '/procurement/plans/:id/cancel',
  validate(procurementPlanIdSchema),
  controller.cancelProcurementPlan
);
router.get(
  '/procurement/plans/:id',
  validate(procurementPlanIdSchema),
  controller.getProcurementPlan
);
router.patch(
  '/procurement/plans/:id',
  validate(updateProcurementPlanSchema),
  controller.updateProcurementPlan
);
router.get(
  '/procurement/plans',
  validate(procurementPlanDateQuerySchema),
  controller.getProcurementPlanByDate
);
router.post(
  '/procurement/plans',
  validate(createProcurementPlanSchema),
  controller.createProcurementPlan
);
router.get('/suppliers', validate(listSuppliersSchema), controller.getSuppliers);
router.post('/suppliers', validate(createSupplierSchema), controller.createSupplier);
router.get('/suppliers/:id/products', validate(listSupplierProductsSchema), controller.getSupplierProducts);
router.post('/suppliers/:id/products', validate(createSupplierProductSchema), controller.createSupplierProduct);
router.patch(
  '/suppliers/:id/products/:mappingId/status',
  validate(updateSupplierProductStatusSchema),
  controller.updateSupplierProductStatus
);
router.patch(
  '/suppliers/:id/products/:mappingId/price',
  validate(updateSupplierProductPriceSchema),
  controller.updateSupplierProductPrice
);
router.get(
  '/suppliers/:id/products/:mappingId/price-history',
  validate(listSupplierProductPriceHistorySchema),
  controller.getSupplierProductPriceHistory
);
router.get(
  '/suppliers/:id/products/:mappingId',
  validate(supplierProductIdSchema),
  controller.getSupplierProduct
);
router.patch(
  '/suppliers/:id/products/:mappingId',
  validate(updateSupplierProductSchema),
  controller.updateSupplierProduct
);
router.patch('/suppliers/:id/status', validate(updateSupplierStatusSchema), controller.updateSupplierStatus);
router.get('/suppliers/:id', validate(supplierIdSchema), controller.getSupplier);
router.patch('/suppliers/:id', validate(updateSupplierSchema), controller.updateSupplier);

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
