export function getImageVersion(record) {
  if (!record) {
    return null;
  }

  return record.imagePublicId || record.updatedAt || null;
}

export function withImageCacheBust(url, version) {
  if (!url) {
    return '';
  }

  if (!version) {
    return url;
  }

  if (typeof version === 'string' && !/^\d{4}-\d{2}-\d{2}/.test(version)) {
    const token = encodeURIComponent(version);
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${token}`;
  }

  const stamp = new Date(version).getTime();
  if (!stamp || Number.isNaN(stamp)) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${stamp}`;
}
