import Product from './product.model.js';

export const createProduct = (data) => Product.create(data);

export const findProducts = (filter, options) => {
  const { skip, limit } = options;

  return Product.find(filter)
    .select('name price stock description categoryId image imageUrl imagePublicId unit minOrderQty moq gst isActive updatedAt')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate('categoryId', 'name') // 🔥 Populating only necessary fields
    .populate('vendorId', 'name')
    .populate('companyId', 'name')
    .lean() // 🔥 Performance: Convert to plain objects
    .maxTimeMS(5000); // Query timeout
};

export const countProducts = (filter) => Product.countDocuments(filter).maxTimeMS(3000);

export const findById = (id) =>
  Product.findById(id).populate('categoryId vendorId companyId');

export const updateProduct = (id, data) =>
  Product.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();

export const deleteProduct = (id) =>
  Product.findByIdAndDelete(id);