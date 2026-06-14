/**
 * Normalize login identifiers (email or 10-digit Indian mobile).
 */
export function normalizeLoginIdentifier(identifier) {
  if (identifier === null || identifier === undefined) {
    return { email: null, mobile: null, raw: '' };
  }

  const raw = String(identifier).trim();
  if (!raw) {
    return { email: null, mobile: null, raw: '' };
  }

  if (raw.includes('@')) {
    return { email: raw.toLowerCase(), mobile: null, raw };
  }

  let digits = raw.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (/^[0-9]{10}$/.test(digits)) {
    return { email: null, mobile: digits, raw };
  }

  return { email: null, mobile: null, raw };
}

export function isEmailIdentifier(identifier) {
  return normalizeLoginIdentifier(identifier).email !== null;
}

export default normalizeLoginIdentifier;
