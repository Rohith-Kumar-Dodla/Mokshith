import Joi from 'joi';

export const vendorAddressMongooseSchema = {
  line1: { type: String, trim: true },
  line2: { type: String, trim: true },
  area: { type: String, trim: true },
  city: { type: String, trim: true },
  district: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true, default: 'India' },
  pincode: { type: String, trim: true },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
};

export const vendorAddressJoiSchema = Joi.object({
  line1: Joi.string().trim().min(3).max(200).required(),
  line2: Joi.string().trim().max(200).allow('').optional(),
  area: Joi.string().trim().min(2).max(100).required(),
  city: Joi.string().trim().min(2).max(100).required(),
  district: Joi.string().trim().min(2).max(100).required(),
  state: Joi.string().trim().min(2).max(100).required(),
  country: Joi.string().trim().min(2).max(100).default('India'),
  pincode: Joi.string().trim().pattern(/^[0-9]{6}$/).required().messages({
    'string.pattern.base': 'Pincode must be exactly 6 digits',
  }),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
  }).optional(),
});

export const optionalVendorAddressJoiSchema = vendorAddressJoiSchema.fork(
  ['line1', 'area', 'city', 'district', 'state', 'pincode'],
  (schema) => schema.optional()
);
