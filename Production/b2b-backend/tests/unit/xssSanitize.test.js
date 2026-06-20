import { jest } from '@jest/globals';
import { xssSanitizeMiddleware } from '../../src/middlewares/xssSanitize.middleware.js';

describe('xssSanitizeMiddleware', () => {
  let req;
  const res = {};
  const next = jest.fn();

  beforeEach(() => {
    next.mockClear();
    req = { body: {}, query: {}, params: {}, ip: '127.0.0.1', originalUrl: '/test' };
  });

  it('sanitizes <script> tags in req.body', () => {
    req.body = { comment: '<script>alert("XSS")</script>' };
    xssSanitizeMiddleware(req, res, next);
    expect(req.body.comment).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    expect(next).toHaveBeenCalled();
  });

  it('sanitizes javascript: protocols in req.query', () => {
    req.query = { redirect: 'javascript:alert("XSS")' };
    xssSanitizeMiddleware(req, res, next);
    expect(req.query.redirect).toBe('javascript:alert(&quot;XSS&quot;)');
    expect(next).toHaveBeenCalled();
  });

  it('sanitizes nested objects and arrays', () => {
    req.body = {
      user: { name: '<b>John</b>' },
      tags: ['<img src=x onerror=alert(1)>', 'safe']
    };
    xssSanitizeMiddleware(req, res, next);
    expect(req.body.user.name).toBe('&lt;b&gt;John&lt;&#x2F;b&gt;');
    expect(req.body.tags[0]).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(req.body.tags[1]).toBe('safe');
    expect(next).toHaveBeenCalled();
  });
});

