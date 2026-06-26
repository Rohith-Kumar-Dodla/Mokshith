import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Inventory from '../../src/modules/inventory/inventory.model.js';
import { reduceStock } from '../../src/modules/inventory/inventory.service.js';
import { clearDatabase } from '../helpers/testUtils.js';

describe('Inventory concurrency stress (small scale)', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await clearDatabase();
  });

  it('prevents oversell under concurrent reduceStock calls', async () => {
    const productId = new mongoose.Types.ObjectId();
    const warehouseId = new mongoose.Types.ObjectId();
    await Inventory.create({ productId, warehouseId, stock: 10, reservedStock: 0, version: 1 });

    // Simulate 5 concurrent requests each trying to deduct 3 units (total 15 > 10)
    const calls = Array.from({ length: 5 }, () => reduceStock(productId, 3, { maxRetries: 3 }));
    const results = await Promise.allSettled(calls);
    const successes = results.filter(r => r.status === 'fulfilled').length;
    // At most floor(10/3)=3 successful deductions
    expect(successes).toBeLessThanOrEqual(3);
  }, 20000);
});

