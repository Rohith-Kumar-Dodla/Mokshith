# QA Dataset Builder — Validation

Validation categories

Entity validation
- Required fields present, types match schema, unique keys enforced (SKU, email, mobile).

Relationship validation
- Foreign keys (order.userId, order.items[].productId, inventory.productId, inventory.warehouseId).

Reference validation
- Categories, warehouses, currency codes exist and match fixtures.

Approval validation
- Vendors/products in correct approval states relative to workflow.

Inventory validation
- stock >= reservedStock; total stock equals sum across warehouses; reservation logic consistent with orders.

Order validation
- Order totals match item prices + taxes + shipping; order status transitions valid.

Payment validation
- Payment amounts reconcile; sandbox provider metadata present for online payments.

Shipment validation
- Shipment linked to order; status history valid.

Notification & audit validation
- Event count >= expected for major flows; audit entries present for state changes.

Validation mechanics
- Use inspector/comparer for structural checks and bespoke queries for business rules. Produce pass/fail and tolerance metrics.

