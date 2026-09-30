import Joi from 'joi';

export const markAsReadSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

export const listNotificationsSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    read: Joi.string().valid('true', 'false'),
    category: Joi.string().uppercase().max(30),
    eventType: Joi.string().uppercase().max(80),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
});
