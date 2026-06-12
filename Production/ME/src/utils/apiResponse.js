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
