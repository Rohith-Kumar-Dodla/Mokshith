# QA Dataset Manifest — Generation Order

Follow this exact order when provisioning QA fixtures and generation flows. This ensures referential integrity and that business rules are enforced by the application.

1. Reference data (countries, currencies, tax rules, feature flags, settings)  
2. Companies (platform + vendor parents)  
3. Warehouses (addresses + regions)  
4. Categories (taxonomy + images)  
5. Admins & SuperAdmin (fixture)  
6. Vendor companies & Vendor users (create vendor account via onboarding)  
7. Products (created by vendors; some canonical products seeded as fixtures)  
8. Inventory (per product × warehouse)  
9. Customers (registration flows)  
10. Addresses for customers (shipping & billing)  
11. Promotions & coupons (fixtures)  
12. Order generation (application checkout flows to create orders & payments)  
13. Shipments (fulfillment flows)  
14. Refunds / returns (via application flows)  
15. Reports / analytics runs

Notes:
- Steps 12–14 must be executed by application flows (API/Playwright) to ensure business logic and workers are triggered.

