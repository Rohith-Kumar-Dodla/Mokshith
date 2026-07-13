import Joi from 'joi';

export const pricingSchema = Joi.object({
  body: Joi.object({
    price: Joi.number().greater(0).required(),
    quantity: Joi.number().min(1).required(),
  }),
});