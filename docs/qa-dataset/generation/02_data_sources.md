# QA Dataset Generation — Data Sources

For each entity, specify the canonical source and generation method.

Reference data
- companies, categories, warehouses, currencies, countries, tax rules, feature flags  
- Source: fixtures (versioned manifest) — created manually and reviewed; loaded by orchestration.

Admin / bootstrap accounts
- Super Admin, core Admins  
- Source: bootstrap + deterministic fixture (controlled); minimal fixture creation only.

Vendors & Products
- Vendor accounts: onboarding flows (application) OR controlled fixture for canonical vendors.  
- Products: created by vendor APIs (preferred) or canonical product fixtures for core SKUs.

Inventory
- Generated programmatically after products/wr warehouses exist; authoritative via inventory APIs.

Customers & Addresses
- Generated via registration APIs or deterministic fixture for some accounts; addresses via address APIs.

Orders / Payments / Shipments / Notifications / Audit
- MUST be generated via application flows (Playwright or headless API jobs) to trigger business logic and workers.

Analytics / Reports / Events
- Generated from application activity or synthetic event generators (controlled).

Summary
- Use fixtures only for static/reference and admin bootstraps; generate transactional data via the app.

