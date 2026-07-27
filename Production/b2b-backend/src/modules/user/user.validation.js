import Joi from 'joi';
import { vendorAddressJoiSchema } from '../../schemas/address.schema.js';

const gstField = () => Joi.string()
  .trim()
  .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
  .optional()
  .allow('')
  .messages({
    'string.pattern.base': 'Invalid GST number format',
  });

export const updateProfileSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    mobile: Joi.string().trim().pattern(/^[0-9]{10}$/).optional().messages({
      'string.pattern.base': 'Mobile number must be exactly 10 digits',
    }),
    phone: Joi.string().trim().pattern(/^[0-9]{10}$/).optional(),
    address: Joi.string().trim().max(500).optional(),
    companyName: Joi.string().trim().max(200).optional(),
    gstNumber: gstField(),
    businessName: Joi.string().trim().max(200).optional(),
    businessAddress: Joi.string().trim().max(500).optional(),
    ownerName: Joi.string().trim().max(100).optional(),
    vendorAddress: vendorAddressJoiSchema.optional(),
    upiId: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[\w.\-]+@[\w.\-]+$/)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Invalid UPI ID format (example: name@upi)',
      }),
    qrImage: Joi.string().trim().max(1000).optional().allow(''),
    qrImagePublicId: Joi.string().trim().max(200).optional().allow(''),
    vehicleType: Joi.string()
      .valid('TWO_WHEELER', 'THREE_WHEELER', 'FOUR_WHEELER', 'HEAVY_VEHICLE')
      .optional(),
    vehicleNumber: Joi.string().trim().max(20).optional(),
    licenseNumber: Joi.string().trim().max(50).optional(),
    serviceArea: Joi.string().trim().max(200).optional(),
  }).min(1),
});
