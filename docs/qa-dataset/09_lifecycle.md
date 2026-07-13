# QA Dataset Manifest — Lifecycle

## Stages
- Development: dataset iterated locally for feature development.  
- Testing (QA): stable dataset used by automated regression and manual testers.  
- Regression: branching datasets used to test release candidates.  
- Release: QA verifies release candidates; UAT used for business validation.

## Refresh strategy
- Periodic refresh cadence (e.g., weekly) with snapshotting and sanitization.  
- Use read-only previews before refresh; keep rollback snapshot.

## Reset strategy
- Controlled reset procedure: backup → reset → restore canonical reference fixtures → run generation flows (application-driven) to repopulate transactions.

## Rollback strategy
- Maintain daily snapshot(s) of QA. If a generation or test run corrupts dataset, restore snapshot and re-run generation steps.

## Ownership & change control
- Dataset changes require PR to manifest docs and sign-off from QA, Security, and Platform teams.

