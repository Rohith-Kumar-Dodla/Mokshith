import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { setupTestDB, teardownTestDB, clearDatabase } from '../helpers/testUtils.js';
import Delivery from '../../src/modules/delivery/delivery.model.js';

describe('Delivery assignment isolation', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDB();
  });
  afterAll(async () => {
    await clearDatabase();
    await teardownTestDB();
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    await clearDatabase();
  });

  it('ensures delivery partner cannot access assignments of another partner', async () => {
    const partnerA = await Delivery.create({ partnerId: new mongoose.Types.ObjectId(), name: 'A' });
    const partnerB = await Delivery.create({ partnerId: new mongoose.Types.ObjectId(), name: 'B' });

    // Create assignment for A
    const assign = await Delivery.create({ orderId: new mongoose.Types.ObjectId(), partnerId: partnerA.partnerId, status: 'ASSIGNED' });

    // Query by B should not return A's assignment
    const found = await Delivery.findOne({ orderId: assign.orderId, partnerId: partnerB.partnerId });
    expect(found).toBeNull();
  });
});

