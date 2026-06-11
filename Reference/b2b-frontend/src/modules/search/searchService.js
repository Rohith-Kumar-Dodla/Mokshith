import { simulateApi, filterByQuery } from '../../mocks/mockApi.js';
import { mockSearchProducts, mockSearchVendors, mockSearchOrders } from '../../mocks/data/index.js';

export const searchService = {
  async search(query, type = 'all') {
    return simulateApi(() => {
      if (!query?.trim()) return { products: [], vendors: [], orders: [] };

      const products = filterByQuery(mockSearchProducts, query, ['name', 'description', 'categoryId.name']);
      const vendors = filterByQuery(mockSearchVendors, query, ['name', 'companyName', 'city']);
      const orders = filterByQuery(mockSearchOrders, query, ['orderNumber', 'customerName', 'status']);

      if (type === 'products') return { products, vendors: [], orders: [] };
      if (type === 'vendors') return { products: [], vendors, orders: [] };
      if (type === 'orders') return { products: [], vendors: [], orders };
      return { products, vendors, orders };
    });
  },
};
