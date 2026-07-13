# QA Dataset Generation — Transaction Rules (Prohibitions)

Collections that MUST NEVER be manually inserted or modified outside application workflows:
- orders
- payments
- invoices
- shipments
- refunds
- notifications
- audit logs
- refreshTokens
- passwordResetTokens
- coupon usage / reward points ledger

Why
- These collections require full business logic, side effects, idempotency and worker processing. Manual insertion bypasses validation, inventory reservation, payment reconciliation and produces false negatives/positives in QA.

Allowed interactions
- Read-only inspection (inspector/comparer).  
- Reconciliation tests via application flows only.

