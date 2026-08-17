import Order from '../order/order.model.js';
import Product from '../product/product.model.js';
import AppError from '../../errors/AppError.js';
import {
  DATE_ONLY_PATTERN,
  PROCUREMENT_DEMAND_EXCLUDED_STATUSES,
} from '../../constants/procurementDemand.js';

const pad = (value) => String(value).padStart(2, '0');

export const formatDateOnly = (date = new Date()) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
};

/**
 * Local calendar-day window, matching Super Admin date-picker semantics
 * (type="date" → YYYY-MM-DD, interpreted as the server's local calendar day).
 * Half-open: [startOfDay, startOfNextDay).
 */
export const getBusinessDayRange = (dateInput) => {
  const dateOnly = dateInput ? String(dateInput).trim() : formatDateOnly(new Date());
  if (!DATE_ONLY_PATTERN.test(dateOnly)) {
    throw new AppError('Procurement date must be YYYY-MM-DD.', 400);
  }

  const [year, month, day] = dateOnly.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 1);

  if (Number.isNaN(start.getTime()) || start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day) {
    throw new AppError('Procurement date must be a valid calendar date.', 400);
  }

  return { date: dateOnly, start, end };
};

const serializeDemandRow = (row) => ({
  productId: row.productId,
  productName: row.productName || 'Unknown product',
  requiredQuantity: Number(row.requiredQuantity) || 0,
  orderCount: Number(row.orderCount) || 0,
});

/**
 * Live read-only aggregation of existing orders. Does not mutate Order documents
 * and does not persist a procurement plan.
 */
export const getProcurementDemand = async ({ date } = {}) => {
  const { date: dateOnly, start, end } = getBusinessDayRange(date);

  const match = {
    createdAt: { $gte: start, $lt: end },
    status: { $nin: PROCUREMENT_DEMAND_EXCLUDED_STATUSES },
  };

  const [result] = await Order.aggregate([
    { $match: match },
    {
      $facet: {
        orderCount: [{ $count: 'count' }],
        products: [
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.productId',
              requiredQuantity: { $sum: '$items.quantity' },
              orderIds: { $addToSet: '$_id' },
              productNameSnapshot: { $first: '$items.name' },
            },
          },
          {
            $lookup: {
              from: Product.collection.name,
              localField: '_id',
              foreignField: '_id',
              pipeline: [{ $project: { name: 1 } }],
              as: 'product',
            },
          },
          {
            $project: {
              _id: 0,
              productId: '$_id',
              productName: {
                $ifNull: [{ $arrayElemAt: ['$product.name', 0] }, '$productNameSnapshot'],
              },
              requiredQuantity: 1,
              orderCount: { $size: '$orderIds' },
            },
          },
          { $sort: { productName: 1 } },
        ],
      },
    },
  ]);

  const products = (result?.products || []).map(serializeDemandRow);

  return {
    date: dateOnly,
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    orderCount: result?.orderCount?.[0]?.count || 0,
    productCount: products.length,
    products,
  };
};
