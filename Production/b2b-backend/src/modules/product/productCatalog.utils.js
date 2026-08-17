import AppError from '../../errors/AppError.js';
import { isSupplierOnlyCatalogScope } from '../../constants/catalogScope.js';

export const isSupplierOnlyProduct = (product) => {
  if (!product) return false;
  const plain = product?.toObject ? product.toObject() : product;
  return isSupplierOnlyCatalogScope(plain.catalogScope);
};

export const assertCustomerCatalogProduct = (product) => {
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  if (isSupplierOnlyProduct(product)) {
    throw new AppError('Product not found', 404);
  }
};
