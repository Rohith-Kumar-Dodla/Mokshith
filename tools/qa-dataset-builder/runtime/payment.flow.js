/**
 * payment.flow
 * - Simulate payment submission (online) via API and verify provider response (sandbox)
 */
export async function runPaymentFlow({ client, token, orderId, provider = 'razorpay', config = {}, logger, dryRun = true } = {}) {
  const start = Date.now();
  const result = { success: false, executionTimeMs: 0, createdIds: {}, warnings: [], errors: [] };
  try {
    if (dryRun) {
      logger?.info('DRY RUN: would POST /api/v1/payments/create', { orderId, provider });
      result.success = true;
    } else {
      const res = await client.post('/api/v1/payments/create', { orderId, provider }, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        result.errors.push({ stage: 'payment.create', status: res.status, data: res.data });
      } else {
        result.createdIds.paymentId = res.data?.data?.payment?._id || null;
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

export default { runPaymentFlow };

