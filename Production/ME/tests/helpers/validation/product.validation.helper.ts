import fs from 'fs';
import path from 'path';
import { apiClient } from '../apiClient';
import { authHeaders, loginApi, type ApiSession } from '../auth.api.helper';
import { getVendorCredentials } from '../product.credentials';

export const API_BASE =
  process.env.TEST_API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const INVALID_OBJECT_ID = 'not-a-valid-id';
export const NONEXISTENT_OBJECT_ID = '000000000000000000000001';

export type ApiResult = {
  status: number;
  body: Record<string, unknown>;
};

export function uniqueValidationName(prefix = 'pv'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function uniqueSingleCharProductName(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const index = (Date.now() + Math.floor(Math.random() * 1000)) % alphabet.length;
  return alphabet[index]!;
}

export async function getVendorSession(): Promise<ApiSession> {
  const { mobile, password } = getVendorCredentials(1);
  return loginApi(mobile, password);
}

export async function apiJson(
  session: ApiSession | undefined,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: unknown
): Promise<ApiResult> {
  const headers = session ? authHeaders(session) : {};
  try {
    const response = await apiClient.request({
      method,
      url: endpoint,
      data,
      headers,
      validateStatus: () => true,
    });
    return {
      status: response.status,
      body: (response.data as Record<string, unknown>) ?? {},
    };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: Record<string, unknown> } };
    return {
      status: axiosErr.response?.status ?? 500,
      body: axiosErr.response?.data ?? { message: String(err) },
    };
  }
}

export async function apiMultipart(
  session: ApiSession,
  method: 'POST' | 'PUT',
  endpoint: string,
  fields: Record<string, string>,
  fileField?: string,
  file?: { path?: string; name: string; mimeType: string; buffer?: Buffer }
): Promise<ApiResult> {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));

  if (fileField && file) {
    if (file.buffer) {
      const blob = new Blob([file.buffer], { type: file.mimeType });
      form.append(fileField, blob, file.name);
    } else if (file.path) {
      const buffer = fs.readFileSync(file.path);
      const blob = new Blob([buffer], { type: file.mimeType });
      form.append(fileField, blob, file.name);
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'x-csrf-token': session.csrfToken,
      Cookie: `csrf-token=${session.csrfToken}`,
    },
    body: form,
  });

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body };
}

export function messageOf(result: ApiResult): string {
  const msg = result.body?.message;
  return typeof msg === 'string' ? msg : JSON.stringify(result.body);
}

export async function expectApiStatus(
  result: ApiResult,
  expectedStatus: number,
  label?: string
): Promise<void> {
  if (result.status !== expectedStatus) {
    throw new Error(
      `${label ?? 'API call'} expected HTTP ${expectedStatus} but got ${result.status}: ${messageOf(result)}`
    );
  }
}

export async function expectApiRejects(
  fn: () => Promise<ApiResult>,
  expectedStatus: number
): Promise<ApiResult> {
  const result = await fn();
  await expectApiStatus(result, expectedStatus);
  return result;
}

export function unwrapData<T>(body: Record<string, unknown>): T {
  return (body?.data ?? body) as T;
}
