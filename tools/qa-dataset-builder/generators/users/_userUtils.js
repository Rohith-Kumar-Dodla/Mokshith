import path from 'path';

export async function loadFixture(manifestPath, type) {
  const fp = path.join(manifestPath, 'fixtures', 'users', `${type}.json`);
  try {
    const fs = await import('fs');
    if (fs.existsSync(fp)) {
      return JSON.parse(fs.readFileSync(fp, 'utf8'));
    }
  } catch {
    // ignore
  }
  return null;
}

export async function hashPassword(password) {
  // Try to reuse backend hashPassword utility if available
  try {
    const mod = await import('../../../../Production/b2b-backend/src/utils/hashPassword.js');
    if (mod && typeof mod.hashPassword === 'function') {
      return await mod.hashPassword(password);
    }
  } catch {
    // fallback to bcryptjs
    /* eslint-disable global-require */
    const bcrypt = await import('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }
}

export function nowIso() {
  return new Date().toISOString();
}

