import * as repo from './promotion.repository.js';
import AppError from '../../errors/AppError.js';
import { logAction } from '../audit/audit.service.js';

const effectiveStatus = (promotion, now = new Date()) => {
  if (promotion.status === 'PAUSED' || promotion.isActive === false) return 'PAUSED';
  if (promotion.endAt && new Date(promotion.endAt) <= now) return 'EXPIRED';
  if (promotion.expiresAt && new Date(promotion.expiresAt) <= now) return 'EXPIRED';
  if (promotion.startAt && new Date(promotion.startAt) > now) return 'SCHEDULED';
  return promotion.status === 'DRAFT' ? 'DRAFT' : 'ACTIVE';
};

const generatedCode = (data) =>
  (data.code || data.name || 'PROMO').toString().toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28)
    + (data.code ? '' : `-${Date.now().toString().slice(-6)}`);

export const getPromotions = async () => {
  const rows = await repo.findAll();
  return rows.map((row) => ({ ...row.toObject(), effectiveStatus: effectiveStatus(row) }));
};

export const createPromotion = async (data) => {
  if (!data.value || !data.discountType) throw new AppError('Discount type and value are required', 400);
  if (data.startAt && data.endAt && new Date(data.endAt) <= new Date(data.startAt)) throw new AppError('End date must be after start date', 400);
  const promo = await repo.create({ ...data, code: generatedCode(data), status: data.status || 'ACTIVE' });
  await logAction({ userId: data.actorId, action: 'PROMOTION_CREATED', entity: 'Promotion', entityId: promo._id, details: 'Promotion created', data: { code: promo.code } }).catch(() => {});
  return promo;
};

export const updatePromotion = async (id, data) => {
  if (data.startAt && data.endAt && new Date(data.endAt) <= new Date(data.startAt)) throw new AppError('End date must be after start date', 400);
  const promo = await repo.update(id, data);
  if (!promo) throw new AppError('Promotion not found', 404);
  return promo;
};

export const deletePromotion = async (id) => {
  const promo = await repo.findById(id);
  if (!promo) throw new AppError('Promotion not found', 404);
  return repo.remove(id);
};

export const togglePromotion = async (id) => {
  const promo = await repo.findById(id);
  if (!promo) throw new AppError('Promotion not found', 404);
  return repo.update(id, { isActive: !promo.isActive, status: promo.isActive ? 'PAUSED' : 'ACTIVE' });
};

export const getEligiblePromotions = async (productIds) => {
  const rows = await repo.findEligibleForProducts(productIds);
  return rows.filter((row) => effectiveStatus(row) === 'ACTIVE');
};

export { effectiveStatus };

export const applyCoupon = async (code, amount) => {
  if (!code) {
    throw new AppError('Coupon code required', 400);
  }

  if (!amount || amount <= 0) {
    throw new AppError('Invalid amount', 400);
  }

  const promo = await repo.findByCode(code);

  if (!promo) throw new AppError('Invalid coupon', 400);

  // 🔥 Check expiry
  const status = effectiveStatus(promo);
  if (status !== 'ACTIVE') {
    throw new AppError(status === 'SCHEDULED' ? 'Coupon is not active yet' : 'Coupon expired', 400);
  }

  let discount = 0;

  if (promo.discountType === 'PERCENTAGE') {
    discount = (amount * promo.value) / 100;

    // 🔥 Apply max cap
    if (promo.maxDiscount) {
      discount = Math.min(discount, promo.maxDiscount);
    }
  } else {
    discount = promo.value;
  }

  // 🔥 Prevent negative final amount
  const finalAmount = Math.max(amount - discount, 0);

  return {
    originalAmount: amount,
    discount,
    finalAmount,
    code: promo.code,
  };
};
