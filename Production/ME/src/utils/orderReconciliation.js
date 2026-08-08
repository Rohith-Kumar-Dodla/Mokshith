/**
 * Helpers for safely reconciling uncertain checkout outcomes without creating new orders.
 */

export function isUncertainOrderError(error) {
  const status = error?.response?.status;
  const code = error?.code;
  const message = String(error?.response?.data?.message || error?.message || '').toLowerCase();

  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || code === 'ERR_NETWORK') {
    return true;
  }
  if (message.includes('timeout') || message.includes('network error')) {
    return true;
  }
  if (status === 409 && message.includes('duplicate operation')) {
    return true;
  }
  // No response often means the request left the browser but the reply never arrived
  if (!error?.response && (error?.request || message.includes('timeout'))) {
    return true;
  }
  return false;
}

export function isDefiniteOrderFailure(error) {
  const status = error?.response?.status;
  if (!status) return false;
  // Auth/validation/business failures are definitive — do not reconcile as success
  return [400, 401, 403, 404, 422].includes(status);
}

export function findOrderByIdempotencyKey(orders, idempotencyKey) {
  if (!idempotencyKey || !Array.isArray(orders)) return null;
  return (
    orders.find((order) => {
      const key =
        order?.idempotencyKey ||
        order?.raw?.idempotencyKey ||
        order?.raw?.raw?.idempotencyKey;
      return key && String(key) === String(idempotencyKey);
    }) || null
  );
}
