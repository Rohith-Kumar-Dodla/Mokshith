import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './inventory.service.js';
import { successResponse } from '../../utils/responseHandler.js';
import { logAction } from '../audit/audit.service.js';

export const addStock = asyncHandler(async (req, res) => {
  const data = await service.addStock(req.body);
  await logAction({ userId: req.user?._id, action: 'INVENTORY_STOCK_ADDED', entity: 'Inventory', entityId: data?._id, details: 'Inventory stock added', data: req.body }).catch(() => {});
  successResponse(res, data, 'Stock updated');
});

export const getInventory = asyncHandler(async (req, res) => {
  const limit = req.query.limit;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const skip =
    req.query.skip !== undefined
      ? Number(req.query.skip)
      : (page - 1) * (Number(limit) || 500);

  const data = await service.getInventory({ limit, skip });
  successResponse(res, data);
});

export const getLowStockItems = asyncHandler(async (req, res) => {
  const data = await service.getLowStockItems();
  successResponse(res, data);
});

export const getInventoryStats = asyncHandler(async (req, res) => {
  const data = await service.getInventoryStats();
  successResponse(res, data);
});

export const updateStock = asyncHandler(async (req, res) => {
  const data = await service.updateStock(req.body);
  await logAction({ userId: req.user?._id, action: 'INVENTORY_STOCK_UPDATED', entity: 'Inventory', entityId: data?._id, details: 'Inventory stock adjusted', data: req.body }).catch(() => {});
  successResponse(res, data, 'Stock updated successfully');
});
