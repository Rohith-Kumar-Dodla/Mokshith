import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './superAdmin.service.js';
import * as supplierService from '../supplier/supplier.service.js';
import * as supplierProductService from '../supplier/supplierProduct.service.js';
import * as supplierCategoryService from '../supplier/supplierCategory.service.js';
import * as procurementDemandService from '../procurement/procurementDemand.service.js';
import * as procurementPlanService from '../procurement/procurementPlan.service.js';
import * as purchaseRequestService from '../procurement/purchaseRequest.service.js';
import { successResponse } from '../../utils/responseHandler.js';

export const getUsers = asyncHandler(async (req, res) => {
  const users = await service.getAllUsers();
  successResponse(res, users);
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await service.changeUserRole(
    req.params.id,
    req.body.role
  );

  successResponse(res, user, 'User role updated');
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await service.getSystemStats();
  successResponse(res, stats);
});

export const getAdmins = asyncHandler(async (req, res) => {
  const admins = await service.getAdmins(req.query);
  successResponse(res, admins);
});

export const createAdmin = asyncHandler(async (req, res) => {
  const admin = await service.createAdmin(req.body, req.user?._id, req.ip);
  successResponse(res, admin, 'Admin created successfully', 201);
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const result = await service.deleteAdmin(req.params.id, req.user?._id, req.ip);
  successResponse(res, result);
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await service.updateAdmin(req.params.id, req.body, req.user?._id, req.ip);
  successResponse(res, admin, 'Admin updated successfully');
});

export const getDeliveryAgents = asyncHandler(async (req, res) => {
  const agents = await service.getDeliveryAgents(req.query);
  successResponse(res, agents);
});

export const createDeliveryAgent = asyncHandler(async (req, res) => {
  const agent = await service.createDeliveryAgent(req.body, req.user?._id, req.ip);
  successResponse(res, agent, 'Delivery agent created successfully', 201);
});

export const updateDeliveryAgent = asyncHandler(async (req, res) => {
  const agent = await service.updateDeliveryAgent(req.params.id, req.body, req.user?._id, req.ip);
  successResponse(res, agent, 'Delivery agent updated successfully');
});

export const deleteDeliveryAgent = asyncHandler(async (req, res) => {
  const result = await service.deleteDeliveryAgent(req.params.id, req.user?._id, req.ip);
  successResponse(res, result);
});

export const getMetrics = asyncHandler(async (req, res) => {
  const metrics = await service.getMetrics();
  successResponse(res, metrics);
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await service.getAuditLogs(req.query);
  successResponse(res, logs);
});

export const exportAuditLogs = asyncHandler(async (req, res) => {
  const csv = await service.exportAuditLogs(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
  res.status(200).send(csv);
});

export const getConfig = asyncHandler(async (req, res) => {
  const config = await service.getConfig();
  successResponse(res, config);
});

export const updateConfig = asyncHandler(async (req, res) => {
  const config = await service.updateConfig(req.body, req.user?._id, req.ip);
  successResponse(res, config, 'Config updated');
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await service.getCategories();
  successResponse(res, categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await service.createCategory(req.body);
  successResponse(res, category, 'Category created successfully', 201);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await service.deleteCategory(req.params.id);
  successResponse(res, result);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await service.updateCategory(req.params.id, req.body);
  successResponse(res, category, 'Category updated successfully');
});

export const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await supplierService.listSuppliers(req.query);
  successResponse(res, suppliers);
});

export const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.params.id);
  successResponse(res, supplier);
});

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body, req.user?._id, req.ip);
  successResponse(res, supplier, 'Supplier created successfully', 201);
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateSupplier(
    req.params.id,
    req.body,
    req.user?._id,
    req.ip
  );
  successResponse(res, supplier, 'Supplier updated successfully');
});

export const updateSupplierStatus = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateSupplierStatus(
    req.params.id,
    req.body.status,
    req.user?._id,
    req.ip
  );
  successResponse(res, supplier, 'Supplier status updated successfully');
});

export const getSupplierProducts = asyncHandler(async (req, res) => {
  const mappings = await supplierProductService.listSupplierProducts(req.params.id, req.query);
  successResponse(res, mappings);
});

export const getSupplierCategories = asyncHandler(async (req, res) => {
  const categories = await supplierCategoryService.listSupplierCategories(req.params.id, req.query);
  successResponse(res, categories);
});

export const getSupplierCategory = asyncHandler(async (req, res) => {
  const category = await supplierCategoryService.getSupplierCategory(
    req.params.id,
    req.params.mappingId
  );
  successResponse(res, category);
});

export const createSupplierCategory = asyncHandler(async (req, res) => {
  const category = await supplierCategoryService.createSupplierCategory(
    req.params.id,
    req.body,
    req.user?._id,
    req.ip
  );
  successResponse(res, category, 'Supplier category associated successfully', 201);
});

export const updateSupplierCategoryStatus = asyncHandler(async (req, res) => {
  const category = await supplierCategoryService.updateSupplierCategoryStatus(
    req.params.id,
    req.params.mappingId,
    req.body.status,
    req.user?._id,
    req.ip
  );
  successResponse(res, category, 'Supplier category status updated successfully');
});

export const getSupplierProduct = asyncHandler(async (req, res) => {
  const mapping = await supplierProductService.getSupplierProduct(
    req.params.id,
    req.params.mappingId
  );
  successResponse(res, mapping);
});

export const searchSupplierProducts = asyncHandler(async (req, res) => {
  const products = await supplierProductService.searchProductsForSupplier(req.params.id, req.query);
  successResponse(res, products);
});

