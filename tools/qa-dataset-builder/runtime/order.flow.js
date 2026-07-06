/**
 * order.flow
 * - Fetch order details and validate
 */
export async function runOrderValidationFlow({ client, token, orderId, config = {}, logger, dryRun = true } = {}) {
  const start = Date.now();
  const result = { success: false, executionTimeMs: 0, data: null, errors: [] };
  try {
    if (dryRun) {
      logger?.info('DRY RUN: would GET /api/v1/orders/{orderId}', orderId);
      result.success = true;
    } else {
      const res = await client.get(`/api/v1/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        result.errors.push({ stage: 'order.get', status: res.status, data: res.data });
      } else {
        result.data = res.data?.data || null;
        result.success = true;
      }
    }
  } catch (err) {
    result.errors.push(err.message);
  } finally {
    result.executionTimeMs = Date.now() - start;
  }
  return result;
}

export default { runOrderValidationFlow };

