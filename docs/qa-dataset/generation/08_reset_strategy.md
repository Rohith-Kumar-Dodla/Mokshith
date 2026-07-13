# QA Dataset Generation — Reset & Refresh Strategies

Development resets
- Local dev resets use `USE_IN_MEMORY_MONGO=true` or local docker compose; jobs are developer-controlled.

QA resets
- Recommended flow:
  1. Snapshot current QA cluster (Atlas snapshot).  
  2. Drop non-reference transactional data (via controlled orchestration or restore from snapshot) — but prefer full restore from snapshot.  
  3. Reapply reference fixtures and re-run generation flows (application-driven) to repopulate transactional data.  

UAT resets
- UAT should have stricter refresh cadence (less frequent). Use snapshot/restore and controlled generation.

Production
- Never reset in production. Only emergency restore via backup and runbook.

Recovery
- If generation fails, restore QA from pre-generation snapshot and re-run generation after addressing issue.

