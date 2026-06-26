import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../../src/modules/user/user.model.js';
import RefreshToken from '../../src/models/RefreshToken.model.js';
import { clearDatabase } from '../helpers/testUtils.js';
import * as authService from '../../src/modules/auth/auth.service.js';
import { hashPassword } from '../../src/utils/hashPassword.js';

describe('Auth refresh token rotation and logout-all', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await clearDatabase();
  });

  it('rotates refresh token and rejects reused token', async () => {
    const password = 'Test@12345';
    const hashed = await hashPassword(password);
    const user = await User.create({
      name: 'AuthUser',
      email: 'auth@test.com',
      mobile: '9876500101',
      password: hashed,
      role: 'B2B_CUSTOMER',
      status: 'ACTIVE',
    });

    const tokenValue = 'refresh.mock.token';
    const family = 'family123';
    await RefreshToken.create({
      userId: user._id,
      token: tokenValue,
      family,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      ipAddress: '127.0.0.1',
    });

    const result = await authService.refreshAuthToken(tokenValue, { ip: '127.0.0.1' });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    const old = await RefreshToken.findOne({ token: tokenValue });
    expect(old.isRevoked).toBe(true);

    await expect(authService.refreshAuthToken(tokenValue, { ip: '127.0.0.1' })).rejects.toThrow(
      /Invalid refresh token/
    );
  });

  it('logoutAll revokes all user tokens', async () => {
    const hashed = await hashPassword('Test@12345');
    const user = await User.create({
      name: 'BulkUser',
      email: 'bulk@test.com',
      mobile: '9876500102',
      password: hashed,
      role: 'B2B_CUSTOMER',
      status: 'ACTIVE',
    });

    await RefreshToken.create({
      userId: user._id,
      token: 't1',
      family: 'f1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      ipAddress: '1.1.1.1',
    });
    await RefreshToken.create({
      userId: user._id,
      token: 't2',
      family: 'f2',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      ipAddress: '2.2.2.2',
    });

    const res = await authService.logoutAll(user._id);
    expect(res.success).toBe(true);

    const tokens = await RefreshToken.find({ userId: user._id });
    expect(tokens.length).toBeGreaterThan(0);
    tokens.forEach((t) => expect(t.isRevoked).toBe(true));
  });
});
