# QA Dataset Builder — Architecture

Purpose
- Provide a formal design for a repeatable, safe, auditable, and enterprise-grade QA Dataset Builder that creates QA datasets according to the manifest. This document is design-only and does not implement generation.

Goals
- Produce deterministic, idempotent dataset builds for mokshith-qa.  
- Enforce safety: never touch production; require explicit target DB.  
- Support dry-run, validation, rollback, reporting, and observability.

Responsibilities
- Orchestrate generation pipeline driven by manifest version.  
- Validate manifests and environment preconditions.  
- Coordinate application-driven transactional generation (via Playwright/API driver).  
- Produce post-run validation and reports.

Non-responsibilities
- The Builder does NOT perform direct DB writes for transactional data — those are created via application workflows.  
- The Builder does NOT change application code or infra.

Builder lifecycle (high level)
1. Prepare: load manifest, environment, credentials (read-only for source; write creds for QA).  
2. Validate: manifest schema, allowed target, prerequisites.  
3. Plan: compute dependency graph and generation plan.  
4. Execute (idempotent stages): reference fixtures → accounts → business entities → application-driven transactions.  
5. Verify: run validators (inspector/comparer, business checks).  
6. Report: produce artifact with counts, diffs, and validation results.  
7. Snapshot: taking pre/post snapshots for rollback readiness.

