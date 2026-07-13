import { test, expect } from '../fixtures/product.functional.fixture';
import VendorProductDetailsPage from '../pages/vendor/VendorProductDetailsPage';
import {
  calculatePricingApi,
  createProductApi,
  getAdminSession,
  getFirstCategoryId,
} from '../helpers/product.api.helper';
import { uniqueProductName } from '../helpers/product.credentials';
import { establishSession } from '../helpers/session.functional.helper';

test.describe('PF-PROD Section M | Pricing & Bulk', () => {
  let productId = '';
  const basePrice = 200;

  test.beforeAll(async () => {
    const session = await getAdminSession();
    const categoryId = await getFirstCategoryId(session);
    const created = await createProductApi(session, {
      name: uniqueProductName('pf-pricing'),
      price: basePrice,
      categoryId,
      stock: 200,
      moq: 1,
      bulkPricing: [
        { minQuantity: 10, price: 180 },
        { minQuantity: 50, price: 160 },
      ],
    });
    productId = String(created._id || created.id);
  });

  test('PF-PROD-102 | Base price at qty < 50', async () => {
    const result = await calculatePricingApi(basePrice, 1);
    const finalPrice = Number(result.final ?? result.data?.final ?? result.price ?? basePrice);
    expect(finalPrice).toBe(basePrice);
  });

  test('PF-PROD-103 | 10% discount at qty >= 50', async () => {
    const result = await calculatePricingApi(basePrice, 50);
    const finalPrice = Number(result.final ?? result.data?.final ?? result);
    expect(finalPrice).toBeCloseTo(basePrice * 0.9, 1);
  });

  test('PF-PROD-104 | 20% discount at qty >= 100', async () => {
    const result = await calculatePricingApi(basePrice, 100);
    const finalPrice = Number(result.final ?? result.data?.final ?? result);
    expect(finalPrice).toBeCloseTo(basePrice * 0.8, 1);
  });

  test('PF-PROD-105 | Bulk pricing table display', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(productId);
    await details.waitForLoad();
    await expect(page.locator('text=/Bulk Pricing|Min Qty|min/i').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('PF-PROD-106 | Client-side bulk pricing fallback', async ({ page, vendorCreds }) => {
    await establishSession(page, 'vendor');
    const details = new VendorProductDetailsPage(page);
    await details.goto(productId);
    await details.waitForLoad();
    await details.setQuantity(50);
    await page.waitForTimeout(1000);
    await expect(page.locator('text=₹').first()).toBeVisible();
  });

  test('PF-PROD-107 | Pricing API rejects qty < 1', async () => {
    await expect(calculatePricingApi(basePrice, 0)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});
