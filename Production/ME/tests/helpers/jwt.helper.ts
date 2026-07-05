// Minimal JWT decoding helper (no signature verification) to inspect claims
export function decodeJwt(token: string | null) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default decodeJwt;

