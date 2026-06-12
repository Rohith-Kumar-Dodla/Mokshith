import Joi from 'joi';

export const updateUserSettingsSchema = Joi.object({
  body: Joi.object({
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      push: Joi.boolean().optional(),
      orders: Joi.boolean().optional(),
    }).optional(),
    preferences: Joi.object({
      language: Joi.string().valid('en', 'hi', 'te').optional(),
      theme: Joi.string().valid('light', 'dark', 'system').optional(),
      dashboardLayout: Joi.string().valid('default', 'compact', 'detailed').optional(),
    }).optional(),
    businessDetails: Joi.string().trim().max(2000).allow('').optional(),
  }).min(1),
});
