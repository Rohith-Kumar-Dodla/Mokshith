# QA Dataset Generation — Dependency Graph & Rationale

Canonical dependency order (explanation below):

Companies
↓
Admins (SuperAdmin seeded)
↓
Vendors (companies)
↓
Warehouses (addresses)
↓
Categories
↓
Products (vendors × categories)
↓
Inventory (product × warehouse)
↓
Customers (users) + Addresses
↓
Orders (application checkout)
↓
Payments (payment provider / sandbox)
↓
Shipments / Logistics (fulfillment)
↓
Notifications / Audit / Analytics

Why each dependency exists
- Companies must exist before vendors (vendor.companyId).  
- Admins exist to manage approvals and product publishing.  
- Vendors require companies and user accounts.  
- Warehouses required before inventory.  
- Categories are needed for product classification.  
- Products reference vendor & category; inventory references product & warehouse.  
- Customers must exist before orders.  
- Orders reserve inventory and create payments/shipments.  
- Payments/Shipments create notifications and audit logs.

