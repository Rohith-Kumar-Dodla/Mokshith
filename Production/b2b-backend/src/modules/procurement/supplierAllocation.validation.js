import Joi from 'joi';

const objectId = Joi.string().hex().length(24);
export const orderIdSchema = Joi.object({ params: Joi.object({ orderId: objectId.required() }) });
export const queueSchema = Joi.object({ query: Joi.object({ orderId: objectId.optional(), status: Joi.string().valid('NOT_ALLOCATED', 'PARTIALLY_ALLOCATED', 'FULLY_ALLOCATED', 'REQUESTS_SENT', 'AWAITING_DELIVERY').optional(), supplierId: objectId.optional(), search: Joi.string().trim().max(100).allow('').optional(), startDate: Joi.date().iso().optional(), endDate: Joi.date().iso().optional(), page: Joi.number().integer().min(1).default(1), limit: Joi.number().integer().min(1).max(100).default(25) }).default({}) });
export const allocationSchema = Joi.object({
  body: Joi.object({
    customerOrderId: objectId.required(),
    productId: objectId.required(),
    supplierId: objectId.required(),
    supplierProductId: objectId.required(),
    quantity: Joi.number().integer().min(1).required(),
    idempotencyKey: Joi.string().trim().min(8).max(200).required(),
  }),
});
export const requestSchema = Joi.object({ body: Joi.object({ customerOrderId: objectId.required() }) });
export const requestIdSchema = Joi.object({ params: Joi.object({ id: objectId.required() }) });
