/**
 * cart.flow
 * - Add product(s) to cart via API
 */
export async function runCartFlow({ client, token, productIds = [], config = {}, logger, dryRun = true } = {}) {
  const start = Date.now();
  const result = { success: false, executionTimeMs: 0, warnings: [], errors: [], createdIds: {} };
  try {
    if (!productIds.length) {
      result.warnings.push('No productIds provided');
      result.success = true;
      return result;
    }
    for (const pid of productIds) {
      if (dryRun) {
        logger?.info('DRY RUN: would POST /api/v1/cart/add', { productId: pid });
      } else {
        const res = await client.post('/api/v1/cart/add', { productId: pid, quantity: 1 }, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          result.errors.push({ productId: pid, status: res.status, data: res.data });
        }
      }
    }
    result.success = result.errors.length === 0;
  } catch (err) {
    result.errors.push(err.message);
  } finally {
    result.executionTimeMs = Date.now() - start;
  }
  return result;
}

export default { runCartFlow };

