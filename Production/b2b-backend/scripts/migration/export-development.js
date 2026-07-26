#!/usr/bin/env node
/**
 * Export Development Database for Migration
 * 
 * SAFETY: This script ONLY exports data. It never modifies production.
 * 
 * Usage:
 *   node scripts/migration/export-development.js
 * 
 * Environment Variables:
 *   MONGO_URI - Development MongoDB URI (from .env.development)
 *   BACKUP_DIR - Directory to store export (default: ./backups)
 * 
 * The export will be saved to: BACKUP_DIR/mokshith-dev-export-<timestamp>.json
 */
import { MongoClient } from 'mongodb';
import { loadEnv } from '../../src/config/loadEnv.js';
import { getAppDatabaseName, getNodeEnv } from '../../src/config/environmentResolver.js';
import { logger } from '../../src/config/logger.js';
import { assertNotProduction, assertNotProductionDatabase } from '../../src/utils/destructiveGuard.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadEnv();

// Safety: Ensure we're not in production environment
assertNotProduction('export-development.js');

// Safety: Ensure we're connecting to development database
const expectedDb = getAppDatabaseName();
assertNotProductionDatabase(expectedDb, 'export-development.js');

if (expectedDb !== 'mokshith-dev' && expectedDb !== 'test') {
  console.error(`❌ ERROR: Expected development database, but configured for: ${expectedDb}`);
  console.error('This script should only export from development (mokshith-dev)');
  process.exit(1);
}

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_DIRECT;
if (!mongoUri) {
  console.error('❌ ERROR: MONGO_URI or MONGO_URI_DIRECT is required');
  process.exit(1);
}

const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const exportFile = path.join(backupDir, `mokshith-dev-export-${timestamp}.json`);

async function exportDatabase() {
  console.log('📦 Starting Development Database Export');
  console.log(`📁 Export directory: ${backupDir}`);
  console.log(`📄 Export file: ${exportFile}`);
  console.log(`🎯 Target database: ${expectedDb}`);
  console.log('');

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`✅ Created backup directory: ${backupDir}`);
  }

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

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections`);

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        databaseName: actualDbName,
        collectionCount: collections.length,
        environment: process.env.NODE_ENV,
        version: '1.0'
      },
      collections: {}
    };

    let totalDocuments = 0;

    // Export each collection
    for (const collection of collections) {
      const collName = collection.name;
      console.log(`  📦 Exporting: ${collName}`);
      
      const coll = db.collection(collName);
      const documents = await coll.find({}).toArray();
      const indexes = await coll.indexes();
      
      exportData.collections[collName] = {
        count: documents.length,
        documents: documents,
        indexes: indexes
      };
      
      totalDocuments += documents.length;
      console.log(`    ✅ ${documents.length} documents, ${indexes.length} indexes`);
    }

    // Write export to file
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    
    console.log('');
    console.log('✅ Export completed successfully');
    console.log(`📊 Total collections: ${collections.length}`);
    console.log(`📊 Total documents: ${totalDocuments}`);
    console.log(`📄 Export file: ${exportFile}`);
    console.log(`📏 File size: ${(fs.statSync(exportFile).size / 1024 / 1024).toFixed(2)} MB`);
    
    await client.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    await client.close();
    process.exit(1);
  }
}

exportDatabase();
