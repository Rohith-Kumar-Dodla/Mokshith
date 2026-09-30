import * as repo from './category.repository.js';
import AppError from '../../errors/AppError.js';
import Product from '../product/product.model.js';
import Category from './category.model.js';
import SupplierCategory from '../supplier/supplierCategory.model.js';

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const createCategory = async (data) => {
  const { name, parentId } = data;

  // 🔥 Check duplicate under same parent
  const existing = await repo.findAllCategories();

  const isDuplicate = existing.find(
    (cat) =>
      cat.name.toLowerCase() === name.toLowerCase() &&
      String(cat.parentId) === String(parentId || null)
  );

  if (isDuplicate) {
    throw new AppError('Category already exists under this parent', 400);
  }

  return repo.createCategory({
    ...data,
    slug: data.slug || generateSlug(name),
  });
};

export const getCategories = async () => {
  return repo.findAllCategories();
};

export const getCategoryById = async (id) => {
  const category = await repo.findById(id);

  if (!category) throw new AppError('Category not found', 404);

  return category;
};

export const updateCategory = async (id, data) => {
  const category = await repo.findById(id);
  if (!category) throw new AppError('Category not found', 404);

  if (data.name) {
    const existing = await repo.findAllCategories();
    const isDuplicate = existing.find(
      (cat) =>
        String(cat._id) !== String(id) &&
        cat.name.toLowerCase() === data.name.toLowerCase() &&
        String(cat.parentId) === String(data.parentId ?? category.parentId ?? null)
    );

    if (isDuplicate) {
      throw new AppError('Category already exists under this parent', 400);
    }
  }

  return repo.updateCategory(id, data);
};

export const deleteCategory = async (id) => {
  const category = await repo.findById(id);
  if (!category) throw new AppError('Category not found', 404);

  const [productCount, childCount, supplierMappingCount] = await Promise.all([
    Product.countDocuments({ categoryId: id }),
    Category.countDocuments({ parentId: id }),
    SupplierCategory.countDocuments({ categoryId: id }),
  ]);
  if (productCount > 0 || childCount > 0 || supplierMappingCount > 0) {
    throw new AppError('Category cannot be deleted while products, child categories, or supplier mappings reference it. Deactivate it instead.', 409);
  }
  await repo.deleteCategory(id);
  return category;
};
