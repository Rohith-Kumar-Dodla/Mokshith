import { mapBackendProduct } from './productMapper';

const fallback = '—';

export const mapSupplier = (supplier = {}) => {
  const summary = supplier.catalogSummary || {};
  return {
    id: supplier._id || supplier.id,
    supplierName: supplier.supplierName || fallback,
    companyName: supplier.companyName || fallback,
    contactPerson: supplier.contactPerson || fallback,
    phone: supplier.phone || fallback,
    email: supplier.email || fallback,
    businessAddress: supplier.businessAddress || fallback,
    gstNumber: supplier.gstNumber || fallback,
    status: String(supplier.status || 'PENDING').toUpperCase(),
    createdAt: supplier.createdAt,
    categoryCount: Number(summary.categoryCount || 0),
    productCount: Number(summary.productCount || 0),
    categories: (supplier.categories || []).map((category) => ({
      id: category._id || category.id,
      categoryId: category.categoryId?._id || category.categoryId,
      name: category.name || category.category?.name || fallback,
      status: String(category.status || 'ACTIVE').toUpperCase(),
      productCount: Number(category.productCount || 0),
    })),
  };
};

export const mapSupplierListResponse = (response) => {
  const payload = response?.data ?? response ?? {};
  return {
    suppliers: (payload.suppliers || []).map(mapSupplier),
    page: Number(payload.page || 1),
    pages: Number(payload.pages || 1),
    total: Number(payload.total || 0),
  };
};

export const mapSupplierCategoryProductsResponse = (response) => {
  const payload = response?.data ?? response ?? {};
  return {
    supplier: mapSupplier(payload.supplier),
    category: {
      id: payload.category?._id || payload.category?.id,
      name: payload.category?.name || fallback,
      status: String(payload.category?.associationStatus || 'ACTIVE').toUpperCase(),
    },
    products: (payload.products || []).map((mapping) => ({
      id: mapping._id || mapping.id,
      product: mapBackendProduct(mapping.product || {}),
      supplierPrice: mapping.currentSupplierPrice == null ? null : Number(mapping.currentSupplierPrice),
      minimumOrderQuantity: Number(mapping.minimumOrderQuantity || 0),
      status: String(mapping.availabilityStatus || 'ACTIVE').toUpperCase(),
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
    })),
    total: Number(payload.total || 0),
    page: Number(payload.page || 1),
    pages: Number(payload.pages || 1),
  };
};
