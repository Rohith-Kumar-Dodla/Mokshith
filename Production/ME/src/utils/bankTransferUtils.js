const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export function getApiOrigin() {
  return API_BASE.replace(/\/api\/v1\/?$/, '');
}

export function resolveUploadUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const origin = getApiOrigin();
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function mapPaymentProofStatus(status) {
  const normalized = String(status || '').toUpperCase();
  const map = {
    PENDING: 'pending_verification',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  };
  return map[normalized] || normalized.toLowerCase() || 'unknown';
}

export function mapPaymentProof(proof) {
  if (!proof) return null;

  return {
    id: String(proof._id || proof.id || ''),
    orderId: proof.orderId?._id || proof.orderId,
    utrNumber: proof.utrNumber,
    screenshot: resolveUploadUrl(proof.screenshot),
    status: mapPaymentProofStatus(proof.status),
    rawStatus: proof.status,
    rejectionReason: proof.rejectionReason || null,
    amount: Number(proof.amount ?? 0),
    submittedAt: proof.createdAt,
    verifiedAt: proof.verifiedAt,
    verifiedBy: proof.verifiedBy?.name || null,
  };
}
