import fs from 'fs';
import path from 'path';
import { apiClient } from './apiClient';
import { authHeaders, loginApi, type ApiSession } from './auth.api.helper';
import { getAdminCredentials } from './product.credentials';

const API_BASE =
  process.env.TEST_API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

async function postMultipart(
  session: ApiSession,
  endpoint: string,
  fields: Record<string, string>,
  fileField: string,
  filePath: string,
  method: 'POST' | 'PUT' = 'POST'
) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: 'image/png' });
  form.append(fileField, blob, path.basename(filePath));

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-csrf-token': session.csrfToken,
      Cookie: `csrf-token=${session.csrfToken}`,
    },
    body: form,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.message || `Multipart ${method} ${endpoint} failed: ${response.status}`);
    (error as Error & { response?: { status: number; data: unknown } }).response = {
      status: response.status,
      data: body,
    };
    throw error;
  }
  return body?.data ?? body;
}

export type ProductPayload = {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  categoryId: string;
  moq?: number;
  minOrderQty?: number;
  isActive?: boolean;
  vendorId?: string;
  bulkPricing?: Array<{ minQuantity: number; price: number }>;
};

function unwrapData<T>(response: { data?: { data?: T; success?: boolean } & T }): T {
  const body = response.data as { data?: T } & T;
  return (body?.data ?? body) as T;
}

export function resolveRefId(
  ref?: string | { _id?: string; id?: string } | null
): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === 'object') {
    const id = ref._id || ref.id;
    return id ? String(id) : undefined;
  }
  return String(ref);
}

export async function getAdminSession(): Promise<ApiSession> {
  const { mobile, password } = getAdminCredentials();
  return loginApi(mobile, password);
}

export async function listCategories(session?: ApiSession) {
  const headers = session ? authHeaders(session) : {};
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await apiClient.get('/categories', { headers });
      const data = unwrapData<{ categories?: unknown[] } | unknown[]>(response);
      if (Array.isArray(data)) return data;
      return data?.categories ?? [];
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 250 * attempt));
    }
  }

  throw lastErr;
}

export async function getFirstCategoryId(session?: ApiSession): Promise<string> {
  const categories = await listCategories(session);
  const first = categories[0] as { _id?: string; id?: string };
  const id = first?._id || first?.id;
  if (!id) throw new Error('No categories available for functional tests');
  return String(id);
}

export async function createProductApi(
  session: ApiSession,
  payload: ProductPayload,
  imagePath?: string
) {
  const headers = authHeaders(session);

  if (imagePath) {
    const fields: Record<string, string> = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      fields[key] = key === 'bulkPricing' ? JSON.stringify(value) : String(value);
    });
    return postMultipart(session, '/products', fields, 'image', imagePath, 'POST');
  }

  const response = await apiClient.post('/products', payload, { headers });
  return unwrapData(response);
}

export async function updateProductApi(
  session: ApiSession,
  productId: string,
  payload: Partial<ProductPayload>,
  imagePath?: string
) {
  const headers = authHeaders(session);

  if (imagePath) {
    const fields: Record<string, string> = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      fields[key] = String(value);
    });
    return postMultipart(session, `/products/${productId}`, fields, 'image', imagePath, 'PUT');
  }

  const response = await apiClient.put(`/products/${productId}`, payload, { headers });
  return unwrapData(response);
}

export async function deleteProductApi(session: ApiSession, productId: string) {
  const response = await apiClient.delete(`/products/${productId}`, {
    headers: authHeaders(session),
  });
  return unwrapData(response);
}

export async function getProductApi(productId: string, session?: ApiSession) {
  const headers = session ? authHeaders(session) : {};
  const response = await apiClient.get(`/products/${productId}`, { headers });
  return unwrapData(response);
}

export async function listProductsApi(params: Record<string, unknown> = {}, session?: ApiSession) {
  const headers = session ? authHeaders(session) : {};
  const response = await apiClient.get('/products', { params, headers });
  return unwrapData<{ products?: unknown[]; pagination?: Record<string, unknown> }>(response);
}

export async function patchProductStockApi(session: ApiSession, productId: string, stock: number) {
  const response = await apiClient.patch(
    `/products/${productId}/stock`,
    { stock },
    { headers: authHeaders(session) }
  );
  return unwrapData(response);
}

export async function patchProductStatusApi(session: ApiSession, productId: string, isActive: boolean) {
  const response = await apiClient.patch(
    `/products/${productId}/status`,
    { isActive },
    { headers: authHeaders(session) }
  );
  return unwrapData(response);
}

export async function searchProductsApi(query: string) {
  const response = await apiClient.get('/search', { params: { q: query } });
  return unwrapData<unknown[]>(response);
}

export async function calculatePricingApi(price: number, quantity: number) {
  const response = await apiClient.post('/pricing', { price, quantity });
  return unwrapData(response);
}

export async function updateInventoryStockApi(
  session: ApiSession,
  payload: { productId: string; warehouseId: string; stock: number; type?: string }
) {
  const response = await apiClient.patch(
    '/inventory/update',
    { type: 'SET', ...payload },
    { headers: authHeaders(session) }
  );
  return unwrapData(response);
}

export async function listInventoryApi(session: ApiSession) {
  const response = await apiClient.get('/inventory', { headers: authHeaders(session) });
  return unwrapData<unknown[]>(response);
}

export async function addToCartApi(session: ApiSession, productId: string, quantity: number) {
  const response = await apiClient.post(
    '/cart',
    { productId, quantity },
    { headers: authHeaders(session) }
  );
  return unwrapData(response);
}

export async function createCategoryApi(
  session: ApiSession,
  payload: { name: string; description?: string; isActive?: boolean }
) {
  const response = await apiClient.post('/categories', payload, { headers: authHeaders(session) });
  return unwrapData(response);
}

export async function deleteCategoryApi(session: ApiSession, categoryId: string) {
  const response = await apiClient.delete(`/categories/${categoryId}`, {
    headers: authHeaders(session),
  });
  return unwrapData(response);
}
