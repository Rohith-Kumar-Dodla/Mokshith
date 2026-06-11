# Phase 1 Authentication & Authorization - Postman Testing Checklist

## Base URL
```
http://localhost:5000/api/v1/auth
```

## Prerequisites
1. MongoDB must be running
2. Server must be started (`npm run dev`)
3. Seed data must be run (`npm run seed`)

---

## TEST 1: Register Vendor
**Method:** POST  
**Endpoint:** `/register`  
**Description:** Register a new vendor user

**Request Body:**
```json
{
  "name": "Test Vendor",
  "email": "vendor@test.com",
  "phone": "+919876543210",
  "password": "Vendor@123",
  "confirmPassword": "Vendor@123",
  "role": "vendor"
}
```

**Expected Response:**
- **Status:** 201 Created
- **Body:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "Test Vendor",
      "email": "vendor@test.com",
      "phone": "+919876543210",
      "role": "vendor",
      "status": "pending",
      "isVerified": false,
      "lastLogin": null,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## TEST 2: Register Delivery Partner
**Method:** POST  
**Endpoint:** `/register`  
**Description:** Register a new delivery partner

**Request Body:**
```json
{
  "name": "Test Delivery",
  "email": "delivery@test.com",
  "phone": "+919876543211",
  "password": "Delivery@123",
  "confirmPassword": "Delivery@123",
  "role": "delivery"
}
```

**Expected Response:**
- **Status:** 201 Created
- **Body:** Similar to TEST 1 with role: "delivery"

---

## TEST 3: Duplicate Email
**Method:** POST  
**Endpoint:** `/register`  
**Description:** Attempt to register with an existing email

**Request Body:**
```json
{
  "name": "Another Vendor",
  "email": "vendor@test.com",
  "phone": "+919876543212",
  "password": "Vendor@123",
  "confirmPassword": "Vendor@123",
  "role": "vendor"
}
```

**Expected Response:**
- **Status:** 409 Conflict
- **Body:**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

## TEST 4: Duplicate Phone
**Method:** POST  
**Endpoint:** `/register`  
**Description:** Attempt to register with an existing phone number

**Request Body:**
```json
{
  "name": "Another Vendor",
  "email": "vendor2@test.com",
  "phone": "+919876543210",
  "password": "Vendor@123",
  "confirmPassword": "Vendor@123",
  "role": "vendor"
}
```

**Expected Response:**
- **Status:** 409 Conflict
- **Body:**
```json
{
  "success": false,
  "message": "Phone number already registered"
}
```

---

## TEST 5: Invalid Password Format
**Method:** POST  
**Endpoint:** `/register`  
**Description:** Attempt to register with invalid password (no uppercase, no number)

**Request Body:**
```json
{
  "name": "Test Vendor",
  "email": "vendor3@test.com",
  "phone": "+919876543213",
  "password": "weakpassword",
  "confirmPassword": "weakpassword",
  "role": "vendor"
}
```

**Expected Response:**
- **Status:** 400 Bad Request
- **Body:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "password must contain at least one uppercase letter, one lowercase letter, and one number"
  ]
}
```

---

## TEST 6: Login Vendor
**Method:** POST  
**Endpoint:** `/login`  
**Description:** Login with vendor credentials

**Request Body:**
```json
{
  "email": "vendor@test.com",
  "password": "Vendor@123"
}
```

**Expected Response:**
- **Status:** 200 OK
- **Body:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "Test Vendor",
      "email": "vendor@test.com",
      "phone": "+919876543210",
      "role": "vendor",
      "status": "pending",
      "isVerified": false,
      "lastLogin": "...",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** Copy the `token` from response for subsequent tests

---

## TEST 7: Login Admin
**Method:** POST  
**Endpoint:** `/login`  
**Description:** Login with admin credentials (seed data)

**Request Body:**
```json
{
  "email": "admin@mokshith.com",
  "password": "Admin@123"
}
```

**Expected Response:**
- **Status:** 200 OK
- **Body:** Similar to TEST 6 with role: "admin"

**Note:** Copy the `token` from response for subsequent tests

---

## TEST 8: Wrong Password
**Method:** POST  
**Endpoint:** `/login`  
**Description:** Attempt login with incorrect password

**Request Body:**
```json
{
  "email": "vendor@test.com",
  "password": "WrongPassword@123"
}
```

**Expected Response:**
- **Status:** 401 Unauthorized
- **Body:**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## TEST 9: Access Protected Route Without Token
**Method:** GET  
**Endpoint:** `/me`  
**Description:** Attempt to access protected route without authentication

**Headers:**
- No Authorization header

**Expected Response:**
- **Status:** 401 Unauthorized
- **Body:**
```json
{
  "success": false,
  "message": "No token provided. Please log in."
}
```

---

## TEST 10: Access Protected Route With Token
**Method:** GET  
**Endpoint:** `/me`  
**Description:** Access protected route with valid token

**Headers:**
```
Authorization: Bearer <token_from_TEST_6_or_TEST_7>
```

**Expected Response:**
- **Status:** 200 OK
- **Body:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "...",
      "email": "...",
      "phone": "...",
      "role": "...",
      "status": "...",
      "isVerified": false,
      "lastLogin": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

## TEST 11: Role Restriction Validation
**Method:** GET  
**Endpoint:** `/me` (or any admin-only route in future)  
**Description:** Vendor attempting to access admin-only route

**Note:** This test will be more relevant when admin-only routes are added in Phase 2. For now, verify that the `authorize` middleware works by checking the user's role in the response.

**Expected Behavior:**
- If a route is protected with `authorize('admin')`, a vendor should receive 403 Forbidden

---

## TEST 12: Get Current User
**Method:** GET  
**Endpoint:** `/me`  
**Description:** Retrieve authenticated user profile

**Headers:**
```
Authorization: Bearer <token_from_TEST_6_or_TEST_7>
```

**Expected Response:**
- **Status:** 200 OK
- **Body:** Same as TEST 10

---

## TEST 13: Change Password
**Method:** PUT  
**Endpoint:** `/change-password`  
**Description:** Change user password

**Headers:**
```
Authorization: Bearer <token_from_TEST_6_or_TEST_7>
```

**Request Body:**
```json
{
  "currentPassword": "Vendor@123",
  "newPassword": "NewVendor@123",
  "confirmPassword": "NewVendor@123"
}
```

**Expected Response:**
- **Status:** 200 OK
- **Body:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "message": "Password changed successfully"
  }
}
```

---

## TEST 14: Login With New Password
**Method:** POST  
**Endpoint:** `/login`  
**Description:** Login with the new password after change

**Request Body:**
```json
{
  "email": "vendor@test.com",
  "password": "NewVendor@123"
}
```

**Expected Response:**
- **Status:** 200 OK
- **Body:** Similar to TEST 6

---

## TEST 15: Logout Endpoint
**Method:** POST  
**Endpoint:** `/logout`  
**Description:** Logout user

**Headers:**
```
Authorization: Bearer <token_from_TEST_6_or_TEST_7>
```

**Expected Response:**
- **Status:** 200 OK
- **Body:**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Additional Validation Tests

### TEST 16: Missing Required Fields
**Method:** POST  
**Endpoint:** `/register`  
**Description:** Register without required fields

**Request Body:**
```json
{
  "name": "Test Vendor",
  "email": "vendor4@test.com"
}
```

**Expected Response:**
- **Status:** 400 Bad Request
- **Body:** Validation errors for missing fields

---

### TEST 17: Password Mismatch
**Method:** POST  
**Endpoint:** `/register`  
**Description:** Register with password mismatch

**Request Body:**
```json
{
  "name": "Test Vendor",
  "email": "vendor5@test.com",
  "phone": "+919876543214",
  "password": "Vendor@123",
  "confirmPassword": "Different@123",
  "role": "vendor"
}
```

**Expected Response:**
- **Status:** 400 Bad Request
- **Body:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Password confirmation does not match"
  ]
}
```

---

### TEST 18: Invalid Email Format
**Method:** POST  
**Endpoint:** `/register`  
**Description:** Register with invalid email

**Request Body:**
```json
{
  "name": "Test Vendor",
  "email": "invalid-email",
  "phone": "+919876543215",
  "password": "Vendor@123",
  "confirmPassword": "Vendor@123",
  "role": "vendor"
}
```

**Expected Response:**
- **Status:** 400 Bad Request
- **Body:** Validation error for invalid email

---

### TEST 19: Invalid Role
**Method:** POST  
**Endpoint:** `/register`  
**Description:** Attempt to register with invalid role (superadmin or admin)

**Request Body:**
```json
{
  "name": "Test User",
  "email": "user@test.com",
  "phone": "+919876543216",
  "password": "User@123",
  "confirmPassword": "User@123",
  "role": "superadmin"
}
```

**Expected Response:**
- **Status:** 400 Bad Request
- **Body:**
```json
{
  "success": false,
  "message": "Invalid role. Only vendor and delivery roles can register"
}
```

---

### TEST 20: Expired Token
**Method:** GET  
**Endpoint:** `/me`  
**Description:** Access protected route with expired token

**Headers:**
```
Authorization: Bearer <expired_token>
```

**Expected Response:**
- **Status:** 401 Unauthorized
- **Body:**
```json
{
  "success": false,
  "message": "Token expired. Please log in again."
}
```

---

## Test Execution Summary

### Required Tests for Phase 1 Completion:
- ✅ TEST 1: Register Vendor
- ✅ TEST 2: Register Delivery Partner
- ✅ TEST 3: Duplicate Email
- ✅ TEST 4: Duplicate Phone
- ✅ TEST 5: Invalid Password Format
- ✅ TEST 6: Login Vendor
- ✅ TEST 7: Login Admin
- ✅ TEST 8: Wrong Password
- ✅ TEST 9: Access Protected Route Without Token
- ✅ TEST 10: Access Protected Route With Token
- ✅ TEST 11: Role Restriction Validation
- ✅ TEST 12: Get Current User
- ✅ TEST 13: Change Password
- ✅ TEST 14: Login With New Password
- ✅ TEST 15: Logout Endpoint

### Additional Validation Tests:
- TEST 16: Missing Required Fields
- TEST 17: Password Mismatch
- TEST 18: Invalid Email Format
- TEST 19: Invalid Role
- TEST 20: Expired Token

---

## Phase 1 Completion Criteria

Phase 1 is complete only when:

✓ Registration works  
✓ Login works  
✓ JWT works  
✓ Password hashing works  
✓ Protected routes work  
✓ Authorization works  
✓ Change password works  
✓ Seed script works  
✓ All Postman tests pass  
✓ No critical bugs remain  

---

## Notes

1. **Token Storage:** For testing purposes, copy the token from login response and use it in Authorization header
2. **Seed Data:** Run `npm run seed` before starting tests to create Super Admin and Admin accounts
3. **Database Cleanup:** Consider clearing the database between test runs for consistent results
4. **Environment Variables:** Ensure `.env` file has valid `JWT_SECRET` and `JWT_EXPIRE` values
