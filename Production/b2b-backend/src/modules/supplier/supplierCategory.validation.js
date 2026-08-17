import Joi from 'joi';
import { SUPPLIER_CATEGORY_STATUS } from '../../constants/supplierCategoryStatus.js';

export const listSupplierCategoriesSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object({
    status: Joi.string()
      .valid('all', ...Object.values(SUPPLIER_CATEGORY_STATUS))
      .optional(),
  }),
});

export const createSupplierCategorySchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    categoryId: Joi.string().required(),
    status: Joi.string()
      .valid(...Object.values(SUPPLIER_CATEGORY_STATUS))
      .default(SUPPLIER_CATEGORY_STATUS.ACTIVE),
  }),
});

export const supplierCategoryIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
    mappingId: Joi.string().required(),
  }),
});

export const updateSupplierCategoryStatusSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
    mappingId: Joi.string().required(),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid(...Object.values(SUPPLIER_CATEGORY_STATUS))
      .required(),
  }),
});
