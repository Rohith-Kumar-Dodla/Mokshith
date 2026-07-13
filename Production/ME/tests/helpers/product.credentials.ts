export type RoleCredentials = {
  mobile: string;
  password: string;
};

export function getAdminCredentials(): RoleCredentials {
  return {
    mobile: process.env.TEST_SEEDED_ADMIN_MOBILE || '9000000002',
    password: process.env.TEST_SEEDED_ADMIN_PASSWORD || 'Admin@123',
  };
}

export function getVendorCredentials(index = 1): RoleCredentials {
  if (index === 2) {
    return {
      mobile: process.env.TEST_SEEDED_VENDOR2_MOBILE || '9000000102',
      password: process.env.TEST_SEEDED_VENDOR2_PASSWORD || 'Vendor@123',
    };
  }
  return {
    mobile: process.env.TEST_SEEDED_VENDOR_MOBILE || '9000000101',
    password: process.env.TEST_SEEDED_VENDOR_PASSWORD || 'Vendor@123',
  };
}

export function getSuperAdminCredentials(): RoleCredentials {
  return {
    mobile: process.env.TEST_SEEDED_SUPER_ADMIN_MOBILE || '9000000001',
    password: process.env.TEST_SEEDED_SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
  };
}

export function getCustomerCredentials(): RoleCredentials {
  return {
    mobile: process.env.TEST_SEEDED_CUSTOMER_MOBILE || '9000000301',
    password: process.env.TEST_SEEDED_CUSTOMER_PASSWORD || 'Customer@123',
  };
}

export function getDeliveryCredentials(index = 1): RoleCredentials {
  if (index === 2) {
    return {
      mobile: process.env.TEST_SEEDED_DELIVERY2_MOBILE || '9000000202',
      password: process.env.TEST_SEEDED_DELIVERY2_PASSWORD || 'Delivery@123',
    };
  }
  return {
    mobile: process.env.TEST_SEEDED_DELIVERY_MOBILE || '9000000201',
    password: process.env.TEST_SEEDED_DELIVERY_PASSWORD || 'Delivery@123',
  };
}

export function getInactiveVendorCredentials(): RoleCredentials {
  return {
    mobile: process.env.TEST_SEEDED_INACTIVE_VENDOR_MOBILE || '9000000401',
    password: process.env.TEST_SEEDED_INACTIVE_VENDOR_PASSWORD || 'Inactive@123',
  };
}

export function uniqueProductName(prefix = 'pf-product'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
