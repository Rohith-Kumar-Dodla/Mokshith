# QA Dataset Builder — Security

Permissions
- Builder service account must be scoped to QA project only (create/update on `mokshith-qa`). No access to production clusters or secrets.

Environment protection
- Builder validates target DB against allowed list (environmentResolver policy). Builder aborts if target not allowed.

Forbidden targets
- Production clusters (mokshith-production) must be explicitly forbidden at runtime and by policy.

Secrets handling
- Payment sandbox keys and other credentials fetched from secure secret manager; not stored in repo.

Audit & Logging
- All builder actions logged with run-id, actor, and temporal trace for compliance.

