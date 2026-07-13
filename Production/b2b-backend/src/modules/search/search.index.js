// Placeholder for future Elasticsearch / Algolia

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const buildSearchQuery = (query) => {
  return {
    name: { $regex: escapeRegex(query), $options: 'i' },
  };
};