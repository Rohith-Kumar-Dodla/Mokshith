const DEFAULT_DELAY = 300;

export const delay = (ms = DEFAULT_DELAY) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const simulateApi = async (fn, ms = DEFAULT_DELAY) => {
  await delay(ms);
  return fn();
};

export const generateId = (prefix = 'mock') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const filterByQuery = (items, query, fields) => {
  if (!query?.trim()) return items;
  const q = query.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item);
      return String(value ?? '').toLowerCase().includes(q);
    })
  );
};

export const paginate = (items, page = 1, limit = 20) => {
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
  };
};

export const exportToCsv = (headers, rows) => {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  return new Blob([csvContent], { type: 'text/csv' });
};
