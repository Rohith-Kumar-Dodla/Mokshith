import Joi from 'joi';

export const createProductSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().required(),
    description: Joi.string().optional(),
    price: Joi.number().min(1).required(),
    stock: Joi.number().min(0).optional(),
    categoryId: Joi.string().required(),
    vendorId: Joi.string().optional(),
    companyId: Joi.string().optional(),
    moq: Joi.number().min(1).optional(),
    isActive: Joi.any().optional(),
    image: Joi.any().optional(),
    imageUrl: Joi.string().optional(),
    bulkPricing: Joi.array().items(
      Joi.object({
        minQuantity: Joi.number().required(),
        price: Joi.number().required()
      })
    ).optional(),
    variants: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        value: Joi.string().required(),
        additionalPrice: Joi.number().optional(),
        stock: Joi.number().optional()
      })
    ).optional()
  }),
});

export const updateProductSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().optional(),
    description: Joi.string().allow('').optional(),
    price: Joi.number().min(0).optional(),
    stock: Joi.number().min(0).optional(),
    categoryId: Joi.string().optional(),
    moq: Joi.number().min(1).optional(),
    isActive: Joi.any().optional(),
    image: Joi.any().optional(),
    imageUrl: Joi.string().allow('').optional(),
    bulkPricing: Joi.array().items(
      Joi.object({
        minQuantity: Joi.number().required(),
        price: Joi.number().required()
      })
    ).optional(),
    variants: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        value: Joi.string().required(),
        additionalPrice: Joi.number().optional(),
        stock: Joi.number().optional()
      })
    ).optional()
  }),
});