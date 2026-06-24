import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import User from '../../src/modules/user/user.model.js';
import { clearDatabase } from './helpers/testUtils.js';
import { ROLES } from '../../src/constants/roles.js';
import { USER_STATUS } from '../../src/constants/userStatus.js';
import { hashPassword } from '../../src/utils/hashPassword.js';

const request = supertest(app);

describe('Finance endpoints role-based access', () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
    await clearDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('should forbid ADMIN from accessing analytics dashboard (finance)', async () => {
    const password = 'Test@12345';
    const hashed = await hashPassword(password);
    const admin = await User.create({
      name: 'AdminUser',
      email: 'admin@test.com',
      mobile: '9999900001',
      password: hashed,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });

    const token = jwt.sign({ id: admin._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await request
      .get('/api/v1/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should allow SUPER_ADMIN to access analytics dashboard', async () => {
    const password = 'Test@12345';
    const hashed = await hashPassword(password);
    const superAdmin = await User.create({
      name: 'SuperAdmin',
      email: 'super@test.com',
      mobile: '9999900002',
      password: hashed,
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
    });

    const token = jwt.sign({ id: superAdmin._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request
      .get('/api/v1/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should forbid ADMIN from viewing pending bank transfers', async () => {
    const password = 'Test@12345';
    const hashed = await hashPassword(password);
    const admin = await User.create({
      name: 'AdminUser2',
      email: 'admin2@test.com',
      mobile: '9999900003',
      password: hashed,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });

    const token = jwt.sign({ id: admin._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await request
      .get('/api/v1/payments/bank-transfer/pending')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should allow SUPER_ADMIN to view pending bank transfers', async () => {
    const password = 'Test@12345';
    const hashed = await hashPassword(password);
    const superAdmin = await User.create({
      name: 'SuperAdmin2',
      email: 'super2@test.com',
      mobile: '9999900004',
      password: hashed,
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
    });

    const token = jwt.sign({ id: superAdmin._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request
      .get('/api/v1/payments/bank-transfer/pending')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

