import { describe, it, expect, beforeEach } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import Order from '../../src/modules/order/order.model.js';
import Logistics from '../../src/modules/logistics/logistics.model.js';
import { clearDatabase } from '../helpers/testUtils.js';
import {
  seedAdminUser,
  seedDeliveryPartner,
  seedCheckoutFixture,
  seedConfirmedOrder,
} from '../helpers/integrationFixtures.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';
import { DELIVERY_STATUS } from '../../src/constants/deliveryStatus.js';
import { redisClient } from '../../src/config/redis.js';

const request = supertest(app);

describe('Delivery order status synchronization', () => {
  let adminToken;
  let partnerToken;
  let otherPartnerToken;
  let order;
  let shipment;

  beforeEach(async () => {
    await clearDatabase();
    await redisClient.flushdb();

    const checkout = await seedCheckoutFixture({
      email: `checkout-${Date.now()}@test.com`,
      mobile: `98765${String(Date.now()).slice(-5)}`,
    });
    const admin = await seedAdminUser();
    const partner = await seedDeliveryPartner();
    const otherPartner = await seedDeliveryPartner();

    adminToken = admin.accessToken;
    partnerToken = partner.accessToken;
    otherPartnerToken = otherPartner.accessToken;

    order = await seedConfirmedOrder(checkout.user._id, checkout, {
      status: ORDER_STATUS.PACKED,
      paymentStatus: 'PAID',
      statusHistory: [
        {
          status: ORDER_STATUS.PACKED,
          changedAt: new Date(),
          note: 'Packed for dispatch',
        },
      ],
    });

    shipment = await Logistics.create({
      orderId: order._id,
      deliveryPartnerId: partner.user._id,
      status: DELIVERY_STATUS.ASSIGNED,
      address: '123 Delivery Street',
      customerName: 'Test Customer',
      phone: '9876543210',
      trackingNumber: 'TRK-TEST-001',
    });

    await Order.findByIdAndUpdate(order._id, {
      shipmentId: shipment._id,
      status: ORDER_STATUS.ASSIGNED,
      $push: {
        statusHistory: {
          status: ORDER_STATUS.ASSIGNED,
          changedAt: new Date(),
          note: 'Assigned to delivery partner',
        },
      },
    });
  });

  it('syncs delivery partner accept action to canonical order status', async () => {
    const response = await request
      .post(`/api/v1/logistics/${shipment._id}/accept`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(200);

    expect(response.body.data.status).toBe(DELIVERY_STATUS.ACCEPTED);

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.status).toBe(ORDER_STATUS.ACCEPTED);
    expect(updatedOrder.statusHistory.some((entry) => entry.status === ORDER_STATUS.ACCEPTED)).toBe(
      true
    );
  });

  it('progresses order status through delivery lifecycle', async () => {
    await request
      .post(`/api/v1/logistics/${shipment._id}/accept`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(200);

    await request
      .post(`/api/v1/logistics/${shipment._id}/pick`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(200);

    await request
      .post(`/api/v1/logistics/${shipment._id}/start`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(200);

    await request
      .post(`/api/v1/logistics/${shipment._id}/delivered`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(200);

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.status).toBe(ORDER_STATUS.DELIVERED);

    const historyStatuses = updatedOrder.statusHistory.map((entry) => entry.status);
    expect(historyStatuses).toEqual(
      expect.arrayContaining([
        ORDER_STATUS.ASSIGNED,
        ORDER_STATUS.ACCEPTED,
        ORDER_STATUS.PICKED_UP,
        ORDER_STATUS.OUT_FOR_DELIVERY,
        ORDER_STATUS.DELIVERED,
      ])
    );
  });

  it('prevents unassigned delivery partner from updating status', async () => {
    await request
      .post(`/api/v1/logistics/${shipment._id}/accept`)
      .set('Authorization', `Bearer ${otherPartnerToken}`)
      .expect(403);

    const unchangedOrder = await Order.findById(order._id);
    expect(unchangedOrder.status).toBe(ORDER_STATUS.ASSIGNED);
  });

  it('exposes synchronized status on admin orders API', async () => {
    await request
      .post(`/api/v1/logistics/${shipment._id}/accept`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(200);

    await request
      .post(`/api/v1/logistics/${shipment._id}/start`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(400);

    await request
      .post(`/api/v1/logistics/${shipment._id}/pick`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(200);

    await request
      .post(`/api/v1/logistics/${shipment._id}/start`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(200);

    const response = await request
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const orders = response.body.data?.orders || response.body.data || [];
    const found = orders.find((item) => String(item._id) === String(order._id));
    expect(found?.status).toBe(ORDER_STATUS.OUT_FOR_DELIVERY);
  });
});
