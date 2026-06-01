import { mongoSanitizeMiddleware } from '../../src/middlewares/mongoSanitize.middleware.js';
import { logger } from '../../src/config/logger.js';

// Simple mock logger to avoid console noise during tests
logger.warn = () => {};

const runTests = () => {
  const results = [];

  const expect = (actual) => ({
    toBe: (expected) => {
      if (actual !== expected) throw new Error(`Expected ${expected} but got ${actual}`);
    },
    toBeUndefined: () => {
      if (actual !== undefined) throw new Error(`Expected undefined but got ${actual}`);
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    }
  });

  const test = (name, fn) => {
    try {
      fn();
      results.push(`✅ ${name}`);
    } catch (e) {
      results.push(`❌ ${name}: ${e.message}`);
    }
  };

  const req = {
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
    originalUrl: '/test'
  };
  const res = {};
  const next = () => {};

  test('should remove keys starting with $ from req.body', () => {
    req.body = { username: 'test', password: { $ne: null } };
    mongoSanitizeMiddleware(req, res, next);
    expect(req.body.username).toBe('test');
    expect(req.body.password.$ne).toBeUndefined();
  });

  test('should remove keys containing . from req.query', () => {
    req.query = { 'user.email': 'test@example.com', sort: 'name' };
    mongoSanitizeMiddleware(req, res, next);
    expect(req.query.sort).toBe('name');
    expect(req.query['user.email']).toBeUndefined();
  });

  test('should handle nested objects and arrays', () => {
    req.body = {
      filters: [{ field: 'name', op: { $regex: '.*' } }],
      nested: { attack: { $where: '1 == 1' }, safe: 'data' }
    };
    mongoSanitizeMiddleware(req, res, next);
    expect(req.body.filters[0].op.$regex).toBeUndefined();
    expect(req.body.nested.attack.$where).toBeUndefined();
    expect(req.body.nested.safe).toBe('data');
  });

  console.log('Sanitizer Unit Tests:');
  results.forEach(r => console.log(r));
  if (results.some(r => r.startsWith('❌'))) process.exit(1);
};

runTests();
