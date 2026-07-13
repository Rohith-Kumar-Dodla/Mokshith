export async function integrityValidate({ dbConnection, manifestPath, logger } = {}) {
  const report = { critical: [], high: [], medium: [], low: [] };

  // Orphan product references in inventory
  try {
    const inventory = dbConnection.db.collection('inventory');
    const products = dbConnection.db.collection('products');
    const cursor = inventory.find({}, { projection: { _id: 1, productId: 1 } });
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc.productId) {
        const p = await products.findOne({ _id: doc.productId });
        if (!p) report.critical.push({ collection: 'inventory', id: doc._id, reason: 'orphan productId' });
      }
    }
  } catch (err) {
    logger?.error('integrityValidate inventory-product error', err.message);
  }

  // Circular parent categories (naive detection via depth)
  try {
    const categories = dbConnection.db.collection('categories');
    const all = await categories.find({}).toArray();
    const byCode = new Map(all.map((c) => [c.code, c]));
    function detectCycle(code) {
      const visited = new Set();
      let cur = code;
      for (let i = 0; i < 50; i++) {
        if (!cur) return false;
        if (visited.has(cur)) return true;
        visited.add(cur);
        const node = byCode.get(cur);
        if (!node) return false;
        cur = node.parentCode;
      }
      return true;
    }
    for (const c of all) {
      if (detectCycle(c.code)) report.high.push({ collection: 'categories', code: c.code, reason: 'circular parent chain' });
    }
  } catch (err) {
    logger?.error('integrityValidate categories cycle error', err.message);
  }

  return report;
}

export default { integrityValidate };

