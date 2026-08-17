import { CUSTOMER_CATALOG_SCOPE_FILTER } from '../../constants/catalogScope.js';

// 🔥 Escape regex special characters to prevent ReDoS attacks
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const buildProductFilter = ({ categoryId, search }) => {
  const filter = {
    isActive: true,
    ...CUSTOMER_CATALOG_SCOPE_FILTER,
  };

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  if (search) {
    // 🔥 Security: Sanitize search input to prevent ReDoS
    const sanitizedSearch = escapeRegex(search.trim());
    if (sanitizedSearch.length > 0 && sanitizedSearch.length <= 100) {
      filter.name = { $regex: sanitizedSearch, $options: 'i' };
    }
  }

  return filter;
};
