import Joi from 'joi';
import { ROLES } from '../../constants/roles.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import {
  isAuthStrictMode,
  AUTH_TESTING_PASSWORD_MIN_LENGTH,
  AUTH_STRICT_PASSWORD_MIN_LENGTH,
} from '../../config/authStrictMode.js';

const strictPasswordField = () => Joi.string()
  .min(AUTH_STRICT_PASSWORD_MIN_LENGTH)
  .required()
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.min': `Password must be at least ${AUTH_STRICT_PASSWORD_MIN_LENGTH} characters long`,
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  });

const relaxedPasswordField = () => Joi.string()
  .min(AUTH_TESTING_PASSWORD_MIN_LENGTH)
  .required()
  .messages({
    'string.min': `Password must be at least ${AUTH_TESTING_PASSWORD_MIN_LENGTH} characters long`,
  });

const passwordField = () => (isAuthStrictMode() ? strictPasswordField() : relaxedPasswordField());

export const updateUserRoleSchema = Joi.object({
  body: Joi.object({
    role: Joi.string()
      .valid(...Object.values(ROLES))
      .required(),
  }),
});

export const createAdminSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: passwordField(),
    employeeId: Joi.string().trim().max(50).optional().allow(''),
    status: Joi.string()
      .valid(...Object.values(USER_STATUS))
      .default(USER_STATUS.ACTIVE),
    permissions: Joi.array().items(Joi.string()).optional(),
  }),
});

export const updateAdminSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    password: passwordField().optional(),
    employeeId: Joi.string().trim().max(50).optional().allow(''),
    status: Joi.string().valid(...Object.values(USER_STATUS)).optional(),
    permissions: Joi.array().items(Joi.string()).optional(),
  }).min(1),
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

export const createDeliveryAgentSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: passwordField(),
    vehicleType: Joi.string()
      .valid('TWO_WHEELER', 'THREE_WHEELER', 'FOUR_WHEELER', 'HEAVY_VEHICLE')
      .required(),
    vehicleNumber: Joi.string().trim().max(20).required(),
    serviceArea: Joi.string().trim().min(2).max(200).required(),
    status: Joi.string()
      .valid(...Object.values(USER_STATUS))
      .default(USER_STATUS.ACTIVE),
  }),
});

export const updateDeliveryAgentSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    password: passwordField().optional(),
    vehicleType: Joi.string()
      .valid('TWO_WHEELER', 'THREE_WHEELER', 'FOUR_WHEELER', 'HEAVY_VEHICLE')
      .optional(),
    vehicleNumber: Joi.string().trim().max(20).optional(),
    serviceArea: Joi.string().trim().min(2).max(200).optional(),
    status: Joi.string().valid(...Object.values(USER_STATUS)).optional(),
  }).min(1),
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

export const listStaffSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100).optional().allow(''),
    status: Joi.string().valid('all', ...Object.values(USER_STATUS)).optional(),
  }),
});
