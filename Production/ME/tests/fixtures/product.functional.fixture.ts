import { test as base } from '@playwright/test';
import { establishSession } from '../helpers/session.functional.helper';
import {
  getAdminCredentials,
  getCustomerCredentials,
  getDeliveryCredentials,
  getSuperAdminCredentials,
  getVendorCredentials,
  type RoleCredentials,
} from '../helpers/product.credentials';

type ProductFunctionalFixtures = {
  adminCreds: RoleCredentials;
  vendorCreds: RoleCredentials;
  vendor2Creds: RoleCredentials;
  superAdminCreds: RoleCredentials;
  customerCreds: RoleCredentials;
  deliveryCreds: RoleCredentials;
  loginAsAdmin: void;
  loginAsVendor: void;
};

export const test = base.extend<ProductFunctionalFixtures>({
  adminCreds: async ({}, use) => {
    await use(getAdminCredentials());
  },
  vendorCreds: async ({}, use) => {
    await use(getVendorCredentials(1));
  },
  vendor2Creds: async ({}, use) => {
    await use(getVendorCredentials(2));
  },
  superAdminCreds: async ({}, use) => {
    await use(getSuperAdminCredentials());
  },
  customerCreds: async ({}, use) => {
    await use(getCustomerCredentials());
  },
  deliveryCreds: async ({}, use) => {
    await use(getDeliveryCredentials());
  },
  loginAsAdmin: async ({ page }, use) => {
    await establishSession(page, 'admin');
    await use();
  },
  loginAsVendor: async ({ page }, use) => {
    await establishSession(page, 'vendor');
    await use();
  },
});

export { expect } from '@playwright/test';
