import { calculatePrice } from './pricing.engine.js';
import * as repo from './pricing.repository.js';
import AppError from '../../errors/AppError.js';
import Product from '../product/product.model.js';
import { calculateLinePricing, applyBestProductPromotion } from '../../utils/bulkPricing.utils.js';
import { getEligiblePromotions } from '../promotion/promotion.service.js';

export const getPrice = async ({ price, quantity, productId }) => {
  if (!price || price <= 0) {
    throw new AppError('Invalid price', 400);
  }

  if (!quantity || quantity <= 0) {
    throw new AppError('Invalid quantity', 400);
  }

  // 🔥 Future: fetch rules from DB
  await repo.getPricingRules();

  let result;
  if (productId) {
    const product = await Product.findById(productId).select('_id price bulkPricing').lean();
    if (!product) throw new AppError('Product not found', 404);
    const promotions = await getEligiblePromotions([product._id]);
    result = applyBestProductPromotion(product, quantity, calculateLinePricing(product, quantity), promotions);
  } else {
    const finalPrice = await calculatePrice({ basePrice: price, quantity });
    result = { unitPrice: finalPrice, itemTotal: finalPrice * quantity, discountAmount: (price - finalPrice) * quantity, pricingSource: 'legacy' };
  }

  return {
    original: price,
    final: result.unitPrice,
    total: result.itemTotal,
    quantity,
    discount: result.discountAmount,
    specialDiscountAmount: result.specialDiscountAmount || 0,
    bulkDiscountAmount: result.bulkDiscountAmount || 0,
    totalDiscount: result.discountAmount,
    bulkEligible: Boolean(result.bulkPromotion),
    specialEligible: Boolean(result.specialPromotion),
    bulkMinimumQuantity: result.bulkPromotion?.minimumQuantity || null,
    specialPromotion: result.specialPromotion || null,
    bulkPromotion: result.bulkPromotion || null,
  };
};
