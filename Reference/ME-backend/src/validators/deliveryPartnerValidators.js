import { body } from 'express-validator';
import { commonValidations } from './validationRules.js';

/**
 * Delivery partner profile creation validation rules
 */
export const createDeliveryPartnerProfileValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  commonValidations.phone('phone'),
  
  commonValidations.email('email'),
  
  body('vehicleType')
    .trim()
    .notEmpty()
    .withMessage('Vehicle type is required')
    .isIn(['bike', 'scooter', 'car', 'van', 'truck'])
    .withMessage('Vehicle type must be one of: bike, scooter, car, van, truck'),
  
  body('vehicleNumber')
    .trim()
    .notEmpty()
    .withMessage('Vehicle number is required')
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/)
    .withMessage('Please provide a valid vehicle number (e.g., MH12AB1234)'),
  
  body('drivingLicense')
    .trim()
    .notEmpty()
    .withMessage('Driving license number is required')
    .matches(/^[A-Z]{2}[0-9]{13}$/)
    .withMessage('Please provide a valid driving license number (e.g., MH1420150012345)'),
  
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
 * Delivery partner profile update validation rules
 */
export const updateDeliveryPartnerProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
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
  
  body('vehicleType')
    .optional()
    .trim()
    .isIn(['bike', 'scooter', 'car', 'van', 'truck'])
    .withMessage('Vehicle type must be one of: bike, scooter, car, van, truck'),
  
  body('vehicleNumber')
    .optional()
    .trim()
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/)
    .withMessage('Please provide a valid vehicle number (e.g., MH12AB1234)'),
  
  body('drivingLicense')
    .optional()
    .trim()
    .matches(/^[A-Z]{2}[0-9]{13}$/)
    .withMessage('Please provide a valid driving license number (e.g., MH1420150012345)'),
  
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
  createDeliveryPartnerProfileValidation,
  updateDeliveryPartnerProfileValidation,
};
