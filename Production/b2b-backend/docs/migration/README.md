# Migration Preparation & Validation (Read-only)

This document describes the read-only migration preparation utilities included in the repository.
They are strictly non-destructive: they only inspect databases and report differences.

## Location
- Scripts: `scripts/migration/preview.js`
- Utilities: `src/utils/migration/inspector.js`, `src/utils/migration/comparer.js`

## Goals
- Validate connectivity and basic health of source/destination databases.
- Compare collections, document counts, and index differences (no schema changes).
- Produce a dry-run "Migration Preview" report.
- Provide verification utilities for later migration verification (not implemented here).

## Usage
1. Provide URIs explicitly (do not rely on local `.env` to avoid accidental runs):

```
node scripts/migration/preview.js --source "<SRC_MONGO_URI>" --dest "<DST_MONGO_URI>"
```

Or set environment variables (preferred in automation):

```
MIGRATION_SOURCE_URI="mongodb+srv://user:pass@.../test" MIGRATION_DEST_URI="mongodb+srv://user:pass@.../mokshith-dev" node scripts/migration/preview.js
```

## Output
- Source / Dest summaries (db name, collections, approximate document counts)
- Comparison:
  - Collections only in source
  - Collections only in dest
  - Collections in both with per-collection counts and index differences
- Result: `Ready` or `Not Ready (mismatched collections)`

## Safety
- This tool uses read-only operations (countDocuments, listCollections, indexes).
- It never writes, deletes, or modifies data.

## Rollback Guidance (if migration later fails)
- Restore Atlas backup snapshot (prioritize point-in-time if available).
- Restore mongodump export.
- Reconnect applications to previous database until data is verified.
- Keep production settings immutable until rollback confirmed.

