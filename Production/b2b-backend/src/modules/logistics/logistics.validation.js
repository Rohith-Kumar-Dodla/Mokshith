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
  }),
});

export const rejectDeliverySchema = Joi.object({
  body: Joi.object({
    reason: Joi.string().trim().max(500).optional().allow('', null),
  }).default({}),
});