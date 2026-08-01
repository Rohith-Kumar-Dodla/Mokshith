# Production Database Migration Guide

## Overview

This guide provides a production-safe strategy to migrate the MongoDB database from development (`mokshith-dev`) to production (`mokshith-production`).

## Safety Architecture

The project already implements comprehensive safety mechanisms:

### Existing Safety Guards

1. **Environment-Based Database Validation** (`src/config/environmentResolver.js`)
   - Each environment (development, qa, uat, production, test) has a specific allowed database
   - Production only allows `mokshith-production`
   - Development allows `mokshith-dev` and `test`

2. **Destructive Operation Guards** (`src/utils/destructiveGuard.js`)
   - Blocks all destructive operations in production
   - Requires `DESTRUCTIVE_CONFIRM=I_UNDERSTAND_DATA_LOSS` for non-production
   - Interactive confirmation required
   - Database name validation before operations

3. **Runtime Safety Patches** (`src/config/db.js`)
   - Patches `dropDatabase()` to block in production
   - Patches `collection.drop()` to block in production
   - Applied at connection time

4. **Seed Script Safety**
   - All destructive seed scripts moved to `dangerous-dev-tools/`
   - Root-level seed scripts throw errors to prevent accidental execution
   - QA seed script uses upsert (non-destructive) and explicitly checks for production database

### Migration-Specific Safety

The migration scripts add additional layers:

1. **Export Script** (`scripts/migration/export-development.js`)
   - ONLY runs in non-production environments
   - ONLY connects to development database
   - READ-ONLY operation (never modifies data)
   - Creates timestamped JSON backup

2. **Import Script** (`scripts/migration/import-production.js`)
   - ONLY runs in production environment
   - ONLY connects to production database
   - Verifies export file before import
   - Uses upsert (merge, not overwrite)
   - Requires interactive confirmation
   - Never deletes or drops data

3. **Verification Script** (`scripts/migration/verify-production.js`)
   - READ-ONLY operation
   - Validates collections, indexes, and relationships
   - Checks for orphaned references
   - Provides detailed report

## Prerequisites

### Development Environment

- Node.js installed
- MongoDB development database accessible
- Development environment configured (`.env.development`)

### Production Environment

- Node.js installed
- Production MongoDB URI configured in **Render Environment Variables**
- `NODE_ENV=production` set in Render
- `MONGO_URI` set in Render Environment Variables

### NEVER Commit Production Credentials

Production credentials must ONLY exist in:
- Render Environment Variables

They must NEVER exist in:
- `.env` files
- `.env.example` files
- Source code
- Scripts
- Documentation
- Git history

## Migration Process

### Step 1: Export Development Database

Run this on your development machine:

```bash
cd Production/b2b-backend

# Load development environment
cp .env.development .env

# Run export script
node scripts/migration/export-development.js
```

This will:
- Connect to development database (`mokshith-dev`)
- Export all collections, documents, and indexes
- Create a timestamped JSON file in `./backups/`
- Report total collections, documents, and file size

**Example Output:**
```
📦 Starting Development Database Export
📁 Export directory: /path/to/backups
📄 Export file: /path/to/backups/mokshith-dev-export-2024-01-15T10-30-00-000Z.json
🎯 Target database: mokshith-dev

✅ Connected to MongoDB
📊 Database: mokshith-dev
📋 Found 15 collections
  📦 Exporting: users
    ✅ 125 documents, 3 indexes
  📦 Exporting: products
    ✅ 450 documents, 5 indexes
  ...

✅ Export completed successfully
📊 Total collections: 15
📊 Total documents: 1,234
📄 Export file: /path/to/backups/mokshith-dev-export-2024-01-15T10-30-00-000Z.json
📏 File size: 2.45 MB
```

### Step 2: Transfer Export File

Transfer the export file from your development machine to the production environment:

```bash
# Using scp (example)
scp backups/mokshith-dev-export-2024-01-15T10-30-00-000Z.json user@production-server:/tmp/

# Or use any secure file transfer method
```

### Step 3: Import to Production

Run this in the production environment (Render shell or production server):

```bash
cd /path/to/b2b-backend

# Ensure production environment is loaded
# MONGO_URI should be from Render Environment Variables
# NODE_ENV should be 'production'

# Run import script
node scripts/migration/import-production.js --export /tmp/mokshith-dev-export-2024-01-15T10-30-00-000Z.json
```

This will:
- Verify the export file is valid
- Verify current environment is production
- Verify target database is `mokshith-production`
- Check if production already has data
- Require interactive confirmation
- Import data using upsert (merge, not overwrite)
- Recreate indexes
- Report import statistics

**Example Output:**
```
🔍 Verifying export file: /tmp/mokshith-dev-export-2024-01-15T10-30-00-000Z.json
✅ Export file is valid
📅 Exported at: 2024-01-15T10:30:00.000Z
🎯 Source database: mokshith-dev
📋 Collections: 15

🚀 Starting Import to Production
🎯 Target database: mokshith-production

✅ Connected to MongoDB
📊 Database: mokshith-production

⚠️  WARNING: Production already has 0 collections
⚠️  This import will MERGE data using upsert (no data will be deleted)
Do you want to proceed with the import? (type 'yes' to confirm): yes

📦 Importing: users
    ✅ Imported 125 documents
📦 Importing: products
    ✅ Imported 450 documents
...

✅ Import completed successfully
📊 Total documents imported: 1,234
📊 Total errors: 0
```

### Step 4: Verify Production

Run verification script in production:

```bash
node scripts/migration/verify-production.js
```

