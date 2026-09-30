import Joi from 'joi';

const date = Joi.string().isoDate();
export const transactionQuerySchema = Joi.object({
  query: Joi.object({
    startDate: date,
    endDate: date,
    method: Joi.string().max(30),
    status: Joi.string().max(30),
    customer: Joi.string().max(120),
    type: Joi.string().valid('customer', 'supplier').default('customer'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
});

export const documentQuerySchema = Joi.object({
  query: Joi.object({
    search: Joi.string().allow('').max(120),
    type: Joi.string().max(40),
    expiry: Joi.string().valid('all', 'none', 'active', 'expiring', 'expired').default('all'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
});

export const internalStaffSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().trim().min(7).max(20).required(),
    internalRole: Joi.string().valid('EXECUTIVE', 'SWEEPER', 'CLEANING_STAFF', 'ACCOUNTANT', 'STORE_STAFF', 'WAREHOUSE_STAFF', 'SECURITY', 'OTHER').required(),
    department: Joi.string().trim().max(100).allow(''),
    joiningDate: Joi.date().iso().allow(null, ''),
    notes: Joi.string().trim().max(500).allow(''),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
  }),
});

export const internalStaffUpdateSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    email: Joi.string().email(),
    mobile: Joi.string().trim().min(7).max(20),
    internalRole: Joi.string().valid('EXECUTIVE', 'SWEEPER', 'CLEANING_STAFF', 'ACCOUNTANT', 'STORE_STAFF', 'WAREHOUSE_STAFF', 'SECURITY', 'OTHER'),
    department: Joi.string().trim().max(100).allow(''),
    joiningDate: Joi.date().iso().allow(null, ''),
    notes: Joi.string().trim().max(500).allow(''),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  }).min(1),
});

export const reportQuerySchema = Joi.object({
  query: Joi.object({
    startDate: date,
    endDate: date,
    product: Joi.string().hex().length(24),
    supplier: Joi.string().hex().length(24),
    paymentMethod: Joi.string().max(30),
    orderStatus: Joi.string().max(40),
  }),
});
