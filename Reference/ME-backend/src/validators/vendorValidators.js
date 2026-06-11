import { body } from 'express-validator';
import { commonValidations } from './validationRules.js';

/**
 * Vendor profile creation validation rules
 */
export const createVendorProfileValidation = [
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Business name must be between 2 and 200 characters'),
  
  body('ownerName')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Owner name must be between 2 and 100 characters'),
  
  commonValidations.phone('phone'),
  
  commonValidations.email('email'),
  
  body('gstNumber')
    .trim()
    .notEmpty()
    .withMessage('GST number is required')
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please provide a valid GST number (e.g., 22AAAAA0000A1Z5)'),
  
  body('businessType')
    .trim()
    .notEmpty()
    .withMessage('Business type is required')
    .isIn(['sole_proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd'])
    .withMessage('Business type must be one of: sole_proprietorship, partnership, llp, pvt_ltd, public_ltd'),
  
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  
  body('country')
    .trim()
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),
  
  body('pincode')
    .trim()
    .notEmpty()
    .withMessage('Pincode is required')
    .matches(/^[0-9]{6}$/)
    .withMessage('Please provide a valid 6-digit pincode'),
  
  body('profileImage')
    .optional()
    .isURL()
    .withMessage('Profile image must be a valid URL'),
];

/**
 * Vendor profile update validation rules
 */
export const updateVendorProfileValidation = [
  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Business name must be between 2 and 200 characters'),
  
  body('ownerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Owner name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Phone number must be valid'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  
  body('gstNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please provide a valid GST number (e.g., 22AAAAA0000A1Z5)'),
  
  body('businessType')
    .optional()
    .trim()
    .isIn(['sole_proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd'])
    .withMessage('Business type must be one of: sole_proprietorship, partnership, llp, pvt_ltd, public_ltd'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  
  body('city')
    .optional()
    .trim(),
  
  body('state')
    .optional()
    .trim(),
  
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),
  
  body('pincode')
    .optional()
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('Please provide a valid 6-digit pincode'),
  
  body('profileImage')
    .optional()
    .isURL()
    .withMessage('Profile image must be a valid URL'),
];

export default {
  createVendorProfileValidation,
  updateVendorProfileValidation,
};
