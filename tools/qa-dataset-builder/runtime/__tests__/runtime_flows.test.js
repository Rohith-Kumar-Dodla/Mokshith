import { runCustomerFlow } from '../customer.flow.js';
import { runCartFlow } from '../cart.flow.js';

function makeMockClient(responses = {}) {
  return {
    post: async (path, body, opts) => {
      // choose response by path key
      const key = path.split('?')[0];
      const mock = responses[key];
      if (typeof mock === 'function') return mock(path, body, opts);
      return mock || { ok: true, status: 200, data: { data: { user: { id: 'u-1' }, accessToken: 'tok' } } };
    },
    get: async (path, opts) => {
      const mock = responses[path];
      return mock || { ok: true, status: 200, data: { data: {} } };
    },
  };
}

test('customer flow dry-run', async () => {
  const client = makeMockClient();
  const res = await runCustomerFlow({ client, config: {}, logger: console, dryRun: true });
  expect(res.success).toBe(true);
});

test('customer flow live mock', async () => {
  const client = makeMockClient({
    '/api/v1/auth/register': { ok: true, status: 201, data: { data: { user: { id: 'u123' } } } },
    '/api/v1/auth/login': { ok: true, status: 200, data: { data: { accessToken: 'atoken' } } },
  });
  const res = await runCustomerFlow({ client, config: {}, logger: console, dryRun: false, fixture: { email: 'test@qa' , name:'t', mobile:'999990000' , password:'p' } });
  expect(res.success).toBe(true);
  expect(res.createdIds.userId).toBe('u123');
  expect(res.token).toBe('atoken');
});

test('cart flow dry-run', async () => {
  const client = makeMockClient();
  const res = await runCartFlow({ client, token: 'tok', productIds: ['p1','p2'], dryRun: true, logger: console });
  expect(res.success).toBe(true);
});

