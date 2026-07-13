/**
 * delivery.flow
 * - Assign delivery, mark out-for-delivery, delivered
 */
export async function runDeliveryFlow({ client, token, shipmentId, deliveryPartnerId, config = {}, logger, dryRun = true } = {}) {
  const start = Date.now();
  const result = { success: false, executionTimeMs: 0, errors: [] };
  try {
    if (dryRun) {
      logger?.info('DRY RUN: delivery assignment and status updates', { shipmentId, deliveryPartnerId });
      result.success = true;
    } else {
      const assign = await client.post(`/api/v1/shipments/${shipmentId}/assign`, { deliveryPartnerId }, { headers: { Authorization: `Bearer ${token}` } });
      if (!assign.ok) { result.errors.push({ stage: 'assign', status: assign.status }); return result; }
      const ofd = await client.post(`/api/v1/shipments/${shipmentId}/status`, { status: 'OUT_FOR_DELIVERY' }, { headers: { Authorization: `Bearer ${token}` } });
      if (!ofd.ok) { result.errors.push({ stage: 'ofd', status: ofd.status }); return result; }
      const delivered = await client.post(`/api/v1/shipments/${shipmentId}/status`, { status: 'DELIVERED' }, { headers: { Authorization: `Bearer ${token}` } });
      if (!delivered.ok) { result.errors.push({ stage: 'delivered', status: delivered.status }); return result; }
      result.success = true;
    }
  } catch (err) {
    result.errors.push(err.message);
  } finally {
    result.executionTimeMs = Date.now() - start;
  }
  return result;
}

export default { runDeliveryFlow };

