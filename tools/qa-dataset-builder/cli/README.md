# QA Dataset Builder CLI

Commands (framework placeholders)

- dataset:generate  → Not implemented
- dataset:validate  → Not implemented
- dataset:report    → Not implemented
- dataset:dry-run   → Executes framework validation and outputs report
- dataset:reset     → Not implemented
- dataset:rollback  → Not implemented

Usage:

```
node tools/qa-dataset-builder/index.js dataset:dry-run
```

Developer tests:

Run unit tests for generators (mocks only):

From repo root:
```
node --test --testNamePattern=generators
```

