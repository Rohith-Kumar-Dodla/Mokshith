import { jest } from '@jest/globals';
import { runAllValidators } from '../validator.engine.js';

test('validator engine orchestration (mocked)', async () => {
  const mockDb = {
    db: {
      collection: (name) => {
        const docs = [];
        return {
          findOne: async () => null,
          find: () => ({ hasNext: async () => false, next: async () => null }),
          aggregate: async () => [],
        };
      },
    },
  };
  const config = { targetDatabase: 'mokshith-dev', env: 'development' };
  const logger = console;
  const summary = await runAllValidators({ dbConnection: mockDb, manifestPath: 'docs/qa-dataset', config, logger });
  expect(summary).toHaveProperty('score');
});

