import { execSync } from 'child_process';
import path from 'path';
import { authHeaders, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from './product.api.helper';
import { uniqueProductName } from './product.credentials';
import {
  findInventoryRowForProduct,
  type InventorySmokeProduct,
} from './inventory.smoke.helper';
import {
  API_BASE,
  apiJson,
  messageOf,
  type ApiResult,
} from './validation/product.validation.helper';

export { messageOf };
export { INVALID_OBJECT_ID, NONEXISTENT_OBJECT_ID } from './validation/product.validation.helper';

export type InventoryValidationSeed = {
  categoryId: string;
  standard: InventorySmokeProduct;
  mutate: InventorySmokeProduct;
};

export function clearInventoryValidationRateLimits(): void {
  try {
    const script = path.resolve(process.cwd(), '..', 'b2b-backend', 'scripts', 'clearAuthRateLimits.js');
    execSync(`node "${script}"`, { stdio: 'ignore' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Warning: failed to clear inventory validation rate limits:', message);
  }
}

async function seedProduct(
  adminSession: ApiSession,
  categoryId: string,
  prefix: string,
  stock: number
): Promise<InventorySmokeProduct> {
  const created = await createProductApi(adminSession, {
    name: uniqueProductName(prefix),
    price: 95,
    categoryId,
    stock,
    moq: 1,
  });
  const id = String(created._id || created.id);
  const name = String(created.name);

  let row: { warehouseId: string; stock: number } | null = null;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    row = await findInventoryRowForProduct(adminSession, id);
    if (row) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!row) {
    throw new Error(`Inventory row not provisioned for validation seed ${name}`);
  }

  return { id, name, stock: row.stock, warehouseId: row.warehouseId };
}

export async function seedInventoryValidationData(): Promise<{
  adminSession: ApiSession;
  seed: InventoryValidationSeed;
}> {
  clearInventoryValidationRateLimits();
  const adminSession = await getAdminSession();
  const categoryId = await getFirstCategoryId(adminSession);
  const standard = await seedProduct(adminSession, categoryId, 'iv-inv-std', 50);
  const mutate = await seedProduct(adminSession, categoryId, 'iv-inv-mut', 20);

  return {
    adminSession,
    seed: { categoryId, standard, mutate },
  };
}

export async function postInventoryValidationApi(
  session: ApiSession | undefined,
  body: Record<string, unknown> | unknown
): Promise<ApiResult> {
  return apiJson(session, 'POST', '/inventory', body);
}

export async function patchInventoryValidationApi(
  session: ApiSession | undefined,
  body: Record<string, unknown> | unknown
): Promise<ApiResult> {
  return apiJson(session, 'PATCH', '/inventory/update', body);
}

export async function getInventoryValidationApi(session: ApiSession): Promise<ApiResult> {
  return apiJson(session, 'GET', '/inventory');
}

export async function getInventoryStatsValidationApi(session: ApiSession): Promise<ApiResult> {
  return apiJson(session, 'GET', '/inventory/stats');
}

export function addBody(
  product: Pick<InventorySmokeProduct, 'id' | 'warehouseId'>,
  stock: number
) {
  return {
    productId: product.id,
    warehouseId: product.warehouseId,
    stock,
  };
}

export function updateBody(
  product: Pick<InventorySmokeProduct, 'id' | 'warehouseId'>,
  stock: number,
  type: 'SET' | 'ADD' | 'SUBTRACT' = 'SET'
) {
  return {
    productId: product.id,
    warehouseId: product.warehouseId,
    stock,
    type,
  };
}

export async function postInventoryRawFetch(
  session: ApiSession,
  options: { body: string; contentType?: string }
): Promise<ApiResult> {
  const response = await fetch(`${API_BASE}/inventory`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      ...(options.contentType ? { 'Content-Type': options.contentType } : {}),
    },
    body: options.body,
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body };
}

export async function patchInventoryRawFetch(
  session: ApiSession,
  options: { body: string; contentType?: string }
): Promise<ApiResult> {
  const response = await fetch(`${API_BASE}/inventory/update`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      ...(options.contentType ? { 'Content-Type': options.contentType } : {}),
    },
    body: options.body,
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body };
}

export function assertErrorEnvelope(result: ApiResult) {
  if (typeof result.body.success === 'boolean' && result.body.success !== false) {
    throw new Error(`Expected success=false: ${messageOf(result)}`);
  }
  if (result.body.message != null && typeof result.body.message !== 'string') {
    throw new Error(`Expected string message: ${messageOf(result)}`);
  }
}

export function assertSuccessEnvelope(result: ApiResult) {
  if (typeof result.body.success === 'boolean' && result.body.success !== true) {
    throw new Error(`Expected success=true: ${messageOf(result)}`);
  }
}

export { authHeaders, apiJson };
