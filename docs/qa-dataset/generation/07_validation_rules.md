# QA Dataset Generation — Validation Rules

Automated validation should include:

1. Counts
- Verify expected collection counts (tolerance thresholds where applicable).

2. Relationships
- Every order.userId references existing user.  
- Every order.item.productId references existing product.  
- Inventory rows reference existing product & warehouse.

3. Approvals
- Vendor approval status matches product publishability.

4. Inventory
- For each product: totalInventory = sum(warehouse.stock) ≥ reservedStock; no negative stock.

5. Payments
- Payment amount matches order total; reconciliation metadata present for online payments.

6. Shipments
- Shipment status transitions valid and timestamps present.

7. Notifications & Audit
- Each major event (order placed, payment success/failure, shipment update) creates a notification and an audit log.

8. Health checks
- /api/v1/health reports database healthy and workers connected.

Tools
- Use inspector/comparer, health endpoint, and application-level smoke tests (auth, checkout, order view).

