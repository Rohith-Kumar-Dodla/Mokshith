import Joi from 'joi';
import { SUPPORT_PRIORITY, SUPPORT_STATUS } from './support.model.js';

const objectId = Joi.string().hex().length(24);

export const createTicketSchema = Joi.object({
  body: Joi.object({
    subject: Joi.string().trim().max(200).optional().allow(''),
    category: Joi.string().trim().max(80).optional(),
    message: Joi.string().trim().min(1).max(5000).required(),
    priority: Joi.string()
      .valid(...Object.values(SUPPORT_PRIORITY))
      .optional(),
    relatedOrder: objectId.optional(),
    relatedPayment: objectId.optional(),
    relatedDelivery: objectId.optional(),
    relatedProduct: objectId.optional(),
    attachments: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          name: Joi.string().optional().allow(''),
          type: Joi.string().optional().allow(''),
        })
      )
      .optional(),
  }),
});

export const assignTicketSchema = Joi.object({
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({ assigneeId: objectId.required() }),
});

export const replyTicketSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    message: Joi.string().trim().min(1).max(5000).required(),
    attachments: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          name: Joi.string().optional().allow(''),
          type: Joi.string().optional().allow(''),
        })
      )
      .optional(),
  }),
});

export const updateTicketStatusSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid(...Object.values(SUPPORT_STATUS))
      .required(),
    priority: Joi.string()
      .valid(...Object.values(SUPPORT_PRIORITY))
      .optional(),
  }),
});

export const listTicketsSchema = Joi.object({
  query: Joi.object({
    status: Joi.string()
      .valid('all', ...Object.values(SUPPORT_STATUS))
      .optional(),
    priority: Joi.string()
      .valid('all', ...Object.values(SUPPORT_PRIORITY))
      .optional(),
    search: Joi.string().trim().max(100).optional().allow(''),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
});
