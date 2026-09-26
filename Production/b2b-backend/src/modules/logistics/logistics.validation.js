import Joi from 'joi';
import { DELIVERY_REJECTION_REASONS } from '../../constants/deliveryOfferStatus.js';

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

export const rejectDeliverySchema = Joi.object({
  body: Joi.object({
    reason: Joi.string().trim().max(500).optional().allow('', null),
    rejectionCode: Joi.string().valid(...DELIVERY_REJECTION_REASONS).optional(),
    offerId: Joi.string().hex().length(24).optional(),
    requestId: Joi.string().pattern(/^[a-zA-Z0-9_-]{1,255}$/).optional(),
  }).default({}),
});

const proofImage = Joi.string()
  .max(2000000)
  .custom((value, helpers) => {
    if (/^https?:\/\/[^\s]+$/i.test(value)) return value;
    if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(value)) return value;
    return helpers.error('string.pattern.base');
  })
  .messages({
    'string.pattern.base': 'proofImage must be an HTTP image URL or a supported base64 JPEG, PNG, or WebP image',
  });

export const completeDeliverySchema = Joi.object({
  body: Joi.object({
    notes: Joi.string().trim().max(500).optional().allow(''),
    proofImage: proofImage.optional().allow(null, ''),
  }).default({}),
  params: Joi.object({ id: Joi.string().hex().length(24).required() }),
});

export const updateLocationSchema = Joi.object({
  body: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).required(),
  params: Joi.object({ id: Joi.string().hex().length(24).required() }),
});

const objectId = Joi.string().hex().length(24).required();

export const createDeliveryOfferSchema = Joi.object({
  body: Joi.object({
    deliveryPartnerId: objectId,
    deliveryAmount: Joi.number().positive().max(1000000).precision(2).required(),
    forceReassign: Joi.boolean().optional(),
    idempotencyKey: Joi.string().pattern(/^[a-zA-Z0-9_-]{1,255}$/).optional(),
  }).required(),
  params: Joi.object({ id: objectId }),
});

export const offerActionSchema = Joi.object({
  body: Joi.object({
    requestId: Joi.string().pattern(/^[a-zA-Z0-9_-]{1,255}$/).optional(),
    version: Joi.number().integer().positive().optional(),
    rejectionCode: Joi.string().valid(...DELIVERY_REJECTION_REASONS).optional(),
    reason: Joi.string().trim().max(500).allow('').optional(),
  }).default({}),
  params: Joi.object({ id: objectId, offerId: objectId }),
});

export const increaseDeliveryOfferAmountSchema = Joi.object({
  body: Joi.object({
    deliveryAmount: Joi.number().positive().max(1000000).precision(2).required(),
    deliveryPartnerId: objectId.optional(),
    idempotencyKey: Joi.string().pattern(/^[a-zA-Z0-9_-]{1,255}$/).optional(),
  }).required(),
  params: Joi.object({ id: objectId, offerId: objectId }),
});
