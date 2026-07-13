import { createClient } from './httpClient.js';

/**
 * Runtime Runner orchestrates flows.
 * It does not perform writes unless dryRun=false and MONGO_URI is set in env for client interactions.
 */
export async function runScenario({ baseUrl, flows = [], config = {}, logger, dryRun = true } = {}) {
  const client = createClient({ baseUrl });
  const results = [];
  for (const f of flows) {
    try {
      const res = await f.fn({ client, token: f.token, fixture: f.fixture, config, logger, dryRun });
      results.push({ name: f.name, result: res });
    } catch (err) {
      results.push({ name: f.name, result: { success: false, errors: [err.message] } });
    }
  }
  return results;
}

export default { runScenario };

