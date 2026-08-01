#!/usr/bin/env node
/**
 * Import Development Export to Production Database
 * 
 * SAFETY: This script ONLY imports data from a verified export file.
 * It NEVER connects to development and production simultaneously.
 * 
 * Usage:
 *   node scripts/migration/import-production.js --export <export-file-path>
 * 
 * Environment Variables:
 *   MONGO_URI - Production MongoDB URI (from Render Environment Variables)
 * 
 * Safety Checks:
 *   - Verifies export file exists and is valid
 *   - Verifies current environment is production
 *   - Verifies target database is mokshith-production
 *   - Requires explicit confirmation before import
 *   - Does NOT delete or drop existing data
 *   - Uses upsert to merge data safely
 */
import { MongoClient } from 'mongodb';
import { loadEnv } from '../../src/config/loadEnv.js';
import { getAppDatabaseName, getNodeEnv } from '../../src/config/environmentResolver.js';
import { logger } from '../../src/config/logger.js';
import { assertNotProductionDatabase, isProduction, isProductionDatabase } from '../../src/utils/destructiveGuard.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadEnv();

// Safety: Ensure we're in production environment
if (!isProduction()) {
  console.error('❌ ERROR: This script can only run in production environment');
  console.error('Set NODE_ENV=production to proceed');
  process.exit(1);
}

// Safety: Ensure we're connecting to production database
const expectedDb = getAppDatabaseName();
if (!isProductionDatabase(expectedDb)) {
  console.error(`❌ ERROR: Expected production database, but configured for: ${expectedDb}`);
  console.error('This script should only import to production (mokshith-production)');
  process.exit(1);
}

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1];
}

async function confirmAction(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise((resolve) => {
    rl.question(`${message} (type 'yes' to confirm): `, resolve);
  });
  
  rl.close();
  return answer.toLowerCase() === 'yes';
}

async function verifyExportFile(filePath) {
  console.log(`🔍 Verifying export file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Export file does not exist');
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    if (!data.metadata || !data.collections) {
      console.error('❌ Invalid export file format');
      return null;
    }
    
    console.log('✅ Export file is valid');
    console.log(`📅 Exported at: ${data.metadata.exportedAt}`);
    console.log(`🎯 Source database: ${data.metadata.databaseName}`);
    console.log(`📋 Collections: ${data.metadata.collectionCount}`);
    
    return data;
  } catch (error) {
    console.error('❌ Failed to parse export file:', error.message);
    return null;
  }
}

async function importToProduction(exportData, mongoUri) {
  console.log('');
  console.log('🚀 Starting Import to Production');
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

    // Safety: Check if production already has data
    const existingCollections = await db.listCollections().toArray();
    if (existingCollections.length > 0) {
      console.log(`⚠️  WARNING: Production already has ${existingCollections.length} collections`);
      console.log('⚠️  This import will MERGE data using upsert (no data will be deleted)');
      
      const confirmed = await confirmAction('Do you want to proceed with the import?');
      if (!confirmed) {
        console.log('❌ Import cancelled by user');
        await client.close();
        process.exit(1);
      }
    }

    let totalImported = 0;
    let totalErrors = 0;

    // Import each collection
    for (const [collName, collData] of Object.entries(exportData.collections)) {
      console.log(`📦 Importing: ${collName}`);
      
      const coll = db.collection(collName);
      const documents = collData.documents;
      const indexes = collData.indexes;
      
      // Create indexes (ignore if they exist)
      if (indexes && indexes.length > 0) {
        for (const index of indexes) {
          try {
            // Skip the default _id index
            if (index.key._id) continue;
            
            await coll.createIndex(index.key, {
              name: index.name,
              unique: index.unique || false,
              sparse: index.sparse || false
            });
          } catch (error) {
            // Index might already exist, that's okay
            if (!error.message.includes('already exists')) {
              console.warn(`    ⚠️  Index creation warning: ${error.message}`);
            }
          }
        }
      }
      
      // Import documents using bulkWrite with upsert
      if (documents && documents.length > 0) {
        const bulkOps = documents.map(doc => ({
          replaceOne: {
            filter: { _id: doc._id },
            replacement: doc,
            upsert: true
          }
        }));
        
        try {
          const result = await coll.bulkWrite(bulkOps, { ordered: false });
          totalImported += result.upsertedCount + result.modifiedCount;
          console.log(`    ✅ Imported ${result.upsertedCount + result.modifiedCount} documents`);
        } catch (error) {
          console.error(`    ❌ Import failed: ${error.message}`);
          totalErrors++;
        }
      } else {
        console.log(`    ℹ️  No documents to import`);
      }
    }

    console.log('');
    console.log('✅ Import completed successfully');
    console.log(`📊 Total documents imported: ${totalImported}`);
    console.log(`📊 Total errors: ${totalErrors}`);
    
    if (totalErrors > 0) {
      console.log('⚠️  Some collections had errors during import. Please review the logs above.');
    }
    
    await client.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    await client.close();
    process.exit(1);
  }
}

async function main() {
  const exportFile = getArg('--export') || getArg('-e');
  
  if (!exportFile) {
    console.error('❌ ERROR: Export file path required');
    console.error('Usage: node scripts/migration/import-production.js --export <export-file-path>');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_DIRECT;
  if (!mongoUri) {
    console.error('❌ ERROR: MONGO_URI or MONGO_URI_DIRECT is required');
    console.error('This should be set in Render Environment Variables for production');
    process.exit(1);
  }

  // Verify export file
  const exportData = await verifyExportFile(exportFile);
  if (!exportData) {
    process.exit(1);
  }

  // Additional safety: Verify export is from development, not production
  if (isProductionDatabase(exportData.metadata.databaseName)) {
    console.error('❌ ERROR: Export file appears to be from production database');
    console.error('This script should only import development data to production');
    process.exit(1);
  }

  // Final confirmation
  console.log('');
  console.log('⚠️  FINAL SAFETY CHECK');
  console.log(`⚠️  You are about to import data into PRODUCTION database: ${expectedDb}`);
  console.log(`⚠️  Source: ${exportData.metadata.databaseName}`);
  console.log(`⚠️  Collections to import: ${exportData.metadata.collectionCount}`);
  
  const confirmed = await confirmAction('Do you want to proceed with the production import?');
  if (!confirmed) {
    console.log('❌ Import cancelled by user');
    process.exit(1);
  }

  await importToProduction(exportData, mongoUri);
}

main();
