import Joi from 'joi';

export const addStockSchema = Joi.object({
  body: Joi.object({
    productId: Joi.string().required(),
    warehouseId: Joi.string().required(),
    stock: Joi.number().min(1).required(),
  }),
});

export const updateStockSchema = Joi.object({
  body: Joi.object({
    productId: Joi.string().hex().length(24).required(),
    warehouseId: Joi.string().hex().length(24).required(),
    stock: Joi.number().min(0).required(),
    type: Joi.string().valid('SET', 'ADD', 'SUBTRACT').default('SET'),
  }),
});
