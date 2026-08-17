import Joi from 'joi';
import { DATE_ONLY_PATTERN } from '../../constants/procurementDemand.js';

export const procurementDemandQuerySchema = Joi.object({
  query: Joi.object({
    date: Joi.string().pattern(DATE_ONLY_PATTERN).optional().messages({
      'string.pattern.base': 'Procurement date must be YYYY-MM-DD.',
    }),
  }),
});

export const procurementPlanDateQuerySchema = Joi.object({
  query: Joi.object({
    date: Joi.string().pattern(DATE_ONLY_PATTERN).required().messages({
      'string.pattern.base': 'Procurement date must be YYYY-MM-DD.',
      'any.required': 'Procurement date is required.',
    }),
  }),
});

export const createProcurementPlanSchema = Joi.object({
  body: Joi.object({
    date: Joi.string().pattern(DATE_ONLY_PATTERN).required().messages({
      'string.pattern.base': 'Procurement date must be YYYY-MM-DD.',
    }),
  }),
});

export const procurementPlanIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

export const updateProcurementPlanSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    syncDemand: Joi.boolean().optional(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        supplierId: Joi.string().optional(),
        supplierProductId: Joi.string().optional(),
        plannedQuantity: Joi.number().integer().min(1).optional(),
        refreshPrice: Joi.boolean().optional(),
      })
    ).optional(),
  }).min(1),
});

export const planSupplierOptionsSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
    productId: Joi.string().required(),
  }),
});

export const demandProductSupplierAllocationSchema = Joi.object({
  params: Joi.object({
    date: Joi.string().pattern(DATE_ONLY_PATTERN).required().messages({
      'string.pattern.base': 'Demand date must be YYYY-MM-DD.',
    }),
    productId: Joi.string().required(),
  }),
});

export const listPurchaseRequestsSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('all', 'DRAFT', 'SUBMITTED', 'CANCELLED').optional(),
    supplierId: Joi.string().optional(),
    demandDate: Joi.string().pattern(DATE_ONLY_PATTERN).optional(),
    search: Joi.string().trim().max(100).optional().allow(''),
  }),
});

export const purchaseRequestIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

const purchaseRequestItemSchema = Joi.object({
  productId: Joi.string().required(),
  supplierProductId: Joi.string().required(),
  demandQuantity: Joi.number().integer().min(0).required(),
  purchaseQuantity: Joi.number().integer().min(1).optional(),
});

export const createPurchaseRequestSchema = Joi.object({
  body: Joi.object({
    supplierId: Joi.string().required(),
    demandDate: Joi.string().pattern(DATE_ONLY_PATTERN).required().messages({
      'string.pattern.base': 'Demand date must be YYYY-MM-DD.',
    }),
    notes: Joi.string().trim().max(2000).optional().allow(''),
    items: Joi.array().items(purchaseRequestItemSchema).min(1).required(),
  }),
});

export const updatePurchaseRequestSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    notes: Joi.string().trim().max(2000).optional().allow(''),
    items: Joi.array().items(purchaseRequestItemSchema).optional(),
    removeProductIds: Joi.array().items(Joi.string()).optional(),
  }).min(1),
});

export const submitPurchaseRequestSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    confirmPriceRefresh: Joi.boolean().optional(),
  }),
});

export const acknowledgePurchaseRequestSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        confirmedQuantity: Joi.number().integer().min(1).required(),
      })
    ).min(1).required(),
    expectedDeliveryDate: Joi.string().pattern(DATE_ONLY_PATTERN).optional().allow(''),
    supplierResponseNotes: Joi.string().trim().max(2000).optional().allow(''),
  }),
});

export const receivePurchaseRequestSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    productId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    notes: Joi.string().trim().max(1000).optional().allow(''),
  }),
});
