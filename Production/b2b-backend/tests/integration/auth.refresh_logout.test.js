import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../../src/modules/user/user.model.js';
import RefreshToken from '../../src/models/RefreshToken.model.js';
import { setupTestDB, teardownTestDB, clearDatabase } from '../helpers/testUtils.js';
import * as authService from '../../src/modules/auth/auth.service.js';

describe('Auth refresh token rotation and logout-all', () => {
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

  it('rotates refresh token and rejects reused token', async () => {
    // Create user
    const password = 'Test@12345';
    const user = await User.create({ name: 'AuthUser', email: 'auth@test.com', password: password, role: 'B2B_CUSTOMER', status: 'ACTIVE' });

    // Mock token generation to produce predictable token values
    jest.spyOn(authService, 'generateAccessToken').mockImplementation(() => 'access_mock');
    // Use createRefreshToken indirectly by loginWithPassword path; instead call createRefreshToken via login flow
    // We'll simulate refresh rotation by creating a RefreshToken document manually
    const tokenValue = 'refresh.mock.token';
    const family = 'family123';
    await RefreshToken.create({
      userId: user._id,
      token: tokenValue,
      family,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      ipAddress: '127.0.0.1',
    });

    // Call refreshAuthToken with valid token — should rotate
    const result = await authService.refreshAuthToken(tokenValue, { ip: '127.0.0.1' });
    expect(result).toBeDefined();
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    // Old token should be revoked
    const old = await RefreshToken.findOne({ token: tokenValue });
    expect(old.isRevoked).toBe(true);

    // Reuse old token should be rejected and family revoked
    // Simulate reuse by calling refreshAuthToken again with the old token (which was revoked)
    await expect(authService.refreshAuthToken(tokenValue, { ip: '127.0.0.1' })).rejects.toThrow();
  });

  it('logoutAll revokes all user tokens', async () => {
    const user = await User.create({ name: 'BulkUser', email: 'bulk@test.com', password: 'Test@12345', role: 'B2B_CUSTOMER', status: 'ACTIVE' });
    // Create multiple tokens
    await RefreshToken.create({
      userId: user._id,
      token: 't1',
      family: 'f1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      ipAddress: '1.1.1.1'
    });
    await RefreshToken.create({
      userId: user._id,
      token: 't2',
      family: 'f2',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      ipAddress: '2.2.2.2'
    });

    // Call logoutAll
    const res = await authService.logoutAll(user._id);
    expect(res.success).toBe(true);

    const tokens = await RefreshToken.find({ userId: user._id });
    expect(tokens.length).toBeGreaterThan(0);
    tokens.forEach(t => expect(t.isRevoked).toBe(true));
  });
});

