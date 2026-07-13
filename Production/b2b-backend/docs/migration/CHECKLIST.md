Migration Preparation Checklist (read-only)

1. Verify access:
   - Obtain read-only MongoDB URIs for source and destination.
   - Ensure credentials have listCollections and count privileges.

2. Run migration preview:
   - Use explicit URIs: `node scripts/migration/preview.js --source "<SRC>" --dest "<DST>"`

3. Review comparison report:
   - Confirm collections present in source exist in destination.
   - Review document count deltas and index differences.

4. Fix destination environment if needed:
   - Create missing collections/indexes manually or via migration plan (outside these tools).

5. Re-run preview until report shows Ready.

6. Prepare verification utilities (to be used post-migration):
   - Document how to run verification scripts (counts, indexes).

