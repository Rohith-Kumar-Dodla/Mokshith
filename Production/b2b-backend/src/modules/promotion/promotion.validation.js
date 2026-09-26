import Joi from 'joi';

export const applyCouponSchema = Joi.object({
  body: Joi.object({
    code: Joi.string().trim().required(),
    amount: Joi.number().min(1).required(),
  }),
});

const promotionFields = {
  name: Joi.string().trim().max(120).allow('').optional(),
  message: Joi.string().trim().max(500).allow('').optional(),
  code: Joi.string().trim().max(40).optional(),
  discountType: Joi.string().valid('PERCENTAGE', 'FLAT').required(),
  promotionKind: Joi.string().valid('SPECIAL', 'BULK').optional(),
  discountApplication: Joi.string().valid('ORDER_FLAT', 'PER_UNIT').optional(),
  minimumQuantity: Joi.number().integer().min(1).optional(),
  value: Joi.number().greater(0).required(),
  maxDiscount: Joi.number().min(0).allow(null).optional(),
  productIds: Joi.array().items(Joi.string().hex().length(24)).default([]),
  startAt: Joi.date().iso().allow(null).optional(),
  endAt: Joi.date().iso().allow(null).optional(),
  expiresAt: Joi.date().iso().allow(null).optional(),
  status: Joi.string().valid('DRAFT', 'SCHEDULED', 'ACTIVE', 'EXPIRED', 'PAUSED').optional(),
  isActive: Joi.boolean().optional(),
};

export const createPromotionSchema = Joi.object({ body: Joi.object(promotionFields) });
export const updatePromotionSchema = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() }),
  body: Joi.object(promotionFields).min(1),
});
