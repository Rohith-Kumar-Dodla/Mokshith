/**
 * checkout.flow
 * - Performs checkout (creates order) using cart & payment method
 */
export async function runCheckoutFlow({ client, token, paymentMethod = 'COD', addressId = null, config = {}, logger, dryRun = true } = {}) {
  const start = Date.now();
  const result = { success: false, executionTimeMs: 0, createdIds: {}, warnings: [], errors: [] };
  try {
    const payload = { paymentMethod, addressId };
    if (dryRun) {
      logger?.info('DRY RUN: would POST /api/v1/checkout', payload);
    } else {
      const res = await client.post('/api/v1/checkout', payload, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        result.errors.push({ stage: 'checkout', status: res.status, data: res.data });
      } else {
        result.createdIds.orderId = res.data?.data?.order?._id || null;
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

export default { runCheckoutFlow };

