export const CATALOG_SCOPE = {
  CUSTOMER: 'CUSTOMER',
  SUPPLIER_ONLY: 'SUPPLIER_ONLY',
};

export const CUSTOMER_CATALOG_SCOPE_FILTER = {
  catalogScope: { $ne: CATALOG_SCOPE.SUPPLIER_ONLY },
};

export const isSupplierOnlyCatalogScope = (catalogScope) =>
  catalogScope === CATALOG_SCOPE.SUPPLIER_ONLY;
