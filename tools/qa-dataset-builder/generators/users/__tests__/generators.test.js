import { jest } from '@jest/globals';

import { generate as genSuper } from '../superAdmin.generator.js';

describe('User generators (unit)', () => {
  const mockColl = () => {
    const docs = {};
    return {
      findOne: async (filter) => Object.values(docs).find(d => d.email === filter.email) || null,
      updateOne: async (filter, update, opts) => {
        const exists = Object.values(docs).find(d => d.email === filter.email);
        if (opts && opts.upsert) {
          if (!exists) {
            const doc = update.$setOnInsert || update.$set || {};
            docs[filter.email] = doc;
            return { upsertedCount: 1 };
          }
          return { upsertedCount: 0 };
        }
        return { upsertedCount: 0 };
      },
    };
  };

  test('superAdmin generator dryRun reports inserts/skips', async () => {
    const coll = mockColl();
    const db = { db: { collection: () => coll } };
    const res = await genSuper({ manifestPath: 'docs/qa-dataset', dryRun: true, dbConnection: db, logger: console });
    expect(res.inserted >= 0).toBeTruthy();
  });
});

