# Authentication & Authorization Flow

> **Complete guide to user authentication and authorization implementation**

---

## Table of Contents

- [Authentication Overview](#authentication-overview)
- [JWT Token Strategy](#jwt-token-strategy)
- [Login Flow](#login-flow)
- [Registration Flow](#registration-flow)
- [OTP-Based Authentication](#otp-based-authentication)
- [Token Refresh Flow](#token-refresh-flow)
- [Authorization (RBAC)](#authorization-rbac)
- [Session Management](#session-management)
- [Two-Factor Authentication](#two-factor-authentication)
- [Security Measures](#security-measures)

---

## Authentication Overview

### Authentication vs Authorization

**Authentication (AuthN):** *Who are you?*
- Verifies user identity
- JWT token-based
- Implemented in `auth.middleware.js`

**Authorization (AuthZ):** *What can you do?*
- Verifies user permissions
- Role-based access control (RBAC)
- Implemented in `role.middleware.js` and `permission.middleware.js`

---

## JWT Token Strategy

### Token Structure

**Access Token (Short-lived):**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "permissions": ["order:read", "cart:write"],
  "iat": 1684742400,
  "exp": 1685347200
}
```

**Expiry:** 7 days  
**Secret:** `process.env.JWT_SECRET`  
**Algorithm:** HS256 (HMAC-SHA256)

**Refresh Token (Long-lived):**
```json
{
  "id": "user123",
  "type": "refresh",
  "iat": 1684742400,
  "exp": 1687334400
}
```

**Expiry:** 30 days  
**Storage:** Redis + HTTP-only cookie (optional)

### Token Generation

**File:** `src/modules/auth/auth.service.js`

```javascript
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    permissions: user.permissions || []
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  const refreshToken = jwt.sign(
    { id: user._id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};
```

### Token Verification

**File:** `src/middlewares/auth.middleware.js`

```javascript
export const protect = async (req, res, next) => {
  try {
    // 1. Extract token from header
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AuthError('Not authorized - No token provided', 401));
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AuthError('User no longer exists', 401));
    }

    // 4. Check user status
    if (user.status !== 'ACTIVE') {
      return next(new AuthError('Account is not active', 403));
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AuthError('Token expired', 401));
    }
    return next(new AuthError('Invalid token', 401));
  }
};
```

---

## Login Flow

### Password-Based Login

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Flow Diagram:**
```
1. Client sends email + password
   ↓
2. Validate input (Joi schema)
   ↓
3. authController.login()
   ↓
4. authService.login(email, password)
   ↓
5. userRepository.findByEmail(email)
   ↓
6. Check if user exists
   ↓
7. bcrypt.compare(password, user.hashedPassword)
   ↓
8. If password invalid → Return 401
   ↓
9. Check user status (ACTIVE/SUSPENDED/PENDING)
   ↓
10. Generate JWT tokens (access + refresh)
   ↓
11. Store refresh token in Redis
    Key: "refresh_token:user123"
    Value: refreshToken
    TTL: 30 days
   ↓
12. Log audit event (user login)
   ↓
13. Return response:
    {
      "success": true,
      "token": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "user": {
        "id": "user123",
        "name": "John Doe",
        "email": "user@example.com",
        "role": "CUSTOMER"
      }
    }
```

**Implementation:**

```javascript
// auth.service.js
export const login = async (email, password) => {
  // 1. Find user
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AuthError('Invalid credentials', 401);
  }

  // 2. Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthError('Invalid credentials', 401);
  }

  // 3. Check status
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new AuthError('Account is not active', 403);
  }

  // 4. Generate tokens
  const { accessToken, refreshToken } = generateToken(user);

  // 5. Store refresh token in Redis
  await redisClient.setex(
    `refresh_token:${user._id}`,
    30 * 24 * 60 * 60, // 30 days
    refreshToken
  );

  // 6. Log audit event
  await auditService.log({
    userId: user._id,
    action: 'USER_LOGIN',
    ip: req.ip
  });

  return { accessToken, refreshToken, user };
};
```

---

## Registration Flow

**Endpoint:** `POST /api/v1/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "CUSTOMER"
}
```

**Flow:**
```
1. Client submits registration form
   ↓
2. Validate input (Joi schema)
   - Email format
   - Password strength (min 8 chars, uppercase, lowercase, number)
   - Name length
   ↓
3. Check if email already exists
   ↓
4. Hash password (bcrypt, 10 rounds)
   ↓
5. Create user document
   {
     name, email, hashedPassword,
     role: "CUSTOMER",
     status: "PENDING",
     createdAt: Date.now()
   }
   ↓
6. Generate verification OTP (optional)
   ↓
7. Queue email verification job
   ↓
8. Return response (without auto-login):
   {
     "success": true,
     "message": "Registration successful. Please verify email.",
     "userId": "user123"
   }
```

**Password Hashing:**

```javascript
import bcrypt from 'bcryptjs';

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};
```

---

## OTP-Based Authentication

**Use Cases:**
- Email verification
- Phone number verification
- Password reset
- Login without password

### OTP Generation

**File:** `src/modules/auth/auth.service.js`

```javascript
import otpGenerator from 'otp-generator';

export const generateOTP = async (userId, purpose) => {
  // 1. Generate 6-digit OTP
  const otp = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false
  });

  // 2. Store in Redis with 5-minute expiry
  const key = `otp:${userId}:${purpose}`;
  await redisClient.setex(key, 300, otp); // 5 minutes

  // 3. Return OTP (to send via email/SMS)
  return otp;
};
```

### OTP Verification

```javascript
export const verifyOTP = async (userId, otp, purpose) => {
  const key = `otp:${userId}:${purpose}`;
  const storedOTP = await redisClient.get(key);

  if (!storedOTP) {
    throw new AuthError('OTP expired or not found', 400);
  }

  if (storedOTP !== otp) {
    throw new AuthError('Invalid OTP', 400);
  }

  // Delete OTP after successful verification
  await redisClient.del(key);

  return true;
};
```

### OTP Login Flow

```
1. Client requests OTP
   POST /api/v1/auth/send-otp
   Body: { email: "user@example.com" }
   ↓