This will:
- Verify all expected collections exist
- Check document counts
- Validate indexes
- Check relationship integrity
- Report any issues

**Example Output:**
```
🔍 Starting Production Database Verification
🎯 Target database: mokshith-production

✅ Connected to MongoDB
📊 Database: mokshith-production

📋 Collection Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ users                     125 docs  3 indexes
✅ companies                  15 docs  2 indexes
✅ products                  450 docs  5 indexes
✅ categories                 25 docs  2 indexes
✅ inventory                 450 docs  3 indexes
✅ orders                    100 docs  4 indexes
✅ payments                  100 docs  3 indexes
✅ vendors                    10 docs  2 indexes
✅ admins                      1 docs  2 indexes
✅ deliverypartners            5 docs  2 indexes
✅ addresses                 125 docs  2 indexes
✅ notifications              50 docs  2 indexes
✅ settings                    8 docs  1 indexes
✅ coupons                     5 docs  2 indexes
✅ analytics                  1 docs  1 indexes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total collections: 15
📊 Total documents: 1,234
📊 Total indexes: 38

🔍 Critical Collection Checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Users: 125 total
   - Super Admins: 1
   - Vendors: 10
   - Customers: 100
📦 Products: 450 total (450 active)
📂 Categories: 25 total
🛒 Orders: 100 total
💳 Payments: 100 total
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Relationship Integrity Checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All product category references are valid
✅ All order user references are valid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Verification Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ VERIFICATION PASSED
✅ All expected collections are present
✅ Critical data is available
✅ Relationships are intact

🎉 Production database is ready for use!
```

### Step 5: Test Application

After successful verification:

1. Start the production application
2. Test login with super admin credentials
3. Verify products are visible
4. Test order creation
5. Test payment processing
6. Verify analytics are working

## Rollback Procedure

If issues are detected after migration:

### Option 1: Re-import from Backup

If you have a previous production backup:

```bash
node scripts/migration/import-production.js --export /path/to/previous-backup.json
```

### Option 2: Manual Cleanup

If no previous backup exists, manual cleanup may be required. **This is dangerous and should only be done by experienced database administrators.**

**WARNING:** Never run destructive scripts in production. Use MongoDB Atlas console directly for emergency cleanup.

## Safety Checklist

Before running migration:

- [ ] Export file created successfully from development
- [ ] Export file verified and contains expected data
- [ ] Production environment variables configured in Render (not in .env files)
- [ ] `NODE_ENV=production` set in Render
- [ ] `MONGO_URI` set in Render Environment Variables
- [ ] No production credentials in repository
- [ ] Export file transferred securely to production environment
- [ ] Backup of current production state (if any data exists)

After migration:

- [ ] Verification script passes
- [ ] All expected collections present
- [ ] Document counts match expected
- [ ] Indexes created
- [ ] Relationships intact
- [ ] Application starts successfully
- [ ] Login works
- [ ] Products visible
- [ ] Orders work
- [ ] Payments work

## Troubleshooting

### Export Fails

**Error:** "Cannot run export script in production environment"

**Solution:** Ensure you're running export in development environment with `NODE_ENV=development` or unset.

**Error:** "Expected development database, but configured for: mokshith-production"

**Solution:** Check your `.env` file. Ensure `MONGO_URI` points to development database, not production.

### Import Fails

**Error:** "This script can only run in production environment"

**Solution:** Set `NODE_ENV=production` before running import script.

**Error:** "Expected production database, but configured for: mokshith-dev"

**Solution:** Ensure `MONGO_URI` in Render Environment Variables points to production database.

**Error:** "Export file appears to be from production database"

**Solution:** You're trying to import a production export. Use a development export instead.

### Verification Fails

**Error:** "Missing collections: users, products"

**Solution:** Import may have failed. Re-run import script and check for errors.

**Warning:** "No super admin found"

**Solution:** Development database may not have a super admin. Create one via registration or admin workflows.

## Security Notes

1. **Never hardcode production credentials** - Always use Render Environment Variables
2. **Never commit .env files** - They are in .gitignore
3. **Never run destructive scripts in production** - They are blocked by safety guards
4. **Always verify export files** - Check they're from development, not production
5. **Use secure file transfer** - When moving export files between environments
6. **Monitor logs** - Check for any unexpected errors during migration

## Existing Safety Mechanisms

The project already has robust safety in place:

1. **`src/config/environmentResolver.js`** - Enforces database names per environment
2. **`src/utils/destructiveGuard.js`** - Blocks destructive operations in production
3. **`src/config/db.js`** - Runtime patches to block drop operations
4. **`dangerous-dev-tools/`** - Destructive scripts isolated from application
5. **`scripts/db/seed-qa.js`** - Non-destructive QA seeding with production guard

The migration scripts build on this foundation with additional safety checks specific to the migration workflow.

## Support

If you encounter issues not covered in this guide:

1. Check the error message carefully
2. Verify environment variables are correct
3. Ensure you're using the correct environment (dev vs prod)
4. Review the safety checks in the migration scripts
5. Check MongoDB Atlas console for database status

## Summary

This migration strategy is production-safe because:

- ✅ Never connects to dev and prod simultaneously
- ✅ Never hardcodes production credentials
- ✅ Never commits production credentials
- ✅ Never runs destructive operations in production
- ✅ Uses upsert (merge) instead of overwrite
- ✅ Requires interactive confirmation
- ✅ Verifies environment before operations
- ✅ Verifies database names before operations
- ✅ Provides detailed verification
- ✅ Leverages existing safety infrastructure
