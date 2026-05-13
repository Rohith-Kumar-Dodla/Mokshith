import Joi from 'joi';
import { ORDER_STATUS } from '../../constants/orderStatus.js';

// Reusable ObjectId pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createOrderSchema = Joi.object({
  body: Joi.object({
    paymentMethod: Joi.string()
      .valid('COD', 'ONLINE', 'CREDIT', 'RAZORPAY', 'UPI', 'CARD')
      .required(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.alternatives().try(
          Joi.string().pattern(objectIdPattern),
          Joi.object() // Allow populated object
        ).required(),
        quantity: Joi.number().integer().min(1).max(10000).required(),
      }).unknown(true)
    ).min(1).optional(), // Optional because items can come from cart
    shippingAddress: Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      phone: Joi.string().trim().pattern(/^[0-9]{10,15}$/).required(),
      addressLine: Joi.string().trim().min(5).max(200).required(),
      city: Joi.string().trim().min(2).max(50).required(),
      state: Joi.string().trim().min(2).max(50).required(),
      pincode: Joi.string().trim().pattern(/^[0-9]{6}$/).required(),
    }).required(),
    idempotencyKey: Joi.string().alphanum().max(255).optional(),
  }).unknown(true),
});

export const updateOrderStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string()
      .valid(...Object.values(ORDER_STATUS))
      .required(),
  }),
  params: Joi.object({
    id: Joi.string().pattern(objectIdPattern).required(),
  }),
});

export const getOrderByIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(objectIdPattern).required(),
  }),
});
