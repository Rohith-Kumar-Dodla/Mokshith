export async function relationshipValidate({ dbConnection, manifestPath, logger } = {}) {
  const report = { critical: [], high: [], medium: [], low: [] };

  const companies = dbConnection.db.collection('companies');
  const warehouses = dbConnection.db.collection('warehouses');
  const categories = dbConnection.db.collection('categories');
  const brands = dbConnection.db.collection('brands');

  // Warehouse -> company
  try {
    const cursor = warehouses.find({}, { projection: { _id: 1, companyId: 1, name: 1 } });
    while (await cursor.hasNext()) {
      const w = await cursor.next();
      if (w.companyId) {
        const comp = await companies.findOne({ _id: w.companyId });
        if (!comp) {
          report.critical.push({ collection: 'warehouses', id: w._id, reason: 'missing company reference' });
        }
      } else {
        report.high.push({ collection: 'warehouses', id: w._id, reason: 'no companyId' });
      }
    }
  } catch (err) {
    logger?.error('relationshipValidate warehousing error', err.message);
  }

  // Category parent reference
  try {
    const cur = categories.find({}, { projection: { _id: 1, code: 1, parentCode: 1, name: 1 } });
    while (await cur.hasNext()) {
      const c = await cur.next();
      if (c.parentCode) {
        const parent = await categories.findOne({ code: c.parentCode });
        if (!parent) {
          report.high.push({ collection: 'categories', id: c._id, reason: 'missing parentCode' });
        }
      }
    }
  } catch (err) {
    logger?.error('relationshipValidate categories error', err.message);
  }

  // Brand -> company
  try {
    const bc = dbConnection.db.collection('brands').find({}, { projection: { _id: 1, companyId: 1 } });
    while (await bc.hasNext()) {
      const b = await bc.next();
      if (b.companyId) {
        const comp = await companies.findOne({ _id: b.companyId });
        if (!comp) report.high.push({ collection: 'brands', id: b._id, reason: 'missing companyId' });
      }
    }
  } catch (err) {
    logger?.error('relationshipValidate brands error', err.message);
  }

  return report;
}

export default { relationshipValidate };

