import Inventory from './inventory.model.js';

/** Soft cap so admin list/API cannot serialize unbounded historical inventory rows. */
export const DEFAULT_INVENTORY_LIST_LIMIT = 500;
export const MAX_INVENTORY_LIST_LIMIT = 1000;
const LIST_QUERY_MAX_TIME_MS = 8000;
const LOW_STOCK_THRESHOLD = 10;

export const findInventory = (productId, warehouseId) =>
  Inventory.findOne({ productId, warehouseId });

export const createInventory = (data) =>
  Inventory.create(data);

export const updateInventory = (id, data) =>
  Inventory.findByIdAndUpdate(id, data, { new: true });

/**
 * List inventory newest-first with a bounded limit.
 * Unbounded find()+populate over multi-thousand rows exceeds client timeouts
 * (FE 10s / API helpers 15s) under Atlas load.
 */
export const findAll = ({ limit = DEFAULT_INVENTORY_LIST_LIMIT, skip = 0 } = {}) => {
  const safeLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_INVENTORY_LIST_LIMIT, 1),
    MAX_INVENTORY_LIST_LIMIT
  );
  const safeSkip = Math.max(Number(skip) || 0, 0);

  return Inventory.find()
    .sort({ updatedAt: -1, _id: -1 })
    .skip(safeSkip)
    .limit(safeLimit)
    .populate('productId', 'name sku')
    .populate('warehouseId', 'name location')
    .select('-__v')
    .maxTimeMS(LIST_QUERY_MAX_TIME_MS)
    .lean();
};

export const findByProduct = (productId) =>
  Inventory.find({ productId });

export const findLowStock = (threshold = LOW_STOCK_THRESHOLD) =>
  Inventory.find({ stock: { $lte: threshold } })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(DEFAULT_INVENTORY_LIST_LIMIT)
    .populate('productId', 'name sku')
    .populate('warehouseId', 'name location')
    .select('-__v')
    .maxTimeMS(LIST_QUERY_MAX_TIME_MS)
    .lean();

/**
 * Aggregate stats without returning the uniqueProducts ObjectId array
 * (that payload alone can be hundreds of KB on polluted QA/prod datasets).
 */
export const getStats = async () => {
  const stats = await Inventory.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
        pipeline: [{ $project: { price: 1 } }],
      },
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: null,
        totalStock: { $sum: '$stock' },
        uniqueProductIds: { $addToSet: '$productId' },
        totalValue: { $sum: { $multiply: ['$stock', '$product.price'] } },
        lowStockCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ['$stock', 0] },
                  { $lte: ['$stock', LOW_STOCK_THRESHOLD] },
                ],
              },
              1,
              0,
            ],
          },
        },
        outOfStock: {
          $sum: {
            $cond: [{ $lte: ['$stock', 0] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalStock: 1,
        totalValue: 1,
        lowStockCount: 1,
        outOfStock: 1,
        productCount: { $size: '$uniqueProductIds' },
      },
    },
  ]).option({ maxTimeMS: LIST_QUERY_MAX_TIME_MS });

  return (
    stats[0] || {
      totalStock: 0,
      productCount: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStock: 0,
    }
  );
};