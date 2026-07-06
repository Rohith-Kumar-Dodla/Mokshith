# QA Dataset Manifest — Transactions (policies)

## Principle
Transactions that affect business state (orders, payments, shipments, invoices, refunds, notifications, auth tokens) MUST be generated via application workflows. They must NOT be manually inserted.

## Collections that MUST NOT be manually inserted
- orders, payments, shipments, invoices, refunds, notifications, audit logs, refreshTokens, passwordResetTokens.

## Why
- Application flows enforce business validations (inventory reservation, pricing, taxes, idempotency). Manually inserting undermines test fidelity and may bypass workers and side effects.

## Generation approach
- Use automated API-based generators or Playwright flows to create transactions in QA. Tests should use sandboxed payment providers (Razorpay test).

## Observability
- Each transaction should produce notification and audit entries; verify worker processing.

