import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Warehouse from '../../src/modules/warehouse/warehouse.model.js';
import InventoryModel from '../../src/modules/inventory/inventory.model.js';
import { clearDatabase } from '../helpers/testUtils.js';
import * as warehouseService from '../../src/modules/warehouse/warehouse.service.js';
import * as inventoryService from '../../src/modules/inventory/inventory.service.js';

describe('Warehouse transfer and reconciliation', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await clearDatabase();
  });

  it('creates two warehouses and transfers stock between them via inventory updates', async () => {
    // Create warehouses
    const w1 = await Warehouse.create({ name: 'W1', capacity: 1000 });
    const w2 = await Warehouse.create({ name: 'W2', capacity: 1000 });

    // Create product inventory in w1
    const productId = new mongoose.Types.ObjectId();
    await InventoryModel.create({
      productId,
      warehouseId: w1._id,
      stock: 100,
      reservedStock: 0,
    });

    // Verify initial load via service
    const warehousesBefore = await warehouseService.getWarehouses();
    const w1Before = warehousesBefore.find(w => w._id.toString() === w1._id.toString());
    expect(w1Before.currentLoad).toBe(100);

    // Transfer: simulate transfer by reducing stock in w1 and adding to w2 using inventoryService API
    await inventoryService.updateStock({ productId, warehouseId: w1._id, stock: 50, type: 'SET' });
    await inventoryService.updateStock({ productId, warehouseId: w2._id, stock: 50, type: 'SET' });

    // Validate loads after transfer
    const warehousesAfter = await warehouseService.getWarehouses();
    const w1After = warehousesAfter.find(w => w._id.toString() === w1._id.toString());
    const w2After = warehousesAfter.find(w => w._id.toString() === w2._id.toString());

    expect(w1After.currentLoad).toBe(50);
    expect(w2After.currentLoad).toBe(50);
  });
});

