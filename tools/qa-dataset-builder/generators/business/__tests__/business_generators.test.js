import { jest } from '@jest/globals';

import { generate as genCompanies } from '../companies.generator.js';
import { generate as genCategories } from '../categories.generator.js';
import { generate as genWarehouses } from '../warehouses.generator.js';

function mockColl() {
  const docs = {};
  return {
    findOne: async (filter) => Object.values(docs).find(d => (filter.code ? d.code === filter.code : d.name === filter.name || d.email === filter.email)) || null,
    updateOne: async (filter, update, opts) => {
      if (opts && opts.upsert) {
        const key = filter.code || filter.name || filter.email;
        if (!docs[key]) {
          docs[key] = update.$setOnInsert || update.$set || {};
          return { upsertedCount: 1 };
        }
        return { upsertedCount: 0 };
      }
      return { upsertedCount: 0 };
    },
  };
}

test('companies generator dry-run', async () => {
  const db = { db: { collection: () => mockColl() } };
  const res = await genCompanies({ manifestPath: 'docs/qa-dataset', dryRun: true, dbConnection: db, logger: console });
  expect(res.inserted >= 0).toBeTruthy();
});

test('categories generator dry-run', async () => {
  const db = { db: { collection: () => mockColl() } };
  const res = await genCategories({ manifestPath: 'docs/qa-dataset', dryRun: true, dbConnection: db, logger: console });
  expect(res.inserted >= 0).toBeTruthy();
});

test('warehouses generator dry-run', async () => {
  const db = { db: { collection: () => mockColl() } };
  const res = await genWarehouses({ manifestPath: 'docs/qa-dataset', dryRun: true, dbConnection: db, logger: console });
  expect(res.inserted >= 0).toBeTruthy();
});

