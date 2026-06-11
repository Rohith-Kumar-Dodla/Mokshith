# Mokshith B2B Platform Backend - Phase 0

## Project Overview

This is the backend foundation for the Mokshith B2B Platform. Phase 0 establishes a production-ready backend infrastructure that all future phases will build upon.

**Phase 0 Scope:**
- Backend folder structure
- Express server setup
- MongoDB connection
- Environment configuration
- Global error handling
- Async error handling
- API versioning structure
- Logging system
- Security middleware
- Validation foundation
- Response standardization
- Health check API

**NOT Included in Phase 0:**
- Authentication
- Products
- Orders
- Business logic
- Database models

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication (future)
- **bcrypt** - Password hashing (future)
- **Multer** - File uploads (future)
- **Cloudinary** - Cloud storage (future)
- **Nodemailer** - Email service (future)
- **Express Validator** - Input validation
- **Morgan** - HTTP request logger
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Dotenv** - Environment variables
- **Cookie Parser** - Cookie parsing
- **Compression** - Response compression
- **Express Rate Limit** - Rate limiting

## Folder Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # MongoDB connection
│   │   └── environment.js # Environment config
│   ├── controllers/      # Route controllers (future)
│   ├── services/         # Business logic (future)
│   ├── models/           # Mongoose models (future)
│   ├── routes/           # API routes
│   │   ├── healthRoutes.js
│   │   └── index.js
│   ├── middlewares/      # Custom middleware
│   │   ├── errorMiddleware.js
│   │   ├── notFoundMiddleware.js
│   │   └── security/
│   │       ├── index.js
│   │       ├── rateLimiter.js
│   │       └── sanitization.js
│   ├── validators/       # Input validation
│   │   ├── index.js
│   │   └── validationRules.js
│   ├── utils/            # Utility functions
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   └── logger.js
│   ├── constants/        # Application constants
│   │   ├── httpStatus.js
│   │   ├── appConstants.js
│   │   └── roleConstants.js
│   ├── docs/             # Documentation (future)
│   ├── logs/             # Log files
│   └── uploads/          # File uploads (future)
├── app.js                # Express app configuration
├── server.js             # Server startup with graceful shutdown
├── package.json          # Dependencies
├── .env.example          # Environment variables template
└── .gitignore           # Git ignore rules
```

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file by copying `.env.example`:
```bash
copy .env.example .env
```

4. Configure your environment variables in `.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/mokshith-b2b
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET=your_cloudinary_api_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Root Endpoint
```
GET /
```
Response:
```json
{
  "success": true,
  "message": "Mokshith B2B Backend API Running"
}
```

### Health Check
```
GET /api/v1/health
```
Response:
```json
{
  "success": true,
  "status": "UP",
  "environment": "development",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## Error Handling

The application includes comprehensive error handling:
- Global error middleware
- Async error handling utility
- 404 Not Found middleware
- Consistent error response format
- Error logging

## Security Features

- Helmet for security headers
- CORS configuration
- Rate limiting
- Input sanitization (structure ready)
- Environment-based configuration

## Logging

- Morgan for HTTP request logging
- Custom logger utility
- Server startup logging
- Database connection logging
- Error logging

## API Versioning

All API routes are versioned under `/api/v1`:
```
/api/v1/health
/api/v1/auth (future)
/api/v1/products (future)
/api/v1/orders (future)
/api/v1/vendors (future)
```

## Graceful Shutdown

The server handles graceful shutdown for:
- SIGTERM signals
- SIGINT signals
- Unhandled promise rejections
- Uncaught exceptions
- Database connection cleanup

## Development Guidelines

### Code Style
- Use ES Modules (import/export)
- Follow clean architecture principles
- Maintain separation of concerns
- Write reusable utilities
- Use async/await for async operations

### File Naming
- Use camelCase for files
- Use PascalCase for classes
- Use kebab-case for routes where applicable

### Error Handling
- Use the `asyncHandler` utility for async route handlers
- Use the `ApiError` class for custom errors
- Always validate input before processing
- Return consistent error responses

### Validation
- Use express-validator for input validation
- Define reusable validation rules
- Use the `validate` middleware for validation
- Return clear validation error messages

## Platform Roles

The platform supports the following roles:
- Super Admin
- Admin
- Vendor
- Delivery Partner

Role hierarchy is defined in `src/constants/roleConstants.js`.

## Future Phases

Phase 0 establishes the foundation. Future phases will include:
- Authentication & Authorization
- User Management
- Product Management
- Order Management
- Vendor Management
- Delivery Partner Management
- File Uploads
- Email Notifications
- Payment Integration
- Analytics & Reporting

## Testing Phase 0

Verify the following:
- ✓ Server starts successfully
- ✓ MongoDB connection works
- ✓ Health API works
- ✓ Root API works
- ✓ Error middleware works
- ✓ Unknown routes return 404
- ✓ Environment variables load correctly
- ✓ Security middleware active
- ✓ Logging works
- ✓ Graceful shutdown works

## License

ISC
