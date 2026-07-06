# QA Dataset Manifest — Validation Checklist

Use this checklist to validate dataset integrity after generation (automated where possible).

## Referential integrity
- Every order.userId points to an existing user.  
- Every productId referenced in orders exists and is active or was active at the time of order.  
- Every shipment.orderId references an existing order.

## Unique constraints
- SKUs and emails/mobiles are unique per schema.  
- Indexes must match production expectations.

## Approval workflows
- Vendors with status=APPROVED appear in vendor lists; pending vendors cannot create active products.

## Inventory consistency
- For each product: inventory.stock >= 0 and inventory.reservedStock ≤ inventory.stock.  
- No negative stock after simulated concurrent orders.

## Payment consistency
- Payment amounts reconcile to order totals.  
- Refunds reference valid payments and are idempotent.

## Shipment consistency
- Shipment status transitions are valid and timestamps exist for each transition.

## Health checks
- GET /api/v1/health → database healthy, queue worker health acceptable, redis connected.

## Worker verification
- Workers processed sample jobs; queue depths acceptable.

## Tools
- Use existing inspector/comparer and health endpoints to automate checks.

