export async function duplicateValidate({ dbConnection, manifestPath, logger } = {}) {
  const report = { critical: [], high: [], medium: [], low: [] };

  async function findDups(collName, field) {
    try {
      const coll = dbConnection.db.collection(collName);
      const pipeline = [
        { $group: { _id: `$${field}`, count: { $sum: 1 }, docs: { $push: '$_id' } } },
        { $match: { _id: { $ne: null }, count: { $gt: 1 } } },
      ];
      const res = await coll.aggregate(pipeline).toArray();
      return res;
    } catch (err) {
      logger?.error(`duplicateValidate error on ${collName}.${field}`, err.message);
      return [];
    }
  }

  // Email/mobile in users
  const uEmailDups = await findDups('users', 'email');
  if (uEmailDups.length) report.critical.push({ collection: 'users', field: 'email', entries: uEmailDups.length });
  const uMobileDups = await findDups('users', 'mobile');
  if (uMobileDups.length) report.critical.push({ collection: 'users', field: 'mobile', entries: uMobileDups.length });

  // Company code
  const compCode = await findDups('companies', 'code');
  if (compCode.length) report.high.push({ collection: 'companies', field: 'code', entries: compCode.length });

  // Category/warehouse/brand codes
  const catCode = await findDups('categories', 'code');
  if (catCode.length) report.high.push({ collection: 'categories', field: 'code', entries: catCode.length });
  const whCode = await findDups('warehouses', 'code');
  if (whCode.length) report.high.push({ collection: 'warehouses', field: 'code', entries: whCode.length });
  const brandCode = await findDups('brands', 'code');
  if (brandCode.length) report.high.push({ collection: 'brands', field: 'code', entries: brandCode.length });

  // SKU (products)
  const skuDups = await findDups('products', 'sku');
  if (skuDups.length) report.critical.push({ collection: 'products', field: 'sku', entries: skuDups.length });

  // Tax/Currency/Unit codes
  const taxCode = await findDups('taxes', 'code');
  if (taxCode.length) report.medium.push({ collection: 'taxes', field: 'code', entries: taxCode.length });
  const currCode = await findDups('currencies', 'code');
  if (currCode.length) report.medium.push({ collection: 'currencies', field: 'code', entries: currCode.length });
  const unitCode = await findDups('units', 'code');
  if (unitCode.length) report.medium.push({ collection: 'units', field: 'code', entries: unitCode.length });

  return report;
}

export default { duplicateValidate };

