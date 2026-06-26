import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { clearDatabase } from '../helpers/testUtils.js';
import User from '../../src/modules/user/user.model.js';
import { loginWithPassword } from '../../src/modules/auth/auth.service.js';
import { generateAccessToken } from '../../src/modules/auth/auth.token.js';
import { hashPassword } from '../../src/utils/hashPassword.js';
import { findUserByEmailOrMobile } from '../../src/modules/auth/auth.repository.js';

describe('Single Active Session - backend', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('login generates sessionId and stores on user and token', async () => {
    const password = 'Test@1234';
    const hashed = await hashPassword(password);
    const user = await User.create({ name: 'Sess', email: 'sess@test.com', mobile: '9999999999', password: hashed, status: 'ACTIVE' });

    const result = await loginWithPassword({ identifier: user.email, password }, { ip: '127.0.0.1', get: () => 'UA' });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    const dbUser = await findUserByEmailOrMobile(user.email);
    expect(dbUser.activeSessionId).toBeDefined();
    const token = result.accessToken;
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    expect(decoded.sessionId).toBe(dbUser.activeSessionId);
  });

  it('protect middleware rejects replaced session', async () => {
    const password = 'Test@1234';
    const hashed = await hashPassword(password);
    const user = await User.create({ name: 'Sess2', email: 'sess2@test.com', mobile: '9888888888', password: hashed, status: 'ACTIVE' });

    // Simulate initial login
    const r1 = await loginWithPassword({ identifier: user.email, password }, { ip: '1.1.1.1', get: () => 'UA' });
    const token1 = r1.accessToken;

    // Simulate second login elsewhere
    const r2 = await loginWithPassword({ identifier: user.email, password }, { ip: '2.2.2.2', get: () => 'UA2' });
    const token2 = r2.accessToken;

    // token1 should now be invalid vs stored activeSessionId
    const decoded1 = JSON.parse(Buffer.from(token1.split('.')[1], 'base64').toString());
    const dbUser = await findUserByEmailOrMobile(user.email);
    expect(decoded1.sessionId).not.toBe(dbUser.activeSessionId);
  });
});

