# QA Dataset Builder — Reporting

Report contents
- Summary: manifest version, run-id, target DB, start/end time, duration.  
- Counts: per-collection counts before/after generation.  
- Errors: fatal errors with stack traces.  
- Warnings: validation warnings and tolerances.  
- Skipped: items skipped due to idempotency or existing data.  
- Execution time: per-stage timings.  
- Validation summary: pass/fail and detailed diffs (comparer output).

Artifacts
- JSON report (machine-readable), HTML summary (human), and raw logs (structured).

Retention
- Store reports in a central artifact store with naming: `qa-gen/<manifest>-<version>/<run-id>/report.*`.

