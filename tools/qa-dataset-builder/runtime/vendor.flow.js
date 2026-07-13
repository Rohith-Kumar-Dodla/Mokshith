/**
 * vendor.flow
 * - Vendor accepts order and updates status via API
 */
export async function runVendorAcceptFlow({ client, token, orderId, vendorId, config = {}, logger, dryRun = true } = {}) {
  const start = Date.now();
  const result = { success: false, executionTimeMs: 0, warnings: [], errors: [] };
  try {
    if (dryRun) {
      logger?.info('DRY RUN: would POST /api/v1/vendor/orders/accept', { orderId, vendorId });
      result.success = true;
    } else {
      const res = await client.post(`/api/v1/vendor/orders/${orderId}/accept`, { vendorId }, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        result.errors.push({ stage: 'vendor.accept', status: res.status, data: res.data });
      } else result.success = true;
    }
  } catch (err) {
    result.errors.push(err.message);
  } finally {
    result.executionTimeMs = Date.now() - start;
  }
  return result;
}

export default { runVendorAcceptFlow };

