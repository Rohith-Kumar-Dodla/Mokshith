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
