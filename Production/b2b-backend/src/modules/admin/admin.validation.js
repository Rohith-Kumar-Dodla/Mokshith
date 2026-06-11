import Joi from 'joi';

export const updateUserStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().required(),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

export const createB2BCustomerSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().required(),
    password: Joi.string().required(),
    businessName: Joi.string().required(),
    ownerName: Joi.string().required(),
    gstNumber: Joi.string().required(),
    businessAddress: Joi.string().required(),
    creditLimit: Joi.number().min(0).default(50000),
  }),
});

export const createDeliveryPartnerSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().required(),
    password: Joi.string().required(),
    vehicleType: Joi.string().valid('TWO_WHEELER', 'THREE_WHEELER', 'FOUR_WHEELER', 'HEAVY_VEHICLE').required(),
    vehicleNumber: Joi.string().required(),
    licenseNumber: Joi.string().required(),
  }),
});