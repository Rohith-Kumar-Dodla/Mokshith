// MOVED: Dangerous development seed script
// This file was moved from the project root to /dangerous-dev-tools to prevent accidental execution.
// To run: execute manually on a development machine only. DO NOT commit production env vars or run in production.

import mongoose from 'mongoose';
import { loadEnv } from '../src/config/loadEnv.js';
import {
  assertDestructiveOperationAllowed,
  assertExpectedApplicationDatabase,
  logDestructiveWarning,
  REQUIRED_DESTRUCTIVE_CONFIRM,
} from '../src/utils/destructiveGuard.js';
import { hashPassword } from '../src/utils/hashPassword.js';
import User from '../src/modules/user/user.model.js';
import Category from '../src/modules/category/category.model.js';
import Product from '../src/modules/product/product.model.js';
import Company from '../src/modules/company/company.model.js';
import Vendor from '../src/modules/vendor/vendor.model.js';
import { ROLES } from '../src/constants/roles.js';
import { USER_STATUS } from '../src/constants/userStatus.js';

loadEnv();

export const seed = async () => {
  logDestructiveWarning('Legacy seed (wipes users, categories, products, companies, vendors)');
  assertDestructiveOperationAllowed('seed.js');

  console.log('Seeding database...');
  await mongoose.connect(process.env.MONGO_URI);
  assertExpectedApplicationDatabase(mongoose.connection.name);

  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Company.deleteMany({});
  await Vendor.deleteMany({});

  const adminPassword = await hashPassword('admin123');
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@mokshith.com',
    mobile: '9876543210',
    password: adminPassword,
    role: ROLES.SUPER_ADMIN,
    status: USER_STATUS.ACTIVE,
    isVerified: true,
  });
  console.log('Super Admin created');

  const company = await Company.create({
    name: 'Mokshith Enterprises Ltd',
    email: 'corp@mokshith.com',
    phone: '080-12345678',
    address: 'Industrial Area, Bangalore',
    createdBy: admin._id,
  });
  console.log('Company created');

  await User.create({
    name: 'Apex Vendor',
    email: 'vendor@apex.com',
    mobile: '9988776655',
    password: adminPassword,
    role: ROLES.VENDOR,
    status: USER_STATUS.ACTIVE,
    companyId: company._id,
    isVerified: true,
  });

  await Vendor.create({
    name: 'Apex Industrial Supplies',
    email: 'supplies@apex.com',
    phone: '080-88776655',
    address: 'Peenya Industrial Estate',
    companyId: company._id,
    status: 'APPROVED',
  });
  console.log('Vendor created');

  const catHardware = await Category.create({ name: 'Hardware' });
  const catElectrical = await Category.create({ name: 'Electrical' });
  const catMachinery = await Category.create({ name: 'Machinery' });
  console.log('Categories created');

  await Product.create([
    {
      name: 'Industrial Steel Bolts - M12',
      description: 'High-grade stainless steel bolts for heavy construction.',
      price: 450,
      stock: 500,
      categoryId: catHardware._id,
      moq: 10,
      isActive: true,
    },
    {
      name: 'Copper Wiring - 100m Roll',
      description: 'Premium quality 2.5mm copper wiring for industrial use.',
      price: 12500,
      stock: 85,
      categoryId: catElectrical._id,
      moq: 5,
      isActive: true,
    },
    {
      name: 'Hydraulic Jack - 5 Ton',
      description: 'Heavy-duty hydraulic jack with safety bypass valve.',
      price: 3200,
      stock: 120,
      categoryId: catMachinery._id,
      moq: 1,
      isActive: true,
    },
  ]);
  console.log('Products created');

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
};

const isDirectExecution = process.argv[1]?.includes('dangerous-dev-tools/seed.js') || process.argv[1]?.includes('/dangerous-dev-tools/seed.js') || process.argv[1]?.endsWith('seed.js');

if (isDirectExecution) {
  (async () => {
    try {
      // Enforce non-production
      if (process.env.NODE_ENV === 'production') {
        console.error('Refusing to run destructive script in production');
        process.exit(1);
      }

      // Require explicit env token
      if (process.env.DESTRUCTIVE_CONFIRM !== REQUIRED_DESTRUCTIVE_CONFIRM) {
        console.error(`Set DESTRUCTIVE_CONFIRM=${REQUIRED_DESTRUCTIVE_CONFIRM} to enable destructive scripts`);
        process.exit(1);
      }

      // Interactive confirmation
      const readline = await import('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise((resolve) => rl.question(`Type "${REQUIRED_DESTRUCTIVE_CONFIRM}" to confirm destructive action: `, resolve));
      rl.close();
      if (answer !== process.env.DESTRUCTIVE_CONFIRM) {
        console.error('Interactive confirmation failed. Aborting.');
        process.exit(1);
      }

      await seed();
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed:', err?.message || err);
      process.exit(1);
    }
  })();
}

