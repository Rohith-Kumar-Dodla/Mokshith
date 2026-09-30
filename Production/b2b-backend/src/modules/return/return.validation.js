import Joi from 'joi';

const id = Joi.string().hex().length(24);
export const createReturnSchema = Joi.object({ body: Joi.object({
  orderId: id.required(),
  reason: Joi.string().valid('DAMAGED', 'WRONG_PRODUCT', 'MISSING_ITEMS', 'DEFECTIVE', 'EXPIRED', 'QUALITY_ISSUE', 'DIFFERENT_PRODUCT', 'OTHER').required(),
  reasonDetails: Joi.alternatives().conditional('reason', {
    is: 'OTHER',
    then: Joi.string().trim().min(3).max(1000).required(),
    otherwise: Joi.string().trim().max(1000).allow('').optional(),
  }),
  requestedResolution: Joi.string().valid('REFUND', 'REPLACEMENT').required(),
  idempotencyKey: Joi.string().trim().min(8).max(120).required(),
  items: Joi.array().min(1).items(Joi.object({ orderItemId: id.required(), requestedQuantity: Joi.number().integer().min(1).required() })).required(),
}).required() });
export const listReturnsSchema = Joi.object({ query: Joi.object({ page: Joi.number().integer().min(1).default(1), limit: Joi.number().integer().min(1).max(100).default(20), status: Joi.string().max(40), search: Joi.string().trim().max(100).allow('') }).unknown(false) });
export const rejectReturnSchema = Joi.object({ body: Joi.object({ note: Joi.string().trim().min(3).max(1000).required() }).required() });
export const receiveReturnSchema = Joi.object({ body: Joi.object({ items: Joi.array().min(1).items(Joi.object({ itemId: id.required(), receivedQuantity: Joi.number().integer().min(0).required() })).required(), note: Joi.string().trim().max(1000).allow('') }).required() });
export const inspectReturnSchema = Joi.object({ body: Joi.object({ items: Joi.array().min(1).items(Joi.object({ itemId: id.required(), acceptedQuantity: Joi.number().integer().min(0).required(), condition: Joi.string().valid('SELLABLE', 'DAMAGED', 'DEFECTIVE', 'REJECTED').required(), notes: Joi.string().trim().max(1000).allow('') })).required(), resolution: Joi.string().valid('REFUND', 'REPLACEMENT').required(), note: Joi.string().trim().max(1000).allow('') }).required() });
