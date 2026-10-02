import Joi from 'joi';

export const createDeleteRequestSchema = Joi.object({ body: Joi.object({
  entityType: Joi.string().valid('PRODUCT', 'CATEGORY', 'WAREHOUSE', 'USER').required(),
  entityId: Joi.string().hex().length(24).required(),
  reason: Joi.string().trim().max(500).allow('').default(''),
}) });

export const listDeleteRequestsSchema = Joi.object({ query: Joi.object({
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'FAILED', 'STALE'),
  entityType: Joi.string().valid('PRODUCT', 'CATEGORY', 'WAREHOUSE', 'USER'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
}) });

export const rejectDeleteRequestSchema = Joi.object({ body: Joi.object({ rejectionReason: Joi.string().trim().min(2).max(500).required() }) });
