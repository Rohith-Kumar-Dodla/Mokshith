import { apiClient } from './apiClient';
import { authHeaders, type ApiSession } from './auth.api.helper';
import {
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
  listInventoryApi,
  resolveRefId,
  updateInventoryStockApi,
} from './product.api.helper';
import { uniqueProductName } from './product.credentials';

export type InventorySmokeProduct = {
  id: string;
  name: string;
  stock: number;
  warehouseId: string;
};

export type InventorySmokeSeed = {
  categoryId: string;
  standard: InventorySmokeProduct;
  statusProbe: InventorySmokeProduct;
  orderProbe: InventorySmokeProduct;
};

function unwrapInventoryList(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;
  if (payload && typeof payload === 'object') {
    const data = (payload as { data?: unknown }).data ?? payload;
    if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  }
  return [];
}

export async function findInventoryRowForProduct(
  session: ApiSession,
  productId: string
): Promise<{ warehouseId: string; stock: number } | null> {
  const inventory = await listInventoryApi(session);
  const rows = unwrapInventoryList(inventory);
  const row = rows.find(
    (item) => resolveRefId(item.productId as string | { _id?: string; id?: string }) === productId
  );
  if (!row) return null;
  const warehouseId = resolveRefId(row.warehouseId as string | { _id?: string; id?: string });
  if (!warehouseId) return null;
  return { warehouseId, stock: Number(row.stock ?? 0) };
}

export async function getInventoryStockForProduct(
  session: ApiSession,
  productId: string
): Promise<number> {
  const inventory = await listInventoryApi(session);
  const rows = unwrapInventoryList(inventory);
  let total = 0;
  for (const row of rows) {
    if (resolveRefId(row.productId as string | { _id?: string; id?: string }) === productId) {
      total += Number(row.stock ?? 0);
    }
  }
  return total;
}

async function seedProduct(
  adminSession: ApiSession,
  categoryId: string,
  prefix: string,
  stock: number
): Promise<InventorySmokeProduct> {
  const created = await createProductApi(adminSession, {
    name: uniqueProductName(prefix),
    price: 150,
    categoryId,
    stock,
    moq: 1,
  });
  const id = String(created._id || created.id);
  const name = String(created.name);

  // Product create provisions inventory asynchronously relative to listing — poll briefly.
  let row: { warehouseId: string; stock: number } | null = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    row = await findInventoryRowForProduct(adminSession, id);
    if (row) break;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  if (!row) {
    throw new Error(`Inventory row not provisioned for product ${name}`);
  }

  return { id, name, stock, warehouseId: row.warehouseId };
}

export async function seedInventorySmokeData(): Promise<{
  adminSession: ApiSession;
  seed: InventorySmokeSeed;
}> {
  const adminSession = await getAdminSession();
  const categoryId = await getFirstCategoryId(adminSession);

  const standard = await seedProduct(adminSession, categoryId, 'is-inv-std', 50);
  const statusProbe = await seedProduct(adminSession, categoryId, 'is-inv-status', 25);
  const orderProbe = await seedProduct(adminSession, categoryId, 'is-inv-ord', 40);

  return {
    adminSession,
    seed: { categoryId, standard, statusProbe, orderProbe },
  };
}

export async function setInventoryStockApi(
  session: ApiSession,
  product: Pick<InventorySmokeProduct, 'id' | 'warehouseId'>,
  stock: number
) {
  return updateInventoryStockApi(session, {
    productId: product.id,
    warehouseId: product.warehouseId,
    stock,
    type: 'SET',
  });
}

export async function getInventoryRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/inventory', { headers, validateStatus: () => true });
}

export async function getInventoryStatsRaw(headers: Record<string, string> = {}) {
  return apiClient.get('/inventory/stats', { headers, validateStatus: () => true });
}

export async function patchInventoryUpdateRaw(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return apiClient.patch('/inventory/update', body, { headers, validateStatus: () => true });
}

export { authHeaders, listInventoryApi, resolveRefId };
