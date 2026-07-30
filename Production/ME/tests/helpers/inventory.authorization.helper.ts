import fs from 'fs';
import path from 'path';
import { apiClient } from './apiClient';
import { authHeaders, loginApiFresh, type ApiSession } from './auth.api.helper';
import {
  getAdminCredentials,
  getVendorCredentials,
  uniqueProductName,
} from './product.credentials';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from './product.api.helper';
import { clearValidationRateLimits } from './cart.validation.helper';
import {
  findInventoryRowForProduct,
  getInventoryRaw,
  getInventoryStatsRaw,
  patchInventoryUpdateRaw,
  type InventorySmokeProduct,
} from './inventory.smoke.helper';
import { getLowStockRaw } from './inventory.functional.helper';

export type InventoryAuthorizationSeed = {
  product: InventorySmokeProduct;
};

export async function seedInventoryAuthorizationData(): Promise<{
  adminSession: ApiSession;
  seed: InventoryAuthorizationSeed;
}> {
  clearValidationRateLimits();
  const adminSession = await getAdminSession();
  const categoryId = await getFirstCategoryId(adminSession);
  const created = await createProductApi(adminSession, {
    name: uniqueProductName('ia-inv'),
    price: 110,
    categoryId,
    stock: 40,
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
    throw new Error(`Inventory row not provisioned for authorization seed ${name}`);
  }

  return {
    adminSession,
    seed: {
      product: { id, name, stock: row.stock, warehouseId: row.warehouseId },
    },
  };
}

export async function postInventoryRaw(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return apiClient.post('/inventory', body, { headers, validateStatus: () => true });
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

export function readBackendFile(relativePath: string): string {
  const filePath = path.resolve(process.cwd(), '..', 'b2b-backend', relativePath);
  return fs.readFileSync(filePath, 'utf8');
}

export function bearerOnly(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export function authBearerOnly(session: ApiSession) {
  return { Authorization: `Bearer ${session.accessToken}` };
}

export async function refreshVendorApiSession(): Promise<ApiSession> {
  const creds = getVendorCredentials(1);
  return loginApiFresh(creds.mobile, creds.password);
}

export async function refreshAdminApiSession(): Promise<ApiSession> {
  const creds = getAdminCredentials();
  return loginApiFresh(creds.mobile, creds.password);
}

export {
  authHeaders,
  clearValidationRateLimits,
  getInventoryRaw,
  getInventoryStatsRaw,
  getLowStockRaw,
  patchInventoryUpdateRaw,
};
