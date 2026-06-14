import { xssSanitizeMiddleware } from '../../src/middlewares/xssSanitize.middleware.js';
import { logger } from '../../src/config/logger.js';

// Simple mock logger to avoid console noise during tests
logger.debug = () => {};

const runTests = () => {
  const results = [];

  const expect = (actual) => ({
    toBe: (expected) => {
      if (actual !== expected) throw new Error(`Expected "${expected}" but got "${actual}"`);
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

  test('should sanitize <script> tags in req.body', () => {
    req.body = { comment: '<script>alert("XSS")</script>' };
    xssSanitizeMiddleware(req, res, next);
    expect(req.body.comment).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  test('should sanitize javascript: protocols in req.query', () => {
    req.query = { redirect: 'javascript:alert("XSS")' };
    xssSanitizeMiddleware(req, res, next);
    expect(req.query.redirect).toBe('javascript:alert(&quot;XSS&quot;)');
  });

  test('should sanitize nested objects and arrays', () => {
    req.body = {
      user: { name: '<b>John</b>' },
      tags: ['<img src=x onerror=alert(1)>', 'safe']
    };
    xssSanitizeMiddleware(req, res, next);
    expect(req.body.user.name).toBe('&lt;b&gt;John&lt;&#x2F;b&gt;');
    expect(req.body.tags[0]).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(req.body.tags[1]).toBe('safe');
  });

  test('should preserve normal content', () => {
    req.body = { message: 'Hello, World! 123' };
    xssSanitizeMiddleware(req, res, next);
    expect(req.body.message).toBe('Hello, World! 123');
  });

  console.log('XSS Sanitizer Unit Tests:');
  results.forEach(r => {
    // Normalize output: replace emoji markers with PASS/FAIL
    const out = r.replace(/^✅/, 'PASS').replace(/^❌/, 'FAIL');
    console.log(out);
  });
  if (results.some(r => r.startsWith('❌'))) process.exit(1);
};

runTests();
