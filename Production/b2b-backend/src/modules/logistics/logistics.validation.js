import Joi from 'joi';

export const updateStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string()
      .valid('PENDING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED')
      .required(),
  }),
});

export const assignDeliverySchema = Joi.object({
  body: Joi.object({
    deliveryPartnerId: Joi.string().required(),
  }).required(),
});

export const collectCodPaymentSchema = Joi.object({
  body: Joi.object({
    collectionMode: Joi.string().valid('QR', 'CASH', 'qr', 'cash').required(),
    cashCollectionProof: Joi.string().min(5).max(2000).optional().allow(''),
    notes: Joi.string().trim().max(500).optional().allow(''),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
});
