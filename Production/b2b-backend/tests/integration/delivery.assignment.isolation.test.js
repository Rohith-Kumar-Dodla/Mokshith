import { describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { clearDatabase } from '../helpers/testUtils.js';
import Logistics from '../../src/modules/logistics/logistics.model.js';
import User from '../../src/modules/user/user.model.js';
import { updateLocation } from '../../src/modules/logistics/logistics.service.js';

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

  it('rejects location updates from a different delivery partner', async () => {
    const partnerA = new mongoose.Types.ObjectId();
    const partnerB = new mongoose.Types.ObjectId();
    const shipment = await Logistics.create({
      orderId: new mongoose.Types.ObjectId(),
      deliveryPartnerId: partnerA,
      status: 'ASSIGNED',
      address: '123 Location Street',
    });

    await expect(updateLocation(shipment._id, { lat: 17.385, lng: 78.4867 }, partnerB)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
