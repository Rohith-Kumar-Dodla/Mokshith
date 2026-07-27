import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './superAdmin.service.js';
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