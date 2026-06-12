# Auth Validation Restore Guide

> **RE-ENABLE BEFORE PRODUCTION**  
> This document describes how to restore full production password validation after UAT/testing.

---

## Quick Restore (No Code Changes)

Set these environment variables and restart both backend and frontend:

```env
# Backend (.env)
AUTH_STRICT_MODE=true

# Frontend (.env)
VITE_AUTH_STRICT_MODE=true
```

When unset, backend defaults to **strict mode** (`true`) for safety.

---

## Production Password Policy

When `AUTH_STRICT_MODE=true`, the following rules apply:

| Rule | Description |
|------|-------------|
| Minimum length | 12 characters |
| Maximum length | 128 characters |
| Uppercase | At least one `A-Z` |
| Lowercase | At least one `a-z` |
| Number | At least one digit |
| Special character | At least one symbol from `!@#$%^&*()_+-=[]{}|;':",./<>?` |
| Common passwords | Rejects top breached/common passwords (e.g. `password`, `123456`) |
| Sequential characters | Rejects sequences like `123`, `abc`, `456` |
| Repeated characters | Rejects 3+ repeated chars (e.g. `aaa`, `111`) |
| Name similarity | Password must not contain name parts (3+ chars) |
| Email similarity | Password must not contain email local-part (3+ chars) |
| Mobile similarity | Password must not contain last 4 digits of mobile |
| Breach check | Rejects passwords found in HIBP with count > 1000 |
| Password history | Change-password rejects reuse of last 5 passwords |
| Joi schema | Register/change-password enforce min 12 + complexity regex |

### Registration (Joi)

- **Name**: required, minimum 2 characters
- **Email**: required, valid email
- **Mobile**: required
- **Password**: strict policy above
- **Role**: valid role enum

### Login

- Identifier: email or 10-digit mobile
- Password: required (no complexity check on login)

---

## UAT/Testing Policy (`AUTH_STRICT_MODE=false`)

| Field | Rule |
|-------|------|
| Name | Required, min 2 characters |
| Email | Required, valid email |
| Mobile | Required, existing validation |
| Password | Required, min 6 characters only |
| Confirm password | Must match (frontend only) |

**Temporarily disabled in relaxed mode:**

- 12-character minimum
- Uppercase/lowercase/number/symbol requirements
- Sequential number/character checks
- Repeated character checks
- Username/password similarity checks
- Common password blocklist
- Password history checks
- HIBP breach checks

---

## Files and Code Sections

### Backend

| File | Purpose | Restore action |
|------|---------|----------------|
| `Production/b2b-backend/src/config/authStrictMode.js` | Feature flag reader | Set `AUTH_STRICT_MODE=true` |
| `Production/b2b-backend/src/utils/passwordPolicy.js` | `validatePasswordStrict()` (production) + `validatePasswordRelaxed()` (UAT) | No code change — flag selects strict path |
| `Production/b2b-backend/src/modules/auth/auth.validation.js` | Joi schemas with `strictPasswordField` / `relaxedPasswordField` | No code change — flag selects strict schema |
| `Production/b2b-backend/src/middlewares/validate.middleware.js` | Lazy schema resolution + password fields excluded from numeric coercion | No code change — flag selects strict path |
| `Production/b2b-backend/.env.example` | Documents `AUTH_STRICT_MODE` | Set to `true` before production deploy |

### Frontend

| File | Purpose | Restore action |
|------|---------|----------------|
| `Production/ME/src/utils/authValidationPolicy.js` | Client-side min length + helper text | Set `VITE_AUTH_STRICT_MODE=true` |
| `Production/ME/src/pages/Auth/Register.jsx` | Registration form validation + helper text | Uses policy util — flag restores 12-char messaging |
| `Production/ME/src/pages/Admin/Settings.jsx` | Change password helper text | Uses policy util |
| `Production/ME/src/pages/Vendor/Settings.jsx` | Change password helper text | Uses policy util |
| `Production/ME/src/pages/DeliveryPartner/Settings.jsx` | Change password helper text | Uses policy util |
| `Production/ME/src/pages/SuperAdmin/Settings.jsx` | Change password helper text | Uses policy util |
| `Production/ME/.env.example` | Documents `VITE_AUTH_STRICT_MODE` | Set to `true` before production deploy |

### User Model

`Production/b2b-backend/src/modules/user/user.model.js` — no password complexity at schema level (validation is in service layer only).

---

## Key Code References

### Feature flag (backend)

```javascript
// Production/b2b-backend/src/config/authStrictMode.js
export const isAuthStrictMode = () => {
  const value = process.env.AUTH_STRICT_MODE;
  if (value === undefined || value === '') return true;
  return value === 'true' || value === '1';
};
```

### Strict validation preserved

```javascript
// Production/b2b-backend/src/utils/passwordPolicy.js
// validatePasswordStrict() — full OWASP policy (unchanged logic)
// validatePasswordRelaxed() — UAT only, min 6 chars
export const validatePassword = (password, userData = {}) =>
  isAuthStrictMode()
    ? validatePasswordStrict(password, userData)
    : validatePasswordRelaxed(password);
```

### Service-layer checks gated

```javascript
// Production/b2b-backend/src/modules/auth/auth.service.js
// register(): breach check wrapped in isAuthStrictMode()
// changePassword(): history + breach checks wrapped in isAuthStrictMode()
```

---

## Verification Checklist (After Restore)

1. Registration with `123456` → **Fail** (too weak / common in strict mode)
2. Registration with `SecurePass@2026X` → **Success**
3. Registration with `abc` → **Fail**
4. Login with existing users → **Success**
5. Change password with weak password → **Fail**
6. Change password with strong password → **Success**
7. Frontend shows 12-character complexity helper text

---

## Test Suite

Backend tests run with `AUTH_STRICT_MODE=true` by default (`tests/setup.js`).

Relaxed-mode unit tests: `tests/unit/passwordPolicy.test.js` → `validatePassword() - relaxed mode`.

Run:

```bash
cd Production/b2b-backend
npm run test:unit -- tests/unit/passwordPolicy.test.js
```

---

## Deployment Reminder

Before any production or GA release:

1. Set `AUTH_STRICT_MODE=true` in backend environment
2. Set `VITE_AUTH_STRICT_MODE=true` in frontend build environment
3. Rebuild and redeploy frontend (Vite bakes env at build time)
4. Run verification checklist above
5. Remove or archive this temporary UAT configuration from deployment pipelines
