import { body } from 'express-validator';
import { commonValidations } from './validationRules.js';

/**
 * Register validation rules
 */
export const registerValidation = [
  commonValidations.name('name'),
  commonValidations.email('email'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any')
    .withMessage('Phone number must be valid'),
  commonValidations.password('password'),
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['vendor', 'delivery'])
    .withMessage('Role must be either vendor or delivery'),
];

/**
 * Login validation rules
 */
export const loginValidation = [
  commonValidations.email('email'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Change password validation rules
 */
export const changePasswordValidation = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required'),
  commonValidations.password('newPassword'),
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
];

export default {
  registerValidation,
  loginValidation,
  changePasswordValidation,
};
