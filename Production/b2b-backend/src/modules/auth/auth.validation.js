import Joi from 'joi';
import { ROLES } from '../../constants/roles.js';
import {
  isAuthStrictMode,
  AUTH_TESTING_PASSWORD_MIN_LENGTH,
  AUTH_STRICT_PASSWORD_MIN_LENGTH,
} from '../../config/authStrictMode.js';

// RE-ENABLE BEFORE PRODUCTION: strict Joi rules used when AUTH_STRICT_MODE=true
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

export const getRegisterSchema = () => Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).required().messages({
      'string.min': 'Name must be at least 2 characters long',
    }),
    email: Joi.string().email().required(),
    password: passwordField(),
    mobile: Joi.string().required(),
    role: Joi.string().valid(...Object.values(ROLES)).default(ROLES.B2B_CUSTOMER),
  }),
});

const loginIdentifierSchema = Joi.string().custom((value, helpers) => {
  const isEmail = Joi.string().email().validate(value).error === undefined;
  const isMobile = /^[0-9]{10}$/.test(value);

  if (isEmail || isMobile) {
    return value;
  }

  return helpers.error('any.invalid');
}).messages({
  'any.invalid': 'Login identifier must be a valid email or 10-digit mobile number',
});

export const getLoginSchema = () => Joi.object({
  body: Joi.object({
    mobile: loginIdentifierSchema.optional(),
    identifier: loginIdentifierSchema.optional(),
    password: Joi.string().required(),
  }).or('mobile', 'identifier'),
});

export const getVerify2FASchema = () => Joi.object({
  body: Joi.object({
    userId: Joi.string().required(),
    code: Joi.string().length(6).required(),
  }),
});

export const getEnable2FAVerifySchema = () => Joi.object({
  body: Joi.object({
    code: Joi.string().length(6).required(),
  }),
});

export const getChangePasswordSchema = () => Joi.object({
  body: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: passwordField(),
  }),
});

export const getForgotPasswordSchema = () => Joi.object({
  body: Joi.object({
    identifier: loginIdentifierSchema.required(),
  }),
});

export const getResetPasswordSchema = () => Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
    newPassword: passwordField(),
  }),
});

// Backward-compatible exports (resolved lazily via validate middleware factories)
export const registerSchema = getRegisterSchema;
export const loginSchema = getLoginSchema;
export const verify2FASchema = getVerify2FASchema;
export const enable2FAVerifySchema = getEnable2FAVerifySchema;
export const changePasswordSchema = getChangePasswordSchema;
export const forgotPasswordSchema = getForgotPasswordSchema;
export const resetPasswordSchema = getResetPasswordSchema;
