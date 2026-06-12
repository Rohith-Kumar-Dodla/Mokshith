import Joi from 'joi';

export const createCategorySchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().required(),
    description: Joi.string().trim().optional().allow(''),
    parentId: Joi.string().optional().allow(null, ''),
    isActive: Joi.any().optional(),
    image: Joi.any().optional(),
    imageUrl: Joi.string().optional().allow(''),
  }),
});

export const updateCategorySchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().optional(),
    description: Joi.string().trim().optional().allow(''),
    parentId: Joi.string().optional().allow(null, ''),
    isActive: Joi.any().optional(),
    image: Joi.any().optional(),
    imageUrl: Joi.string().optional().allow(''),
  }),
});