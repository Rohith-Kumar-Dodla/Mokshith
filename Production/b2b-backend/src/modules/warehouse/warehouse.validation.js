import Joi from 'joi';

export const createWarehouseSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().required(),

    location: Joi.object({
      address: Joi.string().allow('').optional(),
      city: Joi.string().allow('').optional(),
      state: Joi.string().allow('').optional(),
      country: Joi.string().allow('').optional(),
      pincode: Joi.string().allow('').optional(),
      coordinates: Joi.object({ latitude: Joi.number().min(-90).max(90).required(), longitude: Joi.number().min(-180).max(180).required() }).optional(),
    }).optional(),

    capacity: Joi.number().min(0).optional(),
    currentLoad: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional(),
    isDeliveryOrigin: Joi.boolean().optional(),
  }),
});

export const updateWarehouseSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().optional(),
    location: Joi.object({
      address: Joi.string().allow('').optional(),
      city: Joi.string().allow('').optional(),
      state: Joi.string().allow('').optional(),
      country: Joi.string().allow('').optional(),
      pincode: Joi.string().allow('').optional(),
      coordinates: Joi.object({ latitude: Joi.number().min(-90).max(90).required(), longitude: Joi.number().min(-180).max(180).required() }).optional(),
    }).optional(),
    capacity: Joi.number().min(0).optional(),
    currentLoad: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional(),
    isDeliveryOrigin: Joi.boolean().optional(),
  }),
});
