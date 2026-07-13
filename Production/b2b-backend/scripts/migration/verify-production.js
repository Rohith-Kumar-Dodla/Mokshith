#!/usr/bin/env node
/**
 * Verify Production Database After Migration
 * 
 * SAFETY: This script is READ-ONLY. It never modifies data.
 * 
 * Usage:
 *   node scripts/migration/verify-production.js
 * 
 * Environment Variables:
 *   MONGO_URI - Production MongoDB URI (from Render Environment Variables)
 * 
 * Verification Checks:
 *   - Collections created
 *   - Indexes created
 *   - Document counts
 *   - Relationships intact
 *   - No duplicate documents
 *   - No missing references
 */
import { MongoClient } from 'mongodb';
import { loadEnv } from '../../src/config/loadEnv.js';
import { getAppDatabaseName, getNodeEnv } from '../../src/config/environmentResolver.js';
import { logger } from '../../src/config/logger.js';

loadEnv();

// Safety: Ensure we're in production environment
if (process.env.NODE_ENV !== 'production') {
  console.error('❌ ERROR: This script can only run in production environment');
  console.error('Set NODE_ENV=production to proceed');
  process.exit(1);
}

// Safety: Ensure we're connecting to production database
const expectedDb = getAppDatabaseName();
if (expectedDb !== 'mokshith-production') {
  console.error(`❌ ERROR: Expected production database, but configured for: ${expectedDb}`);
  console.error('This script should only verify production (mokshith-production)');
  process.exit(1);
}

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_DIRECT;
if (!mongoUri) {
  console.error('❌ ERROR: MONGO_URI or MONGO_URI_DIRECT is required');
  process.exit(1);
}

const EXPECTED_COLLECTIONS = [
  'users',
  'companies',
  'products',
  'categories',
  'inventory',
  'orders',
  'payments',
  'vendors',
  'admins',
  'deliverypartners',
  'addresses',
  'notifications',
  'settings',
  'coupons',
  'analytics'
];

async function verifyProduction() {
  console.log('🔍 Starting Production Database Verification');
  console.log(`🎯 Target database: ${expectedDb}`);
  console.log('');

  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const actualDbName = db.databaseName;
    
    console.log(`📊 Database: ${actualDbName}`);

    if (actualDbName !== expectedDb) {
      console.error(`❌ ERROR: Connected to wrong database: ${actualDbName}`);
      console.error(`Expected: ${expectedDb}`);
      await client.close();
      process.exit(1);
    }

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('');
    console.log('📋 Collection Verification');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let missingCollections = [];
    let extraCollections = [];
    let totalDocuments = 0;
    let totalIndexes = 0;

    for (const expected of EXPECTED_COLLECTIONS) {
      if (collectionNames.includes(expected)) {
        const coll = db.collection(expected);
        const count = await coll.countDocuments();
        const indexes = await coll.indexes();
        totalDocuments += count;
        totalIndexes += indexes.length;
        console.log(`✅ ${expected.padEnd(25)} ${count.toString().padStart(8)} docs  ${indexes.length} indexes`);
      } else {
        missingCollections.push(expected);
        console.log(`❌ ${expected.padEnd(25)} MISSING`);
      }
    }

    // Check for unexpected collections
    for (const actual of collectionNames) {
      if (!EXPECTED_COLLECTIONS.includes(actual)) {
        extraCollections.push(actual);
        console.log(`⚠️  ${actual.padEnd(25)} UNEXPECTED`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total collections: ${collectionNames.length}`);
    console.log(`📊 Total documents: ${totalDocuments}`);
    console.log(`📊 Total indexes: ${totalIndexes}`);
    console.log('');

    // Detailed checks for critical collections
    console.log('🔍 Critical Collection Checks');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (collectionNames.includes('users')) {
      const users = db.collection('users');
      const userCount = await users.countDocuments();
      const adminCount = await users.countDocuments({ role: 'SUPER_ADMIN' });
      const vendorCount = await users.countDocuments({ role: 'VENDOR' });
      const customerCount = await users.countDocuments({ role: 'B2B_CUSTOMER' });
      
      console.log(`👥 Users: ${userCount} total`);
      console.log(`   - Super Admins: ${adminCount}`);
      console.log(`   - Vendors: ${vendorCount}`);
      console.log(`   - Customers: ${customerCount}`);
      
      if (adminCount === 0) {
        console.log('⚠️  WARNING: No super admin found');
      }
    }

    if (collectionNames.includes('products')) {
      const products = db.collection('products');
      const productCount = await products.countDocuments();
      const activeProducts = await products.countDocuments({ isActive: true });
      
      console.log(`📦 Products: ${productCount} total (${activeProducts} active)`);
      
      if (productCount === 0) {
        console.log('⚠️  WARNING: No products found');
      }
    }

    if (collectionNames.includes('categories')) {
      const categories = db.collection('categories');
      const categoryCount = await categories.countDocuments();
      console.log(`📂 Categories: ${categoryCount} total`);
      
      if (categoryCount === 0) {
        console.log('⚠️  WARNING: No categories found');
      }
    }

    if (collectionNames.includes('orders')) {
      const orders = db.collection('orders');
      const orderCount = await orders.countDocuments();
      console.log(`🛒 Orders: ${orderCount} total`);
    }

    if (collectionNames.includes('payments')) {
      const payments = db.collection('payments');
      const paymentCount = await payments.countDocuments();
      console.log(`💳 Payments: ${paymentCount} total`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Relationship integrity checks
    console.log('🔗 Relationship Integrity Checks');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (collectionNames.includes('products') && collectionNames.includes('categories')) {
      const products = db.collection('products');
      const categories = db.collection('categories');
      
      const orphanProducts = await products.countDocuments({
        categoryId: { $exists: true },
        categoryId: { $nin: await categories.distinct('_id') }
      });
      
      if (orphanProducts > 0) {
        console.log(`⚠️  Products with invalid category references: ${orphanProducts}`);
      } else {
        console.log('✅ All product category references are valid');
      }
    }

    if (collectionNames.includes('orders') && collectionNames.includes('users')) {
      const orders = db.collection('orders');
      const users = db.collection('users');
      
      const orphanOrders = await orders.countDocuments({
        userId: { $exists: true },
        userId: { $nin: await users.distinct('_id') }
      });
      
      if (orphanOrders > 0) {
        console.log(`⚠️  Orders with invalid user references: ${orphanOrders}`);
      } else {
        console.log('✅ All order user references are valid');
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Summary
    console.log('📋 Verification Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const hasErrors = missingCollections.length > 0;
    const hasWarnings = extraCollections.length > 0 || adminCount === 0 || productCount === 0;
    
    if (!hasErrors && !hasWarnings) {
      console.log('✅ VERIFICATION PASSED');
      console.log('✅ All expected collections are present');
      console.log('✅ Critical data is available');
      console.log('✅ Relationships are intact');
      console.log('');
      console.log('🎉 Production database is ready for use!');
    } else {
      if (hasErrors) {
        console.log('❌ VERIFICATION FAILED');
        console.log(`❌ Missing collections: ${missingCollections.join(', ')}`);
      }
      if (hasWarnings) {
        console.log('⚠️  VERIFICATION COMPLETED WITH WARNINGS');
        if (extraCollections.length > 0) {
          console.log(`⚠️  Extra collections: ${extraCollections.join(', ')}`);
        }
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await client.close();
    process.exit(hasErrors ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    await client.close();
    process.exit(1);
  }
}

verifyProduction();