2. Find user by email
   ↓
3. Generate 6-digit OTP
   ↓
4. Store OTP in Redis (5 min expiry)
   ↓
5. Send OTP via email
   ↓
6. Return: { success: true, message: "OTP sent" }

7. Client submits OTP
   POST /api/v1/auth/verify-otp
   Body: { email: "user@example.com", otp: "123456" }
   ↓
8. Verify OTP from Redis
   ↓
9. If valid → Generate JWT tokens
   ↓
10. Return tokens + user data
```

---

## Token Refresh Flow

**Endpoint:** `POST /api/v1/auth/refresh-token`

**Purpose:** Get new access token without re-authentication

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Flow:**
```
1. Client sends refresh token
   ↓
2. Verify refresh token signature
   ↓
3. Decode token → Extract userId
   ↓
4. Check if refresh token exists in Redis
   Key: "refresh_token:user123"
   ↓
5. If not in Redis → Token revoked/expired
   ↓
6. Fetch user from database
   ↓
7. Generate new access token
   ↓
8. (Optional) Rotate refresh token for security
   - Generate new refresh token
   - Delete old refresh token from Redis
   - Store new refresh token
   ↓
9. Return new tokens:
   {
     "accessToken": "new_token...",
     "refreshToken": "new_refresh..." (if rotated)
   }
```

---

## Authorization (RBAC)

### Role Hierarchy

```
SuperAdmin (highest authority)
  ↓
  - Full system access
  - Can manage all users
  - Can toggle maintenance mode
  - Can access all admin panels

Admin
  ↓
  - Manage orders, products, inventory
  - View analytics and reports
  - Manage vendors and customers
  - Cannot manage other admins

Vendor
  ↓
  - Manage own products
  - View own orders
  - Manage own inventory
  - Cannot access admin panel

Customer (B2B/B2C)
  ↓
  - Place orders
  - View own orders
  - Manage cart and wishlist
  - Cannot access admin/vendor panels
```

### Role Middleware

**File:** `src/middlewares/role.middleware.js`

```javascript
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthError('Not authenticated', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new PermissionError(
          `Role ${req.user.role} not authorized to access this resource`,
          403
        )
      );
    }

    next();
  };
};
```

**Usage in Routes:**

```javascript
// Only admins and vendors can access
router.get(
  '/products',
  protect,
  authorize('ADMIN', 'VENDOR'),
  productController.getProducts
);

// Only SuperAdmin
router.post(
  '/admin/users',
  protect,
  authorize('SUPER_ADMIN'),
  adminController.createUser
);
```

### Permission-Based Authorization

**File:** `src/middlewares/permission.middleware.js`

```javascript
export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];

    if (!userPermissions.includes(requiredPermission)) {
      return next(
        new PermissionError(
          `Permission ${requiredPermission} required`,
          403
        )
      );
    }

    next();
  };
};
```

**Permission Format:**
```
<resource>:<action>

Examples:
- order:create
- order:read
- order:update
- order:delete
- product:create
- inventory:update
```

**Usage:**
```javascript
router.patch(
  '/orders/:id/status',
  protect,
  checkPermission('order:update'),
  orderController.updateStatus
);
```

---

## Session Management

### Redis-Based Sessions

**Purpose:** Track active sessions, enable logout, detect concurrent logins

**Session Storage:**
```javascript
// Store session
await redisClient.setex(
  `session:${userId}:${sessionId}`,
  7 * 24 * 60 * 60, // 7 days
  JSON.stringify({
    userId,
    deviceInfo: req.headers['user-agent'],
    ip: req.ip,
    loginAt: Date.now()
  })
);
```

**Session Validation:**
```javascript
// Check if session is valid
const session = await redisClient.get(`session:${userId}:${sessionId}`);
if (!session) {
  throw new AuthError('Session expired', 401);
}
```

**Logout (Invalidate Session):**
```javascript
// Delete session
await redisClient.del(`session:${userId}:${sessionId}`);

