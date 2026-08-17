import Joi from 'joi';
import { SUPPLIER_PRODUCT_STATUS } from '../../constants/supplierProductStatus.js';

const moqField = (required = true) => {
  const schema = Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Minimum order quantity must be a positive number.',
      'number.integer': 'Minimum order quantity must be a positive number.',
      'number.min': 'Minimum order quantity must be a positive number.',
      'any.required': 'Minimum order quantity must be a positive number.',
    });
  return required ? schema.required() : schema.optional();
};

export const listSupplierProductsSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string()
      .valid('all', ...Object.values(SUPPLIER_PRODUCT_STATUS))
      .optional(),
  }),
});

export const createSupplierProductSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    productId: Joi.string().required(),
    minimumOrderQuantity: moqField(true),
    availabilityStatus: Joi.string()
      .valid(...Object.values(SUPPLIER_PRODUCT_STATUS))
      .default(SUPPLIER_PRODUCT_STATUS.ACTIVE),
    notes: Joi.string().trim().max(1000).optional().allow(''),
  }),
});

export const updateSupplierProductSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
    mappingId: Joi.string().required(),
  }),
  body: Joi.object({
    minimumOrderQuantity: moqField(false),
    availabilityStatus: Joi.string()
      .valid(...Object.values(SUPPLIER_PRODUCT_STATUS))
      .optional(),
    notes: Joi.string().trim().max(1000).optional().allow(''),
  }).min(1),
});

export const updateSupplierProductStatusSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
    mappingId: Joi.string().required(),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid(...Object.values(SUPPLIER_PRODUCT_STATUS))
      .required(),
  }),
});

export const supplierProductIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
    mappingId: Joi.string().required(),
  }),
});

const supplierPriceField = () =>
  Joi.number()
    .greater(0)
    .precision(2)
    .messages({
      'number.base': 'Supplier price must be a valid amount greater than 0.',
      'number.greater': 'Supplier price must be greater than 0.',
      'any.required': 'Supplier price must be a valid amount greater than 0.',
    });

export const updateSupplierProductPriceSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
    mappingId: Joi.string().required(),
  }),
  body: Joi.object({
    price: supplierPriceField().required(),
  }),
});

export const listSupplierProductPriceHistorySchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
    mappingId: Joi.string().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
});

export const supplierComparisonSchema = Joi.object({
  params: Joi.object({
    productId: Joi.string().required(),
  }),
});
