/**
 * Simple HTTP client wrapper for runtime flows.
 * Uses global fetch. Designed to be mocked in unit tests.
 */
export function createClient({ baseUrl, headers = {} } = {}) {
  if (!baseUrl) {
    throw new Error('baseUrl is required for HTTP client');
  }

  async function request(method, path, body = null, opts = {}) {
    const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    const init = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers, ...(opts.headers || {}) },
    };
    if (body != null) init.body = JSON.stringify(body);
    const res = await fetch(url, init);
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, ok: res.ok, data, raw: text };
  }

  return {
    get: (p, o) => request('GET', p, null, o),
    post: (p, b, o) => request('POST', p, b, o),
    put: (p, b, o) => request('PUT', p, b, o),
    delete: (p, b, o) => request('DELETE', p, b, o),
  };
}

export default { createClient };

