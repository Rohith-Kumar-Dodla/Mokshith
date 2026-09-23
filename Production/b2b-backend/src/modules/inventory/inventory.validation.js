import Joi from 'joi';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const addStockSchema = Joi.object({
  body: Joi.object({
    productId: Joi.string().pattern(objectIdPattern).required(),
    warehouseId: Joi.string().pattern(objectIdPattern).required(),
    stock: Joi.number().min(1).required(),
  }),
});

export const updateStockSchema = Joi.object({
  body: Joi.object({
    productId: Joi.string().pattern(objectIdPattern).required(),
    warehouseId: Joi.string().pattern(objectIdPattern).required(),
    stock: Joi.number().integer().min(0).required(),
    type: Joi.string().valid('SET', 'ADD', 'SUBTRACT').optional(),
  }),
});
