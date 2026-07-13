/**
 * invoice.flow
 * - Trigger invoice generation and/or download via API
 */
export async function runInvoiceFlow({ client, token, orderId, config = {}, logger, dryRun = true } = {}) {
  const start = Date.now();
  const result = { success: false, executionTimeMs: 0, invoiceUrl: null, errors: [] };
  try {
    if (dryRun) {
      logger?.info('DRY RUN: would request invoice for order', orderId);
      result.success = true;
    } else {
      const res = await client.post(`/api/v1/orders/${orderId}/invoice`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { result.errors.push({ stage: 'invoice', status: res.status }); }
      else {
        result.invoiceUrl = res.data?.data?.invoiceUrl || null;
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

export default { runInvoiceFlow };

