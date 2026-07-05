# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke\authentication.smoke.spec.ts >> Authentication Smoke Suite >> S-AUTH-01 | Login (password) - basic auth
- Location: tests\smoke\authentication.smoke.spec.ts:43:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.count: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation "Main navigation" [ref=e4]:
    - generic [ref=e6]:
      - link "M Mokshith B2B" [ref=e7] [cursor=pointer]:
        - /url: /
        - generic [ref=e9]: M
        - generic [ref=e10]: Mokshith B2B
      - generic [ref=e11]:
        - link "Home" [ref=e12] [cursor=pointer]:
          - /url: /
        - link "Features" [ref=e13] [cursor=pointer]:
          - /url: "#features"
        - link "How It Works" [ref=e14] [cursor=pointer]:
          - /url: "#how-it-works"
        - link "Login" [ref=e15] [cursor=pointer]:
          - /url: /login
        - link "Register" [ref=e16] [cursor=pointer]:
          - /url: /register
  - generic [ref=e19]:
    - generic [ref=e20]:
      - heading "Welcome Back" [level=1] [ref=e21]
      - paragraph [ref=e22]: Sign in to your account
    - generic [ref=e23]: Invalid credentials
    - generic [ref=e24]:
      - generic [ref=e25]:
        - generic [ref=e26]: Mobile Number
        - generic [ref=e27]:
          - img [ref=e28]
          - textbox "Enter your 10-digit mobile number" [ref=e30]: "9000000101"
      - generic [ref=e31]:
        - generic [ref=e32]: Password
        - generic [ref=e33]:
          - img [ref=e34]
          - generic [ref=e36]:
            - textbox "Enter your password" [ref=e37]: Test@1234
            - button "Show password" [ref=e38] [cursor=pointer]:
              - img [ref=e39]
      - link "Forgot password?" [ref=e43] [cursor=pointer]:
        - /url: /forgot-password
      - button "Sign In" [ref=e44] [cursor=pointer]:
        - generic [ref=e45]: Sign In
        - img [ref=e46]
    - paragraph [ref=e49]:
      - text: Don't have an account?
      - link "Register here" [ref=e50] [cursor=pointer]:
        - /url: /register
```

# Test source

```ts
  1  | import type { Page } from '@playwright/test';
  2  | import LoginPage from '../../pages/auth/LoginPage';
  3  | import { AuthSelectors } from '../../selectors/auth.selectors';
  4  | 
  5  | /**
  6  |  * Login flow using UI page objects.
  7  |  * - Navigates to login page
  8  |  * - Fills mobile & password
  9  |  * - Submits and handles optional 2FA if verifier becomes visible
  10 |  *
  11 |  * NOTE: This flow orchestrates page object actions only. No assertions.
  12 |  */
  13 | export async function loginFlow(page: Page, mobile: string, password: string, twoFACode?: string) {
  14 |   const loginPage = new LoginPage(page);
  15 |   await loginPage.goto();
  16 |   await loginPage.fillMobile(mobile);
  17 |   await loginPage.fillPassword(password);
  18 |   await loginPage.submit();
  19 | 
  20 |   // If 2FA input appears, perform verification using provided code
  21 |   const twoFALocator = page.locator(AuthSelectors.login.twoFAVerifyInput);
> 22 |   if (await twoFALocator.count() > 0 && twoFACode) {
     |                          ^ Error: locator.count: Target page, context or browser has been closed
  23 |     await loginPage.startTwoFAVerify(twoFACode);
  24 |   }
  25 | }
  26 | 
  27 | export default loginFlow;
  28 | 
  29 | 
```