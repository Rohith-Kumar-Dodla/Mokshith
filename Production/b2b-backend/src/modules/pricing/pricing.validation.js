import Joi from 'joi';

export const pricingSchema = Joi.object({
  body: Joi.object({
    productId: Joi.string().hex().length(24).optional(),
    price: Joi.number().greater(0).required(),
    quantity: Joi.number().min(1).required(),
  }),
});
