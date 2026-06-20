// MOVED: Dangerous resetDatabase script
// This file was moved from scripts/resetDatabase.js to /dangerous-dev-tools to prevent accidental execution.
// To run: execute manually on a development machine only. DO NOT commit production env vars or run in production.

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
import Cart from '../src/modules/cart/cart.model.js';
import Wishlist from '../src/modules/wishlist/wishlist.model.js';
import Vendor from '../src/modules/vendor/vendor.model.js';
import Order from '../src/modules/order/order.model.js';
import Notification from '../src/modules/notification/notification.model.js';
import { ROLES } from '../src/constants/roles.js';
import { USER_STATUS } from '../src/constants/userStatus.js';
import mongoose from 'mongoose';

loadEnv();

const SUPER_ADMIN = {
  name: 'Super Admin',
  email: 'superadmin@mokshith.com',
  mobile: '9999999999',
  password: 'superadmin123',
  role: ROLES.SUPER_ADMIN,
  status: USER_STATUS.ACTIVE,
};

const MODEL_COLLECTIONS = [
  { name: 'users', model: User },
  { name: 'categories', model: Category },
  { name: 'products', model: Product },
  { name: 'carts', model: Cart },
  { name: 'wishlists', model: Wishlist },
  { name: 'vendors', model: Vendor },
  { name: 'orders', model: Order },
  { name: 'notifications', model: Notification },
];

const NATIVE_COLLECTIONS = ['deliverypartners', 'analytics'];

async function deleteCollectionDocuments(collectionName, model = null) {
  if (model) {
    const result = await model.deleteMany({});
    return { collection: collectionName, deletedCount: result.deletedCount };
  }

  const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
  if (!collections.length) {
    return { collection: collectionName, deletedCount: 0, skipped: true };
  }

  const result = await mongoose.connection.collection(collectionName).deleteMany({});
  return { collection: collectionName, deletedCount: result.deletedCount };
}

export async function resetDatabase() {
  logDestructiveWarning('Full database reset (deleteMany on all core collections)');
  assertDestructiveOperationAllowed('resetDatabase');

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured in .env');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
  });

  assertExpectedApplicationDatabase(mongoose.connection.name);

  const cleanupResults = [];

  for (const { name, model } of MODEL_COLLECTIONS) {
    const result = await deleteCollectionDocuments(name, model);
    cleanupResults.push(result);
    console.log(`Cleaned ${name}: ${result.deletedCount} document(s) deleted`);
  }

  for (const collectionName of NATIVE_COLLECTIONS) {
    const result = await deleteCollectionDocuments(collectionName);
    cleanupResults.push(result);
    if (result.skipped) {
      console.log(`Skipped ${collectionName}: collection does not exist`);
    } else {
      console.log(`Cleaned ${collectionName}: ${result.deletedCount} document(s) deleted`);
    }
  }

  const hashedPassword = await hashPassword(SUPER_ADMIN.password);
  const superAdmin = await User.create({
    name: SUPER_ADMIN.name,
    email: SUPER_ADMIN.email,
    mobile: SUPER_ADMIN.mobile,
    password: hashedPassword,
    role: SUPER_ADMIN.role,
    status: SUPER_ADMIN.status,
    isVerified: true,
  });

  console.log('Created Super Admin:', {
    id: superAdmin._id.toString(),
    email: superAdmin.email,
    mobile: superAdmin.mobile,
    role: superAdmin.role,
    status: superAdmin.status,
  });

  const userCount = await User.countDocuments({});
  const categoryCount = await Category.countDocuments({});
  const productCount = await Product.countDocuments({});
  const vendorCount = await Vendor.countDocuments({});
  const orderCount = await Order.countDocuments({});

  console.log('\nPost-reset counts:');
  console.log({ users: userCount, categories: categoryCount, products: productCount, vendors: vendorCount, orders: orderCount });

  await mongoose.disconnect();

  return {
    cleanupResults,
    superAdmin: {
      id: superAdmin._id.toString(),
      email: superAdmin.email,
      mobile: superAdmin.mobile,
      role: superAdmin.role,
      status: superAdmin.status,
    },
    counts: {
      users: userCount,
      categories: categoryCount,
      products: productCount,
      vendors: vendorCount,
      orders: orderCount,
    },
  };
}

const isDirectExecution = process.argv[1]?.includes('dangerous-dev-tools/resetDatabase.js') || process.argv[1]?.includes('/dangerous-dev-tools/resetDatabase.js') || process.argv[1]?.endsWith('resetDatabase.js');

if (isDirectExecution) {
  (async () => {
    try {
      if (process.env.NODE_ENV === 'production') {
        console.error('Refusing to run destructive script in production');
        process.exit(1);
      }

      if (process.env.DESTRUCTIVE_CONFIRM !== REQUIRED_DESTRUCTIVE_CONFIRM) {
        console.error(`Set DESTRUCTIVE_CONFIRM=${REQUIRED_DESTRUCTIVE_CONFIRM} to enable destructive scripts`);
        process.exit(1);
      }

      const readline = await import('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise((resolve) => rl.question(`Type "${REQUIRED_DESTRUCTIVE_CONFIRM}" to confirm destructive action: `, resolve));
      rl.close();
      if (answer !== process.env.DESTRUCTIVE_CONFIRM) {
        console.error('Interactive confirmation failed. Aborting.');
        process.exit(1);
      }

      await resetDatabase();
      console.log('\nDatabase reset complete.');
      process.exit(0);
    } catch (error) {
      console.error('Database reset failed:', error.message || error);
      process.exit(1);
    }
  })();
}

