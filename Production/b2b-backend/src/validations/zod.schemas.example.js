/**
 * Zod Runtime Validation Schemas
 * 
 * Example implementation for runtime type safety
 * Install: npm install zod
 * 
 * Usage:
 * import { userRegistrationSchema } from './validations/zod.schemas.js';
 * const validated = userRegistrationSchema.parse(requestBody);
 */

import { z } from 'zod';

// ============ USER SCHEMAS ============

export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number (10 digits, starts with 6-9)'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  role: z.enum(['B2B_CUSTOMER', 'B2C_CUSTOMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN']).optional(),
  businessName: z.string().optional(),
  gstNumber: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/).optional(),
});

export const userLoginSchema = z.object({
  identifier: z.string().min(1, 'Email or mobile is required'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string()
    .min(12, 'New password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/\d/, 'Must contain number')
    .regex(/[!@#$%^&*]/, 'Must contain special character'),
}).refine((data) => data.oldPassword !== data.newPassword, {
  message: 'New password must be different from old password',
  path: ['newPassword'],
});

export const twoFactorSetupSchema = z.object({
  token: z.string().regex(/^\d{6}$/, 'Token must be 6 digits'),
});

// ============ PRODUCT SCHEMAS ============

export const productCreateSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  sku: z.string().min(3).max(50),
  price: z.number().positive('Price must be positive'),
  moq: z.number().int().positive('MOQ must be a positive integer'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  images: z.array(z.string().url()).max(10, 'Maximum 10 images allowed').optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sortBy: z.enum(['price', 'name', 'createdAt', 'rating']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============ ORDER SCHEMAS ============

export const orderItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
});

export const shippingAddressSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/).optional(),
  street: z.string().min(5).max(200),
  landmark: z.string().max(100).optional(),
  city: z.string().min(2).max(50),
  state: z.string().min(2).max(50),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  country: z.string().default('India'),
});

export const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: shippingAddressSchema,
  notes: z.string().max(500).optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ]),
  notes: z.string().max(500).optional(),
  trackingNumber: z.string().max(50).optional(),
  carrier: z.string().max(50).optional(),
});

// ============ PAYMENT SCHEMAS ============

export const paymentCreateOrderSchema = z.object({
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.enum(['INR', 'USD']).default('INR'),
});

export const paymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
});

export const refundSchema = z.object({
  paymentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID'),
  amount: z.number().int().positive('Refund amount must be positive'),
  reason: z.string().min(10, 'Refund reason must be at least 10 characters').max(500),
});

// ============ INVENTORY SCHEMAS ============

export const inventoryUpdateSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  quantity: z.number().int('Quantity must be an integer'),
  type: z.enum(['ADD', 'SUBTRACT', 'SET'], {
    errorMap: () => ({ message: 'Type must be ADD, SUBTRACT, or SET' }),
  }),
  reason: z.string().min(5).max(200),
});

// ============ FILE UPLOAD SCHEMAS ============

export const fileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string().max(255),
  encoding: z.string(),
  mimetype: z.string().refine((mime) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    return allowedTypes.includes(mime);
  }, 'Invalid file type'),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
});

// ============ PAGINATION SCHEMAS ============

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============ QUERY FILTERS ============

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['endDate'],
});

// ============ WEBHOOK SCHEMAS ============

export const razorpayWebhookSchema = z.object({
  entity: z.literal('event'),
  account_id: z.string(),
  event: z.string(),
  contains: z.array(z.string()),
  payload: z.object({
    payment: z.object({
      entity: z.record(z.any()),
    }).optional(),
    order: z.object({
      entity: z.record(z.any()),
    }).optional(),
  }),
  created_at: z.number(),
});

// ============ HELPER FUNCTIONS ============

/**
 * Validate data against schema and return either validated data or error
 */
export function validateData(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    throw error;
  }
}

/**
 * Express middleware for validating request body
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = validateData(schema, req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.errors,
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Express middleware for validating query parameters
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = validateData(schema, req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.errors,
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}

/**
 * Express middleware for validating URL params
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const result = validateData(schema, req.params);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL parameters',
        errors: result.errors,
      });
    }
    req.validatedParams = result.data;
    next();
  };
}

// ============ EXAMPLE USAGE ============

/*
// In your route file:
import { 
  userRegistrationSchema, 
  validateBody, 
  productCreateSchema,
  validateQuery,
  productQuerySchema 
} from './validations/zod.schemas.js';

// Example 1: Manual validation
router.post('/register', async (req, res) => {
  const result = validateData(userRegistrationSchema, req.body);
  
  if (!result.success) {
    return res.status(400).json({ errors: result.errors });
  }
  
  // Use validated data
  const user = await createUser(result.data);
  res.json({ user });
});

// Example 2: Using middleware
router.post('/register', 
  validateBody(userRegistrationSchema), 
  async (req, res) => {
    // req.validatedBody contains validated data
    const user = await createUser(req.validatedBody);
    res.json({ user });
  }
);

// Example 3: Query parameter validation
router.get('/products',
  validateQuery(productQuerySchema),
  async (req, res) => {
    // req.validatedQuery contains parsed & validated query params
    const products = await getProducts(req.validatedQuery);
    res.json({ products });
  }
);

// Example 4: Complex validation with refinements
const orderWithValidationSchema = orderCreateSchema.refine(
  async (data) => {
    // Check stock availability
    for (const item of data.items) {
      const product = await Product.findById(item.productId);
      if (product.stock < item.quantity) {
        return false;
      }
    }
    return true;
  },
  { message: 'Insufficient stock for one or more items' }
);
*/

export default {
  // User schemas
  userRegistrationSchema,
  userLoginSchema,
  passwordChangeSchema,
  twoFactorSetupSchema,

  // Product schemas
  productCreateSchema,
  productUpdateSchema,
  productQuerySchema,

  // Order schemas
  orderCreateSchema,
  orderStatusUpdateSchema,
  shippingAddressSchema,

  // Payment schemas
  paymentCreateOrderSchema,
  paymentVerifySchema,
  refundSchema,

  // Inventory schemas
  inventoryUpdateSchema,

  // Utility schemas
  paginationSchema,
  dateRangeSchema,
  fileUploadSchema,

  // Webhook schemas
  razorpayWebhookSchema,

  // Helper functions
  validateData,
  validateBody,
  validateQuery,
  validateParams,
};
