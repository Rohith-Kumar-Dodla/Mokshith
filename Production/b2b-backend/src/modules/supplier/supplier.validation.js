import Joi from 'joi';
import { SUPPLIER_STATUS } from '../../constants/supplierStatus.js';

const gstField = () => Joi.string()
  .trim()
  .uppercase()
  .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
  .optional()
  .allow('')
  .messages({
    'string.pattern.base': 'Invalid GST number format',
  });

const phoneField = (required = true) => {
  const schema = Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .messages({
      'string.pattern.base': 'Phone number must be exactly 10 digits',
    });
  return required ? schema.required() : schema.optional();
};

const emailField = (required = false) => {
  const schema = Joi.string().trim().email().lowercase().allow('');
  return required ? schema.required() : schema.optional();
};

export const createSupplierSchema = Joi.object({
  body: Joi.object({
    supplierName: Joi.string().trim().min(1).max(100).required(),
    companyName: Joi.string().trim().min(1).max(200).required(),
    contactPerson: Joi.string().trim().max(100).optional().allow(''),
    phone: phoneField(true),
    email: emailField(false),
    businessAddress: Joi.string().trim().max(500).optional().allow(''),
    gstNumber: gstField(),
    notes: Joi.string().trim().max(1000).optional().allow(''),
  }),
});

export const updateSupplierSchema = Joi.object({
  body: Joi.object({
    supplierName: Joi.string().trim().min(1).max(100).optional(),
    companyName: Joi.string().trim().min(1).max(200).optional(),
    contactPerson: Joi.string().trim().max(100).optional().allow(''),
    phone: phoneField(false),
    email: emailField(false),
    businessAddress: Joi.string().trim().max(500).optional().allow(''),
    gstNumber: gstField(),
    notes: Joi.string().trim().max(1000).optional().allow(''),
  }).min(1),
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

export const updateSupplierStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string()
      .valid(SUPPLIER_STATUS.APPROVED, SUPPLIER_STATUS.ACTIVE, SUPPLIER_STATUS.INACTIVE)
      .required(),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

export const supplierIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

export const listSuppliersSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100).optional().allow(''),
    status: Joi.string().valid('all', ...Object.values(SUPPLIER_STATUS)).optional(),
  }),
});
