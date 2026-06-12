import Joi from 'joi';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const uploadPaymentProofSchema = Joi.object({
  body: Joi.object({
    orderId: Joi.string().pattern(objectIdPattern).required(),
    utrNumber: Joi.string().trim().min(4).max(50).required(),
    transferredAmount: Joi.number().positive().optional(),
  }),
});

export const rejectPaymentProofSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(objectIdPattern).required(),
  }),
  body: Joi.object({
    reason: Joi.string().trim().min(3).max(500).required(),
  }),
});

export const paymentProofIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().pattern(objectIdPattern).required(),
  }),
});

export const orderIdParamSchema = Joi.object({
  params: Joi.object({
    orderId: Joi.string().pattern(objectIdPattern).required(),
  }),
});
