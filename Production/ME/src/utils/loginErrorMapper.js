// Map backend/network errors to two user-facing messages:
// - "No account found" (ACCOUNT_NOT_FOUND / 404)
// - "Invalid credentials" (everything else)
export function mapLoginError(error) {
  // Prefer explicit backend error code when available
  const code = error?.response?.data?.error?.code || error?.response?.data?.code;
  const status = error?.response?.status;

  if (code === 'ACCOUNT_NOT_FOUND' || status === 404) {
    return 'No account found';
  }

  // For any other error (network, timeout, 5xx, unknown), show generic invalid credentials
  return 'Invalid credentials';
}

