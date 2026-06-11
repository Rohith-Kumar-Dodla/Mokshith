import Inventory from './inventory.model.js';

export const findInventory = (productId, warehouseId) =>
  Inventory.findOne({ productId, warehouseId });

export const createInventory = (data) =>
  Inventory.create(data);

export const updateInventory = (id, data) =>
  Inventory.findByIdAndUpdate(id, data, { new: true });

export const findAll = () =>
  Inventory.find()
    .populate('productId', 'name sku') // Only needed fields
    .populate('warehouseId', 'name location')
    .select('-__v')
    .lean(); // 🔥 Performance optimization

// 🔥 NEW (IMPORTANT)
export const findByProduct = (productId) =>
  Inventory.find({ productId });

export const findLowStock = (threshold = 10) =>
  Inventory.find({ stock: { $lte: threshold } })
    .populate('productId', 'name sku')
    .populate('warehouseId', 'name location')
    .select('-__v')
    .lean(); // 🔥 Performance optimization

export const getStats = async () => {
  const stats = await Inventory.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: null,
        totalStock: { $sum: "$stock" },
        uniqueProducts: { $addToSet: "$productId" },
        totalValue: { $sum: { $multiply: ["$stock", "$product.price"] } }
      }
    }
  ]);
  return stats[0] || { totalStock: 0, uniqueProducts: [], totalValue: 0 };
};