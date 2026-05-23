import Joi from 'joi';
import { ROLES } from '../../constants/roles.js';

export const registerSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    mobile: Joi.string().required(),
    role: Joi.string().valid(...Object.values(ROLES)).default(ROLES.B2B_CUSTOMER),
  }),
});

export const loginSchema = Joi.object({
  body: Joi.object({
    identifier: Joi.string().required(),
    password: Joi.string().required(),
  }),
});

export const otpSchema = Joi.object({
  body: Joi.object({
    identifier: Joi.string().required(),
  }),
});

export const verifyOtpSchema = Joi.object({
  body: Joi.object({
    identifier: Joi.string().required(),
    otp: Joi.string().required(),
  }),
});

export const verify2FASchema = Joi.object({
  body: Joi.object({
    userId: Joi.string().required(),
    code: Joi.string().length(6).required(),
  }),
});

export const enable2FAVerifySchema = Joi.object({
  body: Joi.object({
    code: Joi.string().length(6).required(),
  }),
});

export const changePasswordSchema = Joi.object({
  body: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(12).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
  }),
});