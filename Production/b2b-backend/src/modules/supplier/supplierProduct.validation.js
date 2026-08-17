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

const supplierPriceField = () =>
  Joi.number()
    .greater(0)
    .precision(2)
    .messages({
      'number.base': 'Supplier price must be a valid amount greater than 0.',
      'number.greater': 'Supplier price must be greater than 0.',
      'any.required': 'Supplier price must be a valid amount greater than 0.',
    });

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
    search: Joi.string().trim().max(100).optional().allow(''),
    categoryId: Joi.string().optional().allow('all'),
    priceStatus: Joi.string().valid('all', 'set', 'not_set').optional(),
  }),
});

export const createSupplierProductSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.alternatives().try(
    Joi.object({
      productId: Joi.string().required(),
      supplierCategoryId: Joi.string().optional(),
      minimumOrderQuantity: moqField(true),
      supplierPrice: supplierPriceField().optional(),
      availabilityStatus: Joi.string()
        .valid(...Object.values(SUPPLIER_PRODUCT_STATUS))
        .default(SUPPLIER_PRODUCT_STATUS.ACTIVE),
      notes: Joi.string().trim().max(1000).optional().allow(''),
    }),
    Joi.object({
      product: Joi.object({
        name: Joi.string().trim().min(1).required(),
        description: Joi.string().trim().allow('').optional(),
        price: Joi.number().greater(0).required(),
        moq: Joi.number().integer().min(1).optional(),
        stock: Joi.number().min(0).optional(),
        imageUrl: Joi.string().optional().allow(''),
      }).required(),
      supplierCategoryId: Joi.string().required(),
      minimumOrderQuantity: moqField(true),
      supplierPrice: supplierPriceField().optional(),
      availabilityStatus: Joi.string()
        .valid(...Object.values(SUPPLIER_PRODUCT_STATUS))
        .default(SUPPLIER_PRODUCT_STATUS.ACTIVE),
      notes: Joi.string().trim().max(1000).optional().allow(''),
    })
  ),
});

export const searchSupplierProductsSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object({
    search: Joi.string().trim().max(100).optional().allow(''),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
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
