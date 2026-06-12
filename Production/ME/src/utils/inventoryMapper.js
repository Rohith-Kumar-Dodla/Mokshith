const LOW_STOCK_THRESHOLD = 10;

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? [];
}

function deriveStatus(stock) {
  const quantity = Number(stock ?? 0);
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'healthy';
}

export function mapBackendInventoryItem(item) {
  if (!item) return null;

  const product = item.productId;
  const warehouse = item.warehouseId;
  const stock = Number(item.stock ?? 0);

  return {
    id: item._id || item.id,
    productId: product?._id || product?.sku || item.productId,
    productName: product?.name || 'Unknown Product',
    category: product?.categoryId?.name || product?.category || '—',
    warehouseId: warehouse?._id || item.warehouseId,
    warehouseName: warehouse?.name || '—',
    currentStock: stock,
    reorderLevel: Number(item.reorderLevel ?? LOW_STOCK_THRESHOLD),
    maxStock: Math.max(stock, LOW_STOCK_THRESHOLD * 2),
    status: deriveStatus(stock),
    lastUpdated: item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString('en-IN')
      : '—',
    raw: item,
  };
}

export function mapBackendInventory(payload) {
  return unwrapList(payload).map(mapBackendInventoryItem).filter(Boolean);
}

export function mapInventoryStats(statsPayload) {
  const stats = statsPayload?.data ?? statsPayload ?? {};
  return {
    totalStock: Number(stats.totalStock ?? 0),
    lowStockProducts: Number(stats.lowStockCount ?? stats.lowStockProducts ?? 0),
    outOfStock: Number(stats.outOfStock ?? 0),
    inventoryValue: Number(stats.totalValue ?? 0),
    productCount: Number(stats.productCount ?? stats.uniqueProducts?.length ?? 0),
  };
}
