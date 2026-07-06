# QA Dataset Builder — Modules

The Builder is modular. Each module has a single responsibility and exposes well-defined interfaces.

Modules

- Manifest Reader  
  - Responsibility: load manifest files (docs/qa-dataset) and version metadata.  
  - Inputs: manifest path/version.  
  - Output: in-memory manifest model.

- Validator (manifest schema)  
  - Responsibility: validate manifest shape, required fields, and version compatibility.  
  - Uses JSON schema or equivalent.

- Dependency Resolver  
  - Responsibility: compute generation order from manifest (topological sort).  
  - Outputs execution plan with stages and parallelism hints.

- Reference Generator  
  - Responsibility: apply reference fixtures (companies, categories, warehouses, settings).  
  - Mode: deterministic fixture loader (idempotent).

- User Generator  
  - Responsibility: create admin/vendor placeholders (fixtures) and orchestrate customer registration flows for bulk customers via APIs.  
  - Note: transactional user sessions created by app flows (not direct DB writes).

- Business Entity Generator  
  - Responsibility: create canonical products, promotions and prepare inventory entries (via inventory APIs).  
  - Ensures vendors own products and products map to categories.

- Transaction Generator  
  - Responsibility: drive application flows (Playwright or headless API runners) to create orders, payments, shipments, refunds, and notifications.  
  - Must use sandboxed payment providers.

- Integrity Validator  
  - Responsibility: post-run checks (referential integrity, counts, index presence, business constraints).  
  - Uses inspector/comparer + business rule checks.

- Reporter  
  - Responsibility: compile run report (counts, errors, warnings, durations, manifest version).  
  - Produce artifacts (JSON + human-readable).

- Logger / Audit Trail  
  - Responsibility: detailed operation logs, run-id, step traces, inputs and outputs for reproducibility.

- Rollback Manager  
  - Responsibility: orchestrate restore from snapshot if fatal errors occur; do not attempt partial DB surgery.  
  - Steps: halt runs, restore snapshot, re-run preflight if needed.

Module integration
- Modules communicate via a typed execution plan and publish events to the Logger and Reporter. Each module must implement dry-run and preview modes.

