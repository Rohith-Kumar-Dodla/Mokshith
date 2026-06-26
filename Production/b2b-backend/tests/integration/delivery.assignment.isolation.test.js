import { describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { clearDatabase } from '../helpers/testUtils.js';
import Logistics from '../../src/modules/logistics/logistics.model.js';

describe('Logistics assignment isolation', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('ensures delivery partner cannot access assignments of another partner', async () => {
    const partnerA = new mongoose.Types.ObjectId();
    const partnerB = new mongoose.Types.ObjectId();
    const orderId = new mongoose.Types.ObjectId();

    await Logistics.create({
      orderId,
      deliveryPartnerId: partnerA,
      status: 'ASSIGNED',
      address: '123 Test Street',
    });

    const foundForB = await Logistics.findOne({ orderId, deliveryPartnerId: partnerB });
    expect(foundForB).toBeNull();

    const foundForA = await Logistics.findOne({ orderId, deliveryPartnerId: partnerA });
    expect(foundForA).not.toBeNull();
  });
});
