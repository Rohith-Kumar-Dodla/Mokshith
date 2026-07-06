# QA Dataset Generation — Rules per Collection

General principles
- Reference data: deterministic fixtures; regeneratable and versioned.  
- Transactional data: application-driven; should not be injected manually.

Rules (summary)
- companies: can be regenerated (fixture), updated, not deleted (soft-delete only).  
- users: SuperAdmin/Admin fixtures immutable identifiers; vendor/customer accounts created/updated via app flows. Deletion: soft-delete.  
- vendors: can be recreated by onboarding; approval changes via admin workflows.  
- categories: regeneratable via fixtures; updates allowed.  
- products: created by vendors via APIs; can be updated; avoid manual recreation except canonical products.  
- inventory: can be recreated but source of truth for stock; updates via inventory APIs.  
- orders/payments/shipments/invoices/refunds/notifications/audit: MUST NOT be manually inserted; generated via app flows.  
- analytics/events: regeneratable but ephemeral.

Immutability
- Keys such as SKU, user identifier, and invoice numbers should be stable per manifest version.

