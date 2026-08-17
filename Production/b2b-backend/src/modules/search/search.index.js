import { CUSTOMER_CATALOG_SCOPE_FILTER } from '../../constants/catalogScope.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const buildSearchQuery = (query) => {
  return {
    name: { $regex: escapeRegex(query), $options: 'i' },
    isActive: true,
    ...CUSTOMER_CATALOG_SCOPE_FILTER,
  };
};
