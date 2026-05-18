# API Design Patterns

> **RESTful API design principles, response formatting, and best practices**

---

## Table of Contents

- [RESTful Design Principles](#restful-design-principles)
- [Resource Naming](#resource-naming)
- [HTTP Methods & Status Codes](#http-methods--status-codes)
- [Response Formatting](#response-formatting)
- [Pagination](#pagination)
- [Filtering & Sorting](#filtering--sorting)
- [API Versioning](#api-versioning)

---

## RESTful Design Principles

### Resource-Based URLs

```
✅ Good - Resource-based
GET    /api/v1/products
POST   /api/v1/products
GET    /api/v1/products/:id
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id

❌ Bad - Action-based
GET    /api/v1/getProducts
POST   /api/v1/createProduct
POST   /api/v1/updateProduct
POST   /api/v1/deleteProduct
```

### Nested Resources

```javascript
// Get orders for a specific user
GET /api/v1/users/:userId/orders

// Get payments for a specific order
GET /api/v1/orders/:orderId/payments

// Get reviews for a specific product
GET /api/v1/products/:productId/reviews
```

**Implementation:**

```javascript
// User orders
router.get('/users/:userId/orders', authenticate, getUserOrders);

export const getUserOrders = async (req, res) => {
  const { userId } = req.params;

  // Authorization: Users can only see their own orders
  if (req.user._id.toString() !== userId && req.user.role !== 'ADMIN') {
    throw new PermissionError();
  }

  const orders = await Order.find({ userId }).populate('items.productId');

  res.json({
    success: true,
    data: orders,
    count: orders.length
  });
};
```

---

## Resource Naming

### Naming Conventions

```
✅ Use plural nouns for collections
/products
/orders
/users

❌ Don't use verbs
/getProducts
/createOrder

✅ Use lowercase with hyphens for multi-word resources
/product-categories
/shipping-addresses

❌ Don't use underscores or camelCase in URLs
/product_categories
/shippingAddresses

✅ Use IDs in path for specific resources
/products/:id
/orders/:orderId

❌ Don't use query params for resource IDs
/products?id=123
```

### Hierarchy

```
/api/v1/products                    # All products
/api/v1/products/:id                # Specific product
/api/v1/products/:id/reviews        # Reviews for product
/api/v1/products/:id/reviews/:reviewId  # Specific review

/api/v1/orders                      # All orders
/api/v1/orders/:id                  # Specific order
/api/v1/orders/:id/items            # Items in order
/api/v1/orders/:id/payments         # Payments for order
```

---

## HTTP Methods & Status Codes

### HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource(s) | ✅ | ✅ |
| POST | Create new resource | ❌ | ❌ |
| PUT | Update entire resource | ✅ | ❌ |
| PATCH | Partially update resource | ❌ | ❌ |
| DELETE | Remove resource | ✅ | ❌ |

### Status Codes

**Success (2xx):**

```javascript
// 200 OK - Successful GET, PUT, PATCH, or DELETE
res.status(200).json({ success: true, data: user });

// 201 Created - Successful POST
res.status(201).json({ success: true, data: newProduct });

// 204 No Content - Successful DELETE with no response body
res.status(204).send();
```

**Client Errors (4xx):**

```javascript
// 400 Bad Request - Invalid input
res.status(400).json({ success: false, message: 'Invalid email format' });

// 401 Unauthorized - Not authenticated
res.status(401).json({ success: false, message: 'Authentication required' });

// 403 Forbidden - Not authorized
res.status(403).json({ success: false, message: 'Insufficient permissions' });

// 404 Not Found - Resource doesn't exist
res.status(404).json({ success: false, message: 'Product not found' });

// 409 Conflict - Duplicate resource
res.status(409).json({ success: false, message: 'Email already exists' });

// 422 Unprocessable Entity - Validation failed
res.status(422).json({ success: false, errors: validationErrors });

// 429 Too Many Requests - Rate limit exceeded
res.status(429).json({ success: false, message: 'Too many requests' });
```

**Server Errors (5xx):**

```javascript
// 500 Internal Server Error
res.status(500).json({ success: false, message: 'Internal server error' });

// 502 Bad Gateway - External service failed
res.status(502).json({ success: false, message: 'Payment gateway error' });

// 503 Service Unavailable - Temporary downtime
res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
```

---

## Response Formatting

### Successful Response

```javascript
// Single resource
{
  "success": true,
  "data": {
    "id": "prod_123",
    "name": "Laptop",
    "price": 50000,
    "category": "Electronics"
  }
}

// Collection
{
  "success": true,
  "data": [
    { "id": "prod_123", "name": "Laptop" },
    { "id": "prod_456", "name": "Mouse" }
  ],
  "count": 2
}

// With pagination
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8,
    "hasMore": true
  }
}
```

### Error Response

```javascript
// Simple error
{
  "success": false,
  "message": "Product not found",
  "statusCode": 404
}

// Validation errors
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 422,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### Response Wrapper

**File:** `src/utils/responseFormatter.js`

```javascript
export const successResponse = (data, message = 'Success', meta = {}) => {
  return {
    success: true,
    message,
    data,
    ...meta
  };
};

export const errorResponse = (message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    statusCode
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

export const paginatedResponse = (data, pagination) => {
  return {
    success: true,
    data,
    pagination: {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasMore: pagination.page < Math.ceil(pagination.total / pagination.limit)
    }
  };
};
```

**Usage:**

```javascript
import { successResponse, paginatedResponse } from '../utils/responseFormatter.js';

// Simple success
res.json(successResponse(product));

// With message
res.json(successResponse(order, 'Order created successfully'));

// Paginated
res.json(paginatedResponse(products, { total: 150, page: 2, limit: 20 }));
```

---

## Pagination

### Offset-Based Pagination

```javascript
// Query: GET /api/v1/products?page=2&limit=20

export const getProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find()
      .skip(skip)
      .limit(limit)
      .lean(),

    Product.countDocuments()
  ]);

  res.json(paginatedResponse(products, { total, page, limit }));
};
```

### Cursor-Based Pagination

```javascript
// Query: GET /api/v1/orders?cursor=order_123&limit=20

export const getOrders = async (req, res) => {
  const { cursor, limit = 20 } = req.query;

  const query = cursor ? { _id: { $gt: cursor } } : {};

  const orders = await Order.find(query)
    .limit(parseInt(limit) + 1)
    .sort({ _id: 1 })
    .lean();

  const hasMore = orders.length > limit;
  const data = hasMore ? orders.slice(0, -1) : orders;
  const nextCursor = hasMore ? data[data.length - 1]._id : null;

  res.json({
    success: true,
    data,
    pagination: {
      cursor: nextCursor,
      hasMore
    }
  });
};
```

---

## Filtering & Sorting

### Filtering

```javascript
// Query: GET /api/v1/products?category=Electronics&minPrice=10000&maxPrice=50000

export const getProducts = async (req, res) => {
  const { category, minPrice, maxPrice, inStock } = req.query;

  const filter = {};

  if (category) {
    filter.category = category;
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseInt(minPrice);
    if (maxPrice) filter.price.$lte = parseInt(maxPrice);
  }

  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  const products = await Product.find(filter).lean();

  res.json(successResponse(products));
};
```

### Sorting

```javascript
// Query: GET /api/v1/products?sortBy=price&order=desc

export const getProducts = async (req, res) => {
  const { sortBy = 'createdAt', order = 'desc' } = req.query;

  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObject = { [sortBy]: sortOrder };

  const products = await Product.find()
    .sort(sortObject)
    .lean();

  res.json(successResponse(products));
};
```

### Advanced Filtering

```javascript
// Query: GET /api/v1/products?search=laptop&category=Electronics&minPrice=10000

export const searchProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

  const filter = {};

  // Text search
  if (search) {
    filter.$text = { $search: search };
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseInt(minPrice);
    if (maxPrice) filter.price.$lte = parseInt(maxPrice);
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .skip(skip)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter)
  ]);

  res.json(paginatedResponse(products, { total, page, limit }));
};
```

---

## API Versioning

### URL Versioning (Recommended)

```javascript
// Current version
/api/v1/products

// New version
/api/v2/products
```

**Implementation:**

```javascript
// server.js
import v1Routes from './routes/v1/index.js';
import v2Routes from './routes/v2/index.js';

app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);
```

### Header Versioning (Alternative)

```javascript
// Request header: API-Version: 2

app.use((req, res, next) => {
  const version = req.headers['api-version'] || '1';

  if (version === '2') {
    require('./routes/v2')(req, res, next);
  } else {
    require('./routes/v1')(req, res, next);
  }
});
```

### Deprecation Strategy

```javascript
// Deprecate v1 endpoint
router.get('/products', (req, res, next) => {
  res.set('X-API-Deprecated', 'This endpoint is deprecated. Use /api/v2/products instead.');
  res.set('X-API-Deprecation-Date', '2026-12-31');
  res.set('X-API-Sunset-Date', '2027-06-30');

  next();
}, getProducts);
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
