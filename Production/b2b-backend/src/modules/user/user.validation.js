import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    mobile: Joi.string().trim().pattern(/^[0-9+\-\s()]{10,15}$/).optional(),
    phone: Joi.string().trim().pattern(/^[0-9+\-\s()]{10,15}$/).optional(),
    address: Joi.string().trim().max(500).optional(),
    companyName: Joi.string().trim().max(200).optional(),
    gstNumber: Joi.string().trim().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().allow(''),
    businessName: Joi.string().trim().max(200).optional(),
    businessAddress: Joi.string().trim().max(500).optional(),
    ownerName: Joi.string().trim().max(100).optional(),
    vehicleType: Joi.string()
      .valid('TWO_WHEELER', 'THREE_WHEELER', 'FOUR_WHEELER', 'HEAVY_VEHICLE')
      .optional(),
    vehicleNumber: Joi.string().trim().max(20).optional(),
    licenseNumber: Joi.string().trim().max(50).optional(),
  }).min(1),
});
