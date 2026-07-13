# QA Dataset Builder — Configuration

Key configuration options

- Environment  
  - target: `qa` (required) — ensures builder targets `mokshith-qa`.

- Dataset Version  
  - manifest version to apply (v1, v2 ...).

- Target Database  
  - Mongo URI explicitly provided (do NOT use production URI).

- Strict Mode  
  - If true, pipeline aborts on any validation warning.

- Dry Run  
  - Simulates actions and reports expected changes without executing writes or application flows.

- Logging  
  - Log level, run-id, structured logs sink (file, S3, ELK).

- Validation  
  - Which validators to run and thresholds (counts tolerances).

- Rollback  
  - Snapshot settings (create pre-run snapshots, post-run snapshot), retention policy.

Secrets & Permissions
- Builder requires a service account scoped to QA project with least privilege (create/update on QA DB, no production access).
- Payment sandbox keys and any 3rd-party sandbox credentials passed via secrets manager (not stored in repo).

