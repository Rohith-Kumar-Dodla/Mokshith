# Admin V2 Pre-Next Dashboard Fixes Report

## 1. Issues Found

The six requested areas were reviewed: cart/checkout promotions, product deletion cleanup, inventory visibility, Admin Orders filters, manual order status controls, and delivery assignment confirmation/error handling.

## 2. Root Causes

- Cart responses contained only product and quantity. Promotion pricing existed in order creation, but the cart and frontend mapper recalculated only legacy bulk pricing.
- Product deletion hard-deleted the Product document without pulling its id from Promotion.productIds.
- Inventory population returned rows whose product populated as `null` or inactive; the UI could render these as unknown/stale rows.
- Orders rendered every existing filter as a separate control.
- Order Management still rendered a manual status-transition section even though delivery lifecycle synchronization is the canonical delivery-driven status path.
- Delivery assignment errors were only placed in the page-level hook state while the confirmation dialog swallowed the caught error, making the action appear to do nothing.

## 3. Fixes

- Cart reads, adds, and removals now resolve current active promotions through the existing `calculateLinePricing` and `applyBestProductPromotion` utilities. The response includes authoritative per-line pricing and subtotal, discount, tax, delivery, and grand-total values.
- The frontend cart mapper consumes backend pricing rather than inventing client-only promotion amounts. Cart and checkout continue to use the same mapped totals.
- Hard product deletion now removes the product from all promotion target arrays. Inactive products are excluded from eligible cart pricing and inventory output.
- Inventory queries populate only active products and the service excludes null/orphan references before returning normal list/low-stock results. Inventory stock/reservedStock authority is unchanged.
- Orders retains Total, Completed, and COD summary cards. Existing filters are grouped under one responsive `Filters` control with an active-count indicator and clear action.
- The manual `Update Status` section and controls were removed from Admin Order Management. Logistics, DeliveryOffer, and order-status synchronization endpoints remain intact.
- Delivery assignment already uses the existing Logistics → DeliveryOffer flow, including server-side partner validation, route distance/amount calculation, idempotency, concurrency conflicts, notifications, and realtime events. The dialog now displays the actual backend error inline; Confirm remains disabled while submitting and the focused refresh remains in place.

## 4. Discount Flow

`Product → Promotion.productIds → cart read/add/remove → authoritative cart line pricing → checkout totals → existing order creation recalculation → persisted Order.items totals`

Order creation remains backend-authoritative and recalculates against current Product/Promotion state; frontend totals are never trusted for persistence or payment amount.

## 5. Product Deletion / Discount Cleanup

The repository uses hard product deletion. The product service now performs the existing delete and then `$pull`s the deleted id from all Promotion.productIds relationships. Inactive products are not eligible for active product promotion display, cart pricing, or inventory listing.

## 6. Inventory Filtering

Inventory continues to use `Inventory.stock` and `Inventory.reservedStock`. Server-side population matches active products only, and service responses remove null populated references. Unknown/orphan records are excluded from normal inventory and are not silently deleted.

## 7. Order UI Changes

Total, Completed, and COD remain. Search remains. Status, payment method, payment status, delivery, and date filters are available inside one responsive Filters control. Clearing filters resets all filter state. Manual Update Status controls are removed; delivery state remains delivery-driven.

## 8. Delivery Assignment

The existing assignment API is `/api/v1/logistics/:id/offers`, with shipment creation through `/api/v1/logistics/:orderId` when required. The frontend preserves the canonical offer flow and now surfaces validation, authorization, conflict, already-assigned, network, and unexpected errors in the assignment dialog/page via the existing API error mapper. Duplicate confirmation is prevented by the existing loading guard and request idempotency key.

## 9. Tests

- Frontend focused suite: **4 files, 13 tests passed**.
- Backend focused suite: **4 suites, 24 tests passed**.
- `git diff --check`: passed with existing line-ending warnings only.

New browser/live database regression execution was not available in this run; existing focused tests were used.

## 10. Build

- Frontend production build: **passed** (`vite build`).
- Backend focused Jest execution: **passed**.

## 11. Browser Verification

### PASS

- Frontend production compilation.
- Existing focused frontend unit/component tests.
- Existing focused backend unit tests.

### BLOCKED

- Live browser verification of discount, inventory, order, and delivery flows was not run because no authenticated live environment/data was available in this session.

### NOT RUN

- Full Playwright suites and database-backed end-to-end order/delivery regression tests.

## 12. Remaining Issues

Live browser/database verification remains outstanding. Existing unrelated worktree changes were preserved and not cleaned up. Delivery Partner V2 UI was not redesigned.