// Also delete refresh token
await redisClient.del(`refresh_token:${userId}`);
```

---

## Two-Factor Authentication (2FA)

### TOTP (Time-Based One-Time Password)

**File:** `src/services/twoFactorAuth.service.js`

```javascript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Generate 2FA secret
export const generateSecret = async (user) => {
  const secret = speakeasy.generateSecret({
    name: `B2B App (${user.email})`,
    length: 32
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Store secret in database (encrypted)
  await User.findByIdAndUpdate(user._id, {
    twoFactorSecret: secret.base32
  });

  return { secret: secret.base32, qrCode: qrCodeUrl };
};

// Verify 2FA token
export const verifyToken = async (user, token) => {
  return speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 2 // Allow 1 minute time drift
  });
};
```

### 2FA Login Flow

```
1. User logs in with password
   ↓
2. Password valid → Check if 2FA enabled
   ↓
3. If 2FA enabled:
   - Don't generate tokens yet
   - Return: { twoFactorRequired: true }
   ↓
4. Client prompts for 2FA code
   ↓
5. POST /api/v1/auth/verify-2fa
   Body: { userId, token }
   ↓
6. Verify TOTP token
   ↓
7. If valid → Generate JWT tokens
   ↓
8. Return tokens + user data
```

---

## Security Measures

### 1. Password Security

**Hashing:**
- Algorithm: bcrypt
- Salt rounds: 10
- Cost: ~100ms per hash (prevents brute force)

**Password Policy:**
```javascript
// src/utils/passwordPolicy.js
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  return {
    valid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber,
    errors: [
      password.length < minLength && 'Password must be at least 8 characters',
      !hasUpperCase && 'Must contain uppercase letter',
      !hasLowerCase && 'Must contain lowercase letter',
      !hasNumber && 'Must contain number'
    ].filter(Boolean)
  };
};
```

### 2. Token Security

**Practices:**
- Store JWT secret in environment variable
- Use strong secret (min 32 characters)
- Set appropriate expiry (short for access, long for refresh)
- Rotate refresh tokens on each use (optional)
- Store refresh tokens securely (Redis, not in JWT)

### 3. Rate Limiting

**Auth-specific rate limits:**
```javascript
// src/config/rateLimiter.js
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 failed attempts
  message: 'Too many authentication attempts',
  skipSuccessfulRequests: true // Only count failures
});
```

### 4. Account Lockout

**After 5 failed login attempts:**
```javascript
// Increment failed login counter
const key = `failed_login:${email}`;
const attempts = await redisClient.incr(key);
await redisClient.expire(key, 900); // 15 minutes

if (attempts >= 5) {
  throw new AuthError('Account temporarily locked', 429);
}

// On successful login, clear counter
await redisClient.del(key);
```

### 5. Session Monitoring

**Detect suspicious activity:**
- Multiple concurrent logins from different IPs
- Login from new device/location
- Rapid token refresh attempts

### 6. Audit Logging

**Log all auth events:**
```javascript
await auditService.log({
  userId,
  action: 'USER_LOGIN',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  success: true,
  timestamp: Date.now()
});
```

---

## Common Auth Scenarios

### Scenario 1: User Forgets Password

```
1. POST /api/v1/auth/forgot-password
   Body: { email }
   ↓
2. Generate password reset token (JWT)
   ↓
3. Store token in Redis (1 hour expiry)
   ↓
4. Send reset link via email
   ↓
5. User clicks link → GET /reset-password?token=xxx
   ↓
6. POST /api/v1/auth/reset-password
   Body: { token, newPassword }
   ↓
7. Verify token
   ↓
8. Hash new password
   ↓
9. Update user password
   ↓
10. Invalidate all existing sessions
```

### Scenario 2: Admin Suspends User

```
1. Admin updates user status to SUSPENDED
   ↓
2. Trigger event: USER_SUSPENDED
   ↓
3. Invalidate all user sessions:
   - Delete all refresh tokens
   - Add userId to blacklist
   ↓
4. User's next API request fails with 403
```

### Scenario 3: Token Expiry Handling

**Client-side strategy:**
```javascript
// Intercept 401 responses
if (response.status === 401) {
  // Try to refresh token
  const newToken = await refreshAccessToken(refreshToken);
  if (newToken) {
    // Retry original request
    return retryRequest(originalRequest, newToken);
  } else {
    // Redirect to login
    redirectToLogin();
  }
}
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
