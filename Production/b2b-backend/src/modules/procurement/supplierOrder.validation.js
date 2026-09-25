import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const orderIdSchema = Joi.object({ params: Joi.object({ orderId: objectId.required() }) });
export const supplierOrderIdSchema = Joi.object({ params: Joi.object({ id: objectId.required() }) });
export const createSupplierOrdersSchema = Joi.object({
  body: Joi.object({
    customerOrderId: objectId.required(),
    selections: Joi.array().items(Joi.object({
      productId: objectId.required(),
      supplierId: objectId.required(),
      supplierProductId: objectId.required(),
      quantity: Joi.number().integer().min(1).optional(),
    })).min(1).required(),
  }),
});
