# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart.validation.spec.ts >> Cart Validation Certification Suite >> Section E — Frontend Product Listing Validation >> PV-CART-034 | Out-of-stock product cannot be added from listing
- Location: tests\validation\cart.validation.spec.ts:366:5

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.fill: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('input[placeholder*="Search products"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - heading "Something went wrong" [level=2] [ref=e5]
    - paragraph [ref=e6]: An unexpected error occurred. Please try again.
    - generic [ref=e7]:
      - button "Try Again" [ref=e8] [cursor=pointer]
      - link "Go Home" [ref=e9] [cursor=pointer]:
        - /url: /
  - generic [ref=e12]:
    - generic [ref=e13]: "[plugin:vite:oxc] Transform failed with 1 error: [PARSE_ERROR] Expected `,` or `)` but found `;` ╭─[ src/hooks/useProducts.js:67:80 ] │ 67 │ setError(getUserFacingErrorMessage(fetchError, 'Failed to load products'); │ ┬ ┬ │ ╰─────────────────────────────────────────────────────────────────── Opened here │ │ │ ╰── `,` or `)` expected ────╯"
    - generic [ref=e14]: C:/Users/USER/Mokshith/Production/ME/src/hooks/useProducts.js
    - generic [ref=e15]: at transformWithOxc (file:///C:/Users/USER/Mokshith/Production/ME/node_modules/vite/dist/node/chunks/node.js:3657:19) at TransformPluginContext.transform (file:///C:/Users/USER/Mokshith/Production/ME/node_modules/vite/dist/node/chunks/node.js:3728:26) at EnvironmentPluginContainer.transform (file:///C:/Users/USER/Mokshith/Production/ME/node_modules/vite/dist/node/chunks/node.js:29699:51) at async loadAndTransform (file:///C:/Users/USER/Mokshith/Production/ME/node_modules/vite/dist/node/chunks/node.js:19725:26)
    - generic [ref=e16]:
      - text: Click outside, press Esc key, or fix the code to dismiss.
      - text: You can also disable this overlay by setting
      - code [ref=e17]: server.hmr.overlay
      - text: to
      - code [ref=e18]: "false"
      - text: in
      - code [ref=e19]: vite.config.js
      - text: .
```

# Test source

```ts
  1   | import { expect, type Locator, type Page } from '@playwright/test';
  2   | 
  3   | export default class VendorProductsPage {
  4   |   readonly page: Page;
  5   | 
  6   |   constructor(page: Page) {
  7   |     this.page = page;
  8   |   }
  9   | 
  10  |   private viewToggleButtons(): Locator {
  11  |     // The grid/list toggle is a 2-button group inside the header actions.
  12  |     return this.page.locator('div.border.border-gray-300.rounded-lg.overflow-hidden').locator('button');
  13  |   }
  14  | 
  15  |   private filterPanel(): Locator {
  16  |     // Vendor filter panel header includes a "Filters" heading and optional "Clear All".
  17  |     return this.page.locator('div.bg-white').filter({ has: this.page.locator('h3', { hasText: 'Filters' }) }).first();
  18  |   }
  19  | 
  20  |   private async ensureFiltersOpen() {
  21  |     // Filter panel only exists when toggled on.
  22  |     if (await this.filterPanel().count()) return;
  23  |     await this.toggleFilters();
  24  |     await expect(this.filterPanel()).toBeVisible({ timeout: 10000 });
  25  |   }
  26  | 
  27  |   async goto(categoryId?: string) {
  28  |     const path = categoryId ? `/vendor/products?categoryId=${categoryId}` : '/vendor/products';
  29  |     await this.page.goto(path);
  30  |   }
  31  | 
  32  |   async waitForProducts(timeout = 15000) {
  33  |     await this.page.locator('h3').first().waitFor({ timeout });
  34  |   }
  35  | 
  36  |   productCards(): Locator {
  37  |     return this.page.locator('h3');
  38  |   }
  39  | 
  40  |   searchInput(): Locator {
  41  |     return this.page.locator('input[placeholder*="Search products"]');
  42  |   }
  43  | 
  44  |   async search(term: string) {
> 45  |     await this.searchInput().fill(term);
      |                              ^ Error: locator.fill: Test timeout of 120000ms exceeded.
  46  |     // Some builds only apply search after an input event/commit.
  47  |     await this.searchInput().press('Enter').catch(() => {});
  48  |     await this.page.waitForTimeout(800);
  49  |   }
  50  | 
  51  |   async toggleFilters() {
  52  |     await this.page.locator('button', { hasText: /Filters|Filter/ }).first().click();
  53  |   }
  54  | 
  55  |   async setGridView() {
  56  |     await this.viewToggleButtons().first().click();
  57  |   }
  58  | 
  59  |   async setListView() {
  60  |     await this.viewToggleButtons().nth(1).click();
  61  |   }
  62  | 
  63  |   cardByName(name: string): Locator {
  64  |     // Works for both grid cards and list rows; scope to the nearest white "card" container.
  65  |     const title = this.page.locator('h3', { hasText: name }).first();
  66  |     return title.locator('xpath=ancestor::div[contains(@class,"bg-white")]').first();
  67  |   }
  68  | 
  69  |   async openProductDetails(name: string) {
  70  |     await this.cardByName(name).locator('h3').click();
  71  |   }
  72  | 
  73  |   async addToCartByName(name: string) {
  74  |     const card = this.cardByName(name);
  75  |     await card.locator('button:has-text("Add to Cart")').click();
  76  |   }
  77  | 
  78  |   async addToWishlistByName(name: string) {
  79  |     const card = this.cardByName(name);
  80  |     await card.locator('button[title="Add to Wishlist"]').click();
  81  |   }
  82  | 
  83  |   async expectEmptyState() {
  84  |     await expect(this.page.locator('text=No products found')).toBeVisible({ timeout: 10000 });
  85  |   }
  86  | 
  87  |   outOfStockBadge(card: Locator): Locator {
  88  |     return card.locator('span', { hasText: 'Out of Stock' }).first();
  89  |   }
  90  | 
  91  |   async clearFilters() {
  92  |     // "Clear All" lives inside the filter panel and only appears when filters are active.
  93  |     await this.ensureFiltersOpen();
  94  |     await this.filterPanel().locator('button', { hasText: 'Clear All' }).first().click();
  95  |   }
  96  | 
  97  |   async selectSort(optionLabel: string) {
  98  |     // Sort By lives inside the FilterPanel, not the page header.
  99  |     await this.ensureFiltersOpen();
  100 |     await this.filterPanel()
  101 |       .locator('label', { hasText: 'Sort By' })
  102 |       .locator('..')
  103 |       .locator('select')
  104 |       .selectOption({ label: optionLabel });
  105 |   }
  106 | 
  107 |   async selectAvailability(optionLabel: string) {
  108 |     await this.ensureFiltersOpen();
  109 |     await this.filterPanel()
  110 |       .locator('label', { hasText: 'Availability' })
  111 |       .locator('..')
  112 |       .locator('select')
  113 |       .selectOption({ label: optionLabel });
  114 |   }
  115 | }
  116 | 
```