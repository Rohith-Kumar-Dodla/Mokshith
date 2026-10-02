import mongoose from 'mongoose';
import DeleteRequest from './deleteRequest.model.js';
import Product from '../product/product.model.js';
import Category from '../category/category.model.js';
import Warehouse from '../warehouse/warehouse.model.js';
import User from '../user/user.model.js';
import * as productService from '../product/product.service.js';
import * as categoryService from '../category/category.service.js';
import * as warehouseService from '../warehouse/warehouse.service.js';
import * as userService from '../user/user.service.js';
import Audit from '../audit/audit.model.js';
import AppError from '../../errors/AppError.js';
import { publishSuperAdminEvent } from '../notification/businessNotification.service.js';

const targets = {
  PRODUCT: { model: Product, select: 'name sku updatedAt isActive', display: (row) => `${row.name}${row.sku ? ` (${row.sku})` : ''}`, execute: (id, actor) => productService.deleteProduct(id, { userId: actor._id, role: actor.role }) },
  CATEGORY: { model: Category, select: 'name updatedAt', display: (row) => row.name, execute: (id) => categoryService.deleteCategory(id) },
  WAREHOUSE: { model: Warehouse, select: 'name code updatedAt', display: (row) => `${row.name}${row.code ? ` (${row.code})` : ''}`, execute: (id) => warehouseService.deleteWarehouse(id) },
  USER: { model: User, select: 'name email role updatedAt isDeleted', display: (row) => `${row.name} (${row.email})`, execute: (id) => userService.deleteUser(id) },
};

const audit = (userId, action, request, details, severity = 'INFO') => Audit.create({ userId, action, entity: 'DELETE_REQUEST', entityId: request._id, details, data: { entityType: request.entityType, targetEntityId: request.entityId }, severity });

export async function createDeleteRequest(data, requester) {
  if (!mongoose.Types.ObjectId.isValid(data.entityId)) throw new AppError('Invalid entity ID', 400);
  if (requester.role === 'SUPER_ADMIN') throw new AppError('Super Admin must use the authorized destructive operation directly', 400);
  const config = targets[data.entityType];
  const entity = await config.model.findById(data.entityId).select(config.select).lean();
  if (!entity || entity.isDeleted) throw new AppError('Entity not found', 404);
  const duplicate = await DeleteRequest.findOne({ entityType: data.entityType, entityId: data.entityId, status: 'PENDING' });
  if (duplicate) throw new AppError('A pending delete request already exists for this entity', 409);
  let request;
  try { request = await DeleteRequest.create({ requester: requester._id, requesterRole: requester.role, entityType: data.entityType, entityId: data.entityId, entityDisplay: config.display(entity), entityVersion: entity.updatedAt || null, reason: data.reason || '' }); }
  catch (error) { if (error?.code === 11000) throw new AppError('A pending delete request already exists for this entity', 409); throw error; }
  await audit(requester._id, 'DELETE_REQUEST_CREATED', request, `Requested deletion of ${request.entityDisplay}`);
  await publishSuperAdminEvent('DELETE_REQUEST_CREATED', { entityType: 'DELETE_REQUEST', entityId: request._id, actorId: requester._id, businessKey: 'created', actionUrl: '/super-admin/delete-requests', message: `${requester.name} requested deletion of ${request.entityDisplay}.` }).catch(() => {});
  return request;
}

export async function listDeleteRequests(query = {}) {
  const page = Number(query.page || 1), limit = Number(query.limit || 20); const match = {};
  if (query.status) match.status = query.status; if (query.entityType) match.entityType = query.entityType;
  const [requests, total] = await Promise.all([DeleteRequest.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('requester', 'name email role').populate('reviewedBy', 'name email').lean(), DeleteRequest.countDocuments(match)]);
  return { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function pending(id) { const request = await DeleteRequest.findById(id); if (!request) throw new AppError('Delete request not found', 404); if (request.status !== 'PENDING') throw new AppError('Delete request has already been reviewed', 409); return request; }

export async function approveDeleteRequest(id, reviewer) {
  const request = await pending(id);
  if (String(request.requester) === String(reviewer._id)) throw new AppError('A requester cannot approve their own request', 403);
  const config = targets[request.entityType]; const entity = await config.model.findById(request.entityId).select(config.select).lean();
  if (!entity || entity.isDeleted || (request.entityVersion && entity.updatedAt && new Date(entity.updatedAt).getTime() !== new Date(request.entityVersion).getTime())) {
    request.status = 'STALE'; request.reviewedBy = reviewer._id; request.reviewedAt = new Date(); request.executionResult = { message: 'Entity was removed or changed after the request was created' }; await request.save(); await audit(reviewer._id, 'DELETE_REQUEST_STALE', request, request.executionResult.message, 'WARNING'); throw new AppError('Delete request is stale; create a new request after reviewing the entity', 409);
  }
  try { request.executionResult = await config.execute(request.entityId, reviewer); request.status = 'APPROVED'; }
  catch (error) { request.status = 'FAILED'; request.executionResult = { message: error.message }; request.reviewedBy = reviewer._id; request.reviewedAt = new Date(); await request.save(); await audit(reviewer._id, 'DELETE_REQUEST_FAILED', request, error.message, 'ERROR'); throw error; }
  request.reviewedBy = reviewer._id; request.reviewedAt = new Date(); await request.save(); await audit(reviewer._id, 'DELETE_REQUEST_APPROVED', request, `Approved and executed deletion of ${request.entityDisplay}`, 'WARNING'); return request;
}

export async function rejectDeleteRequest(id, rejectionReason, reviewer) {
  const request = await pending(id); if (String(request.requester) === String(reviewer._id)) throw new AppError('A requester cannot reject their own request', 403);
  request.status = 'REJECTED'; request.rejectionReason = rejectionReason; request.reviewedBy = reviewer._id; request.reviewedAt = new Date(); await request.save(); await audit(reviewer._id, 'DELETE_REQUEST_REJECTED', request, `Rejected deletion of ${request.entityDisplay}: ${rejectionReason}`, 'WARNING'); return request;
}
