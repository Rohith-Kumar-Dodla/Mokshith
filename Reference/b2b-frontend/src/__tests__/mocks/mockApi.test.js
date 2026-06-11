import { describe, it, expect } from 'vitest';
import { delay, filterByQuery, generateId, exportToCsv } from '../../mocks/mockApi.js';

describe('mockApi', () => {
  it('filterByQuery filters items by nested fields', () => {
    const items = [{ name: 'Rice', category: { name: 'Grains' } }, { name: 'Oil' }];
    expect(filterByQuery(items, 'rice', ['name'])).toHaveLength(1);
    expect(filterByQuery(items, 'grains', ['category.name'])).toHaveLength(1);
  });

  it('generateId returns unique prefixed ids', () => {
    const id = generateId('test');
    expect(id).toMatch(/^test-/);
  });

  it('exportToCsv creates a blob', () => {
    const blob = exportToCsv(['A', 'B'], [['1', '2']]);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('delay resolves after timeout', async () => {
    const start = Date.now();
    await delay(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});
