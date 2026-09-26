import Joi from 'joi';

export const addToCartSchema = Joi.object({
  body: Joi.object({
    productId: Joi.string().required(),
    quantity: Joi.number().min(1).required(),
  }),
});

export const updateCartItemSchema = Joi.object({
  body: Joi.object({
    quantity: Joi.number().integer().min(1).required(),
  }),
});
