import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  getProductApi,
  listInventoryApi,
  patchProductStockApi,
  resolveRefId,
  updateInventoryStockApi,
} from './product.api.helper';
import { uniqueProductName } from './product.credentials';
import {
  findInventoryRowForProduct,
  getInventoryRaw,
  getInventoryStatsRaw,
  getInventoryStockForProduct,
  patchInventoryUpdateRaw,
  setInventoryStockApi,
  type InventorySmokeProduct,
} from './inventory.smoke.helper';

export type InventoryFunctionalSeed = {
  categoryId: string;
  healthy: InventorySmokeProduct;
  low: InventorySmokeProduct;
  oos: InventorySmokeProduct;
  mutate: InventorySmokeProduct;
  orderCod: InventorySmokeProduct;
  orderOnline: InventorySmokeProduct;
  syncProbe: InventorySmokeProduct;
};

export {
  findInventoryRowForProduct,
  getInventoryRaw,
  getInventoryStatsRaw,
  getInventoryStockForProduct,
  patchInventoryUpdateRaw,
  setInventoryStockApi,
  authHeaders,
  resolveRefId,
};

async function seedProduct(
  adminSession: ApiSession,
  categoryId: string,
  prefix: string,
  stock: number
): Promise<InventorySmokeProduct> {
  const created = await createProductApi(adminSession, {
    name: uniqueProductName(prefix),
    price: 120,
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
    throw new Error(`Inventory row not provisioned for product ${name}`);
  }

  return { id, name, stock: row.stock, warehouseId: row.warehouseId };
}

export async function seedInventoryFunctionalData(): Promise<{
  adminSession: ApiSession;
  seed: InventoryFunctionalSeed;
}> {
  const adminSession = await getAdminSession();
  const categoryId = await getFirstCategoryId(adminSession);

  const healthy = await seedProduct(adminSession, categoryId, 'if-inv-h', 50);
  const low = await seedProduct(adminSession, categoryId, 'if-inv-l', 8);
  const oos = await seedProduct(adminSession, categoryId, 'if-inv-o', 0);
  const mutate = await seedProduct(adminSession, categoryId, 'if-inv-m', 20);
  const orderCod = await seedProduct(adminSession, categoryId, 'if-inv-cod', 30);
  const orderOnline = await seedProduct(adminSession, categoryId, 'if-inv-on', 30);
  const syncProbe = await seedProduct(adminSession, categoryId, 'if-inv-sync', 40);

  return {
    adminSession,
    seed: { categoryId, healthy, low, oos, mutate, orderCod, orderOnline, syncProbe },
  };
}

export async function updateInventoryTypedApi(
  session: ApiSession,
  product: Pick<InventorySmokeProduct, 'id' | 'warehouseId'>,
  stock: number,
  type: 'SET' | 'ADD' | 'SUBTRACT'
) {
  return updateInventoryStockApi(session, {
    productId: product.id,
    warehouseId: product.warehouseId,
    stock,
    type,
  });
}

export async function postInventoryAddApi(
  session: ApiSession,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {}
) {
  return apiClient.post('/inventory', body, {
    headers: { ...authHeaders(session), ...extraHeaders },
    validateStatus: () => true,
  });
}

export async function getLowStockRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/inventory/low-stock', { headers, validateStatus: () => true });
}

export async function getProductStockApi(productId: string, session?: ApiSession): Promise<number> {
  const product = (await getProductApi(productId, session)) as { stock?: number };
  return Number(product?.stock ?? 0);
}

export async function syncProductStockApi(session: ApiSession, productId: string, stock: number) {
  return patchProductStockApi(session, productId, stock);
}

export function unwrapInventoryList(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;
  if (payload && typeof payload === 'object') {
    const data = (payload as { data?: unknown }).data ?? payload;
    if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  }
  return [];
}

export async function listInventoryRows(session: ApiSession) {
  return unwrapInventoryList(await listInventoryApi(session));
}

export { listInventoryApi, getProductApi };
