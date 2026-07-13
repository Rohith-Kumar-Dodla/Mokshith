# QA Dataset Builder — Error Handling

Failure modes and responses

- Retry  
  - For transient errors (network, timeouts), implement exponential backoff and limited retries per stage.

- Continue (best-effort)  
  - For non-critical validation warnings, continue if in non-strict mode; log warnings in report.

- Abort  
  - For fatal errors (schema mismatch, target not allowed, snapshot failure), abort pipeline and trigger rollback if configured.

- Rollback  
  - If configured and fatal error occurs after data-changing stages, restore QA from pre-run snapshot and report.

- Fatal vs Recoverable  
  - Fatal: target database not allowed, missing critical fixtures, snapshot failure.  
  - Recoverable: external API timeout, worker transient failure, minor validation warnings.

Observability
- Emit structured events for each stage start/complete/error for monitoring and alerting.