export const createSupplierProduct = asyncHandler(async (req, res) => {
  const mapping = req.body.product
    ? await supplierProductService.createSupplierProductWithNewProduct(
      req.params.id,
      req.body,
      req.user?._id,
      req.ip
    )
    : await supplierProductService.createSupplierProduct(
      req.params.id,
      req.body,
      req.user?._id,
      req.ip
    );
  successResponse(res, mapping, 'Supplier product created successfully', 201);
});

export const updateSupplierProduct = asyncHandler(async (req, res) => {
  const mapping = await supplierProductService.updateSupplierProduct(
    req.params.id,
    req.params.mappingId,
    req.body,
    req.user?._id,
    req.ip
  );
  successResponse(res, mapping, 'Supplier product updated successfully');
});

export const updateSupplierProductStatus = asyncHandler(async (req, res) => {
  const mapping = await supplierProductService.updateSupplierProductStatus(
    req.params.id,
    req.params.mappingId,
    req.body.status,
    req.user?._id,
    req.ip
  );
  successResponse(res, mapping, 'Supplier product status updated successfully');
});

export const updateSupplierProductPrice = asyncHandler(async (req, res) => {
  const mapping = await supplierProductService.setSupplierProductPrice(
    req.params.id,
    req.params.mappingId,
    req.body.price,
    req.user?._id,
    req.ip
  );
  successResponse(res, mapping, 'Supplier price updated successfully');
});

export const getSupplierProductPriceHistory = asyncHandler(async (req, res) => {
  const history = await supplierProductService.listSupplierProductPriceHistory(
    req.params.id,
    req.params.mappingId,
    req.query
  );
  successResponse(res, history);
});

export const getSupplierComparison = asyncHandler(async (req, res) => {
  const comparison = await supplierProductService.compareSuppliersForProduct(req.params.productId);
  successResponse(res, comparison);
});

export const getProcurementDemand = asyncHandler(async (req, res) => {
  const demand = await procurementDemandService.getProcurementDemand({ date: req.query.date });
  successResponse(res, demand);
});

export const getProcurementPlanByDate = asyncHandler(async (req, res) => {
  const result = await procurementPlanService.getProcurementPlanByDate(req.query.date);
  successResponse(res, result);
});

export const createProcurementPlan = asyncHandler(async (req, res) => {
  const result = await procurementPlanService.createProcurementPlan(
    req.body.date,
    req.user?._id,
    req.ip
  );
  successResponse(res, result, 'Procurement plan saved as draft', 201);
});

export const getProcurementPlan = asyncHandler(async (req, res) => {
  const result = await procurementPlanService.getProcurementPlanById(req.params.id);
  successResponse(res, result);
});

export const updateProcurementPlan = asyncHandler(async (req, res) => {
  const result = await procurementPlanService.updateProcurementPlan(
    req.params.id,
    req.body,
    req.user?._id,
    req.ip
  );
  successResponse(res, result, 'Procurement plan updated');
});

export const confirmProcurementPlan = asyncHandler(async (req, res) => {
  const result = await procurementPlanService.confirmProcurementPlan(
    req.params.id,
    req.user?._id,
    req.ip
  );
  successResponse(res, result, 'Procurement plan confirmed');
});

export const cancelProcurementPlan = asyncHandler(async (req, res) => {
  const result = await procurementPlanService.cancelProcurementPlan(
    req.params.id,
    req.user?._id,
    req.ip
  );
  successResponse(res, result, 'Procurement plan cancelled');
});

export const getProcurementPlanSupplierOptions = asyncHandler(async (req, res) => {
  const comparison = await procurementPlanService.getPlanSupplierOptions(
    req.params.id,
    req.params.productId
  );
  successResponse(res, comparison);
});

export const getDemandProductSupplierAllocation = asyncHandler(async (req, res) => {
  const allocation = await purchaseRequestService.getDemandProductSupplierAllocation(
    req.params.date,
    req.params.productId
  );
  successResponse(res, allocation);
});

export const listPurchaseRequests = asyncHandler(async (req, res) => {
  const result = await purchaseRequestService.listPurchaseRequests(req.query);
  successResponse(res, result);
});

export const getPurchaseRequest = asyncHandler(async (req, res) => {
  const request = await purchaseRequestService.getPurchaseRequestById(req.params.id);
  successResponse(res, request);
});

export const createPurchaseRequest = asyncHandler(async (req, res) => {
  const request = await purchaseRequestService.createPurchaseRequest(
    req.body,
    req.user?._id,
    req.ip
  );
  successResponse(res, request, 'Purchase request saved as draft', 201);
});

export const updatePurchaseRequest = asyncHandler(async (req, res) => {
  const request = await purchaseRequestService.updatePurchaseRequest(
    req.params.id,
    req.body,
    req.user?._id,
    req.ip
  );
  successResponse(res, request, 'Purchase request updated');
});

export const submitPurchaseRequest = asyncHandler(async (req, res) => {
  const request = await purchaseRequestService.submitPurchaseRequest(
    req.params.id,
    req.body,
    req.user?._id,
    req.ip
  );
  successResponse(res, request, 'Purchase request submitted');
});

export const cancelPurchaseRequest = asyncHandler(async (req, res) => {
  const request = await purchaseRequestService.cancelPurchaseRequest(
    req.params.id,
    req.user?._id,
    req.ip
  );
  successResponse(res, request, 'Purchase request cancelled');
});

export const acknowledgePurchaseRequest = asyncHandler(async (req, res) => {
  const request = await purchaseRequestService.acknowledgePurchaseRequest(
    req.params.id,
    req.body,
    req.user?._id,
    req.ip
  );
  successResponse(res, request, 'Supplier response recorded');
});

export const receivePurchaseRequest = asyncHandler(async (req, res) => {
  const request = await purchaseRequestService.receivePurchaseRequest(
    req.params.id,
    req.body,
    req.user?._id,
    req.ip
  );
  successResponse(res, request, 'Goods received');
});