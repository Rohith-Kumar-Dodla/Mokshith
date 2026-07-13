# QA Dataset Builder — Execution Pipeline

Pipeline stages (linear with optional parallelism)

1. Read Manifest  
  - Manifest Reader loads docs/qa-dataset manifest version and fixtures metadata.  
  - Output: manifest model and run-id.

2. Validate Manifest  
  - Validator checks schema, required reference data, versioning, and that target DB is allowed.  
  - Abort on schema or safety violations.

3. Dependency Resolution  
  - Dependency Resolver computes ordered stages and per-stage parallelism (e.g., products per vendor).

4. Generate Reference Data (Layer 1)  
  - Reference Generator applies fixtures for categories, warehouses, settings.  
  - Mode: idempotent apply (create-or-update).

5. Generate Users (Layer 2)  
  - User Generator seeds admin/superadmin fixtures and orchestrates vendor registration flows; customers created via API flows or fixture depending on scale.

6. Generate Business Entities (Layer 3)  
  - Business Entity Generator creates products and promotions via vendor APIs or canonical fixtures; then seeds inventory via inventory APIs.

7. Validate Relationships (pre-transaction)  
  - Integrity Validator runs referential checks before creating transactions.

8. Execute Application Workflows (Layer 4)  
  - Transaction Generator drives checkout/payment/fulfillment via Playwright or API runners to create orders, payments, shipments, notifications, audit logs.
  - Idempotent drivers: use run-id and idempotency keys.

9. Validate Dataset (post-run)  
  - Integrity Validator executes full validation rules (counts, approvals, inventory consistency, payment reconciliation).

10. Generate Report & Snapshot  
  - Reporter produces JSON and human reports and triggers Snapshot capture for rollback.

Modes
- Dry-run: simulate actions, produce plan and expected results.  
- Strict: fail-fast on any validation breach.  
- Retry: resume failed stages idempotently.

