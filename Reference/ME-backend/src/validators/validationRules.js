import { body, param, query } from 'express-validator';

// Common validation rules
export const commonValidations = {
  // ID validation
  id: (fieldName = 'id') =>
    param(fieldName)
      .isMongoId()
      .withMessage(`${fieldName} must be a valid MongoDB ID`),

  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  // Email validation
  email: (fieldName = 'email') =>
    body(fieldName)
      .isEmail()
      .withMessage(`${fieldName} must be a valid email address`)
      .normalizeEmail(),

  // Password validation
  password: (fieldName = 'password') =>
    body(fieldName)
      .isLength({ min: 8 })
      .withMessage(`${fieldName} must be at least 8 characters long`)
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)
      .withMessage(
        `${fieldName} must contain at least one uppercase letter, one lowercase letter, and one number`
      ),

  // Name validation
  name: (fieldName = 'name') =>
    body(fieldName)
      .trim()
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isLength({ min: 2, max: 100 })
      .withMessage(`${fieldName} must be between 2 and 100 characters`),

  // Phone validation
  phone: (fieldName = 'phone') =>
    body(fieldName)
      .optional()
      .isMobilePhone('any')
      .withMessage(`${fieldName} must be a valid phone number`),
};

export default commonValidations;
