export function timeNowIso() {
  return new Date().toISOString();
}

export function pathJoin(...parts) {
  return parts.join('/');
}

export function outputJson(obj) {
  return JSON.stringify(obj, null, 2);
}

