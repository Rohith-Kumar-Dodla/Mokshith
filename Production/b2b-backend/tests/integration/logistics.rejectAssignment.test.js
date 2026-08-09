import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { clearDatabase } from '../helpers/testUtils.js';
import {
  seedAdminUser,
  seedDeliveryPartner,
  seedActiveUser,
  seedCategory,
  seedProduct,
  DEFAULT_SHIPPING_ADDRESS,
} from '../helpers/integrationFixtures.js';
import Logistics from '../../src/modules/logistics/logistics.model.js';
import Order from '../../src/modules/order/order.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';
import Warehouse from '../../src/modules/warehouse/warehouse.model.js';
import { DELIVERY_STATUS } from '../../src/constants/deliveryStatus.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';
import { PAYMENT_STATUS } from '../../src/constants/paymentStatus.js';
import { ROLES } from '../../src/constants/roles.js';

describe('Logistics assignment rejection', () => {
  let adminToken;
  let partnerA;
  let partnerAToken;
  let partnerB;
  let partnerBToken;
  let vendorToken;
  let customer;
  let product;
  let inventory;

  beforeEach(async () => {
    await clearDatabase();

    const admin = await seedAdminUser({
      email: `admin-reject-${Date.now()}@test.com`,
      mobile: '9876500001',
    });
    adminToken = admin.accessToken;

    const a = await seedDeliveryPartner({
      email: `dp-a-${Date.now()}@test.com`,
      mobile: '9876500002',
      user: { name: 'Partner A' },
    });
    partnerA = a.user;
    partnerAToken = a.accessToken;

    const b = await seedDeliveryPartner({
      email: `dp-b-${Date.now()}@test.com`,
      mobile: '9876500003',
      user: { name: 'Partner B' },
    });
    partnerB = b.user;
    partnerBToken = b.accessToken;

    const vendor = await seedActiveUser({
      role: ROLES.VENDOR,
      email: `vendor-reject-${Date.now()}@test.com`,
      mobile: '9876500004',
    });
    vendorToken = vendor.accessToken;

    const buyer = await seedActiveUser({
      email: `buyer-reject-${Date.now()}@test.com`,
      mobile: '9876500005',
    });
    customer = buyer.user;

    const category = await seedCategory({ slug: `reject-cat-${Date.now()}` });
    product = await seedProduct(category._id, {
      name: 'Reject Flow Product',
      price: 50,
      moq: 1,
      minOrderQty: 1,
      stock: 100,
    });
    const warehouse = await Warehouse.create({
      name: 'Reject WH',
      capacity: 10000,
      location: 'Test City',
      isActive: true,
    });
    inventory = await Inventory.create({
      productId: product._id,
      warehouseId: warehouse._id,
      stock: 100,
      reservedStock: 0,
      soldStock: 0,
    });
  });

  async function createAssignedShipment(partnerId, orderOverrides = {}) {
    const order = await Order.create({
      userId: customer._id,
      items: [
        {
          productId: product._id,
          name: product.name,
          quantity: 2,
          price: 50,
          finalPrice: 50,
        },
      ],
      totalAmount: 100,
      status: ORDER_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentMethod: 'COD',
      address: DEFAULT_SHIPPING_ADDRESS,
      shippingAddress: DEFAULT_SHIPPING_ADDRESS,
      ...orderOverrides,
    });

    const shipment = await Logistics.create({
      orderId: order._id,
      deliveryPartnerId: partnerId,
      status: DELIVERY_STATUS.ASSIGNED,
      address: '12 Market Road, Hyderabad',
      customerName: 'Buyer Shop',
      phone: '9876543210',
      trackingNumber: `TRK-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });

    order.shipmentId = shipment._id;
    await order.save();
    return { order, shipment };
  }

  it('allows DP to reject ASSIGNED assignment and clears active partner', async () => {
    const stockBefore = inventory.stock;
    const { order, shipment } = await createAssignedShipment(partnerA._id);

    const rejectRes = await request(app)
      .post(`/api/v1/logistics/${shipment._id}/reject`)
      .set('Authorization', `Bearer ${partnerAToken}`)
      .send({ reason: 'Vehicle breakdown' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe(DELIVERY_STATUS.REJECTED);
    expect(rejectRes.body.data.deliveryPartnerId).toBeFalsy();

    const refreshed = await Logistics.findById(shipment._id).lean();
    expect(refreshed.status).toBe(DELIVERY_STATUS.REJECTED);
    expect(refreshed.deliveryPartnerId).toBeUndefined();
    expect(String(refreshed.lastRejectedPartnerId)).toBe(String(partnerA._id));
    expect(refreshed.rejectionReason).toBe('Vehicle breakdown');

    const orderAfter = await Order.findById(order._id).lean();
    expect(orderAfter.status).toBe(ORDER_STATUS.CONFIRMED);
    expect(orderAfter.paymentStatus).toBe(PAYMENT_STATUS.PENDING);

    const invAfter = await Inventory.findById(inventory._id).lean();
    expect(invAfter.stock).toBe(stockBefore);

    const myAssignments = await request(app)
      .get('/api/v1/logistics/my-assignments')
      .set('Authorization', `Bearer ${partnerAToken}`);
    expect(myAssignments.status).toBe(200);
    const ids = (myAssignments.body.data || []).map((row) => String(row._id));
    expect(ids).not.toContain(String(shipment._id));
  });

  it('denies reject after accept, other partner, and vendor role', async () => {
    const { shipment } = await createAssignedShipment(partnerA._id);

    await request(app)
      .post(`/api/v1/logistics/${shipment._id}/accept`)
      .set('Authorization', `Bearer ${partnerAToken}`)
      .expect(200);

    const afterAccept = await request(app)
      .post(`/api/v1/logistics/${shipment._id}/reject`)
      .set('Authorization', `Bearer ${partnerAToken}`)
      .send({});
    expect(afterAccept.status).toBe(409);

    const { shipment: shipmentB } = await createAssignedShipment(partnerA._id);
    const foreignReject = await request(app)
      .post(`/api/v1/logistics/${shipmentB._id}/reject`)
      .set('Authorization', `Bearer ${partnerBToken}`)
      .send({});
    expect(foreignReject.status).toBe(403);

    const vendorReject = await request(app)
      .post(`/api/v1/logistics/${shipmentB._id}/reject`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({});
    expect(vendorReject.status).toBe(403);
  });

  it('admin can reassign rejected shipment to another partner', async () => {
    const { shipment } = await createAssignedShipment(partnerA._id);

    await request(app)
      .post(`/api/v1/logistics/${shipment._id}/reject`)
      .set('Authorization', `Bearer ${partnerAToken}`)
      .send({})
      .expect(200);

    const reassign = await request(app)
      .patch(`/api/v1/logistics/${shipment._id}/reassign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deliveryPartnerId: String(partnerB._id) });

    expect(reassign.status).toBe(200);
    expect(reassign.body.data.status).toBe(DELIVERY_STATUS.ASSIGNED);
    expect(String(reassign.body.data.deliveryPartnerId._id || reassign.body.data.deliveryPartnerId)).toBe(
      String(partnerB._id)
    );

    const forA = await request(app)
      .get('/api/v1/logistics/my-assignments')
      .set('Authorization', `Bearer ${partnerAToken}`);
    const forB = await request(app)
      .get('/api/v1/logistics/my-assignments')
      .set('Authorization', `Bearer ${partnerBToken}`);

    const idsA = (forA.body.data || []).map((row) => String(row._id));
    const idsB = (forB.body.data || []).map((row) => String(row._id));
    expect(idsA).not.toContain(String(shipment._id));
    expect(idsB).toContain(String(shipment._id));
  });

  it('only one concurrent reject succeeds', async () => {
    const { shipment } = await createAssignedShipment(partnerA._id);

    const [first, second] = await Promise.all([
      request(app)
        .post(`/api/v1/logistics/${shipment._id}/reject`)
        .set('Authorization', `Bearer ${partnerAToken}`)
        .send({}),
      request(app)
        .post(`/api/v1/logistics/${shipment._id}/reject`)
        .set('Authorization', `Bearer ${partnerAToken}`)
        .send({}),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);

    const count = await Logistics.countDocuments({
      _id: shipment._id,
      status: DELIVERY_STATUS.REJECTED,
    });
    expect(count).toBe(1);
  });
});
