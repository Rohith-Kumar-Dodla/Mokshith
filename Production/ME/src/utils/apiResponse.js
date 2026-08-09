export function unwrapApiList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  return [];
}

export function unwrapApiData(payload) {
  if (payload?.data !== undefined && payload?.success !== undefined) {
    return payload.data;
  }

  return payload;
}

const INTERNAL_MESSAGE_PATTERNS = [
  /mongo/i,
  /mongoose/i,
  /casterror/i,
  /validationerror/i,
  /econnrefused/i,
  /econnreset/i,
  /etimedout/i,
  /econnaborted/i,
  /socket hang up/i,
  /redis/i,
  /bullmq/i,
  /axioserror/i,
  /jsonwebtoken/i,
  /jwt/i,
  /sequelize/i,
  /prisma/i,
  /stack trace/i,
  /at\s+\S+\s+\(/i,
  /node_modules/i,
  /\\|\/[a-z]:\\/i,
  /internal server/i,
  /csrf token/i,
  /x-csrf/i,
];

const SAFE_BACKEND_CODES = new Set([
  'ACCOUNT_NOT_FOUND',
  'VALIDATION_ERROR',
  'DUPLICATE_ENTRY',
  'SESSION_REPLACED',
  'AUTH_ERROR',
  'FILE_UPLOAD_ERROR',
  'DATABASE_UNAVAILABLE',
  'INVALID_ID',
  'PERMISSION_DENIED',
  'RATE_LIMITED',
]);

/** Messages that look like intentional product copy (short, no stack/infra). */
function isSafeBackendMessage(message) {
  if (!message || typeof message !== 'string') return false;
  const trimmed = message.trim();
  if (trimmed.length < 3 || trimmed.length > 180) return false;
  if (/^(forbidden|unauthorized|error|failed|bad request|internal server error)$/i.test(trimmed)) {
    return false;
  }
  if (INTERNAL_MESSAGE_PATTERNS.some((re) => re.test(trimmed))) return false;
  if (/^Error:/i.test(trimmed)) return false;
  return true;
}

function mapStatusToMessage(status, fallback) {
  switch (status) {
    case 400:
    case 422:
      return 'Please check the highlighted fields and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "We couldn't find the requested information.";
    case 408:
      return 'The request took too long. Please try again.';
    case 409:
      return 'This action could not be completed because of a conflict. Please refresh and try again.';
    case 413:
      return 'The file is too large. Please choose a smaller file and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 502:
    case 503:
    case 504:
      return "We're having trouble processing your request right now. Please try again shortly.";
    case 500:
      return "Something went wrong on our side. Please try again.";
    default:
      return fallback || "We couldn't complete your request. Please try again.";
  }
}

/**
 * Map API/network failures to safe user-facing copy.
 * Never fall back to Axios/Node `error.message` (leaks internals).
 *
 * @param {unknown} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function getUserFacingErrorMessage(error, fallback = "We couldn't complete your request. Please try again.") {
  if (!error) return fallback;

  // Already sanitized Error thrown by AuthContext / mappers
  if (error instanceof Error && !error.response && error.message && !INTERNAL_MESSAGE_PATTERNS.some((re) => re.test(error.message))) {
    // Prefer domain mappers that already produced safe strings
  if (error.message === 'Invalid credentials' || error.message === 'No account found' || error.message.startsWith('Unable to sign in')) {
      return error.message;
    }
  }

  const status = error?.response?.status;
  const data = error?.response?.data;
  const code = data?.error?.code || data?.code;
  const backendMessage = typeof data?.message === 'string' ? data.message : null;
  const correlationId =
    error?.response?.headers?.['x-correlation-id'] ||
    error?.response?.headers?.['X-Correlation-ID'];

  if (code === 'ACCOUNT_NOT_FOUND') {
    return 'No account found';
  }
  if (code === 'SESSION_REPLACED') {
    return 'Your account was signed in from another device. Please sign in again.';
  }
  if (code === 'DATABASE_UNAVAILABLE') {
    return "We're having trouble processing your request right now. Please try again shortly.";
  }
  if (code === 'VALIDATION_ERROR' || code === 'INVALID_ID') {
    return isSafeBackendMessage(backendMessage)
      ? backendMessage
      : 'Please check the highlighted fields and try again.';
  }
  if (code === 'DUPLICATE_ENTRY' && isSafeBackendMessage(backendMessage)) {
    return backendMessage;
  }
  if (code === 'FILE_UPLOAD_ERROR') {
    return "We couldn't upload the file. Please check the file and try again.";
  }
  if (code === 'AUTH_ERROR') {
    return 'Your session has expired. Please sign in again.';
  }

  // CSRF: never show raw token mechanics
  if (status === 403 && /csrf/i.test(String(backendMessage || ''))) {
    return 'Your security session needs to be refreshed. Please try again.';
  }

  // Network / timeout (Axios): never surface error.message
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED' || /timeout/i.test(String(error?.message || ''))) {
      return 'The request took too long. Please try again.';
    }
    return "We couldn't reach the server. Please check your connection and try again.";
  }

  if (SAFE_BACKEND_CODES.has(code) && isSafeBackendMessage(backendMessage)) {
    return backendMessage;
  }

  // Allow known-safe product messages for 4xx only
  if (status >= 400 && status < 500 && isSafeBackendMessage(backendMessage)) {
    return backendMessage;
  }

  let message = mapStatusToMessage(status, fallback);

  // Optional support reference when header present (does not expose internals)
  if (correlationId && status >= 500) {
    message = `${message} Reference ID: ${correlationId}`;
  }

  return message;
}

/** @deprecated Prefer getUserFacingErrorMessage — kept as alias for gradual migration */
export function getErrorMessage(error, fallback) {
  return getUserFacingErrorMessage(error, fallback);
}
