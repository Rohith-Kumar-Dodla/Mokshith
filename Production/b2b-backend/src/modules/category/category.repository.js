import Category from './category.model.js';
import Product from '../product/product.model.js';

export const createCategory = async (data) => Category.create(data);

async function attachProductCounts(categories = []) {
  if (!categories.length) {
    return categories;
  }

  const counts = await Product.aggregate([
    { $group: { _id: '$categoryId', productCount: { $sum: 1 } } },
  ]);

  const countByCategoryId = new Map(
    counts.map(({ _id, productCount }) => [String(_id), productCount])
  );

  return categories.map((category) => ({
    ...category,
    productCount: countByCategoryId.get(String(category._id)) ?? 0,
  }));
}

export const findAllCategories = async () => {
  const categories = await Category.find()
    .populate('parentId', 'name')
    .select('-__v')
    .lean();

  return attachProductCounts(categories);
};

export const findById = async (id) => {
  const category = await Category.findById(id).populate('parentId').select('-__v').lean();
  if (!category) {
    return null;
  }

  const [withCount] = await attachProductCounts([category]);
  return withCount;
};

export const updateCategory = async (id, data) => {
  const updated = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('parentId', 'name')
    .select('-__v')
    .lean();

  if (!updated) {
    return null;
  }

  const [withCount] = await attachProductCounts([updated]);
  return withCount;
};

export const deleteCategory = async (id) =>
  Category.findByIdAndDelete(id);