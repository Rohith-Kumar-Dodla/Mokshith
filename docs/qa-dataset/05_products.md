# QA Dataset Manifest — Products

## Product strategy
- Aim for production-like variety: SKUs, variants, categories, pricing tiers, and images. Avoid PII.

## Category mapping
- Ensure every product maps to one category and optionally a subcategory. Categories should be balanced but varied.

## Vendor mapping
- Products distributed across 10 vendor accounts; vendors should own their product lists.

## Inventory strategy
- Each product has inventory rows for each warehouse (3). Inventory is the authoritative source of available stock; the product `stock` field may be a cached summary.
- Include product states: ACTIVE, DRAFT, INACTIVE, REJECTED.

## Pricing strategy
- Products should have realistic prices across ranges (low, mid, high). Include currency and tax-related fields.

## MOQ strategy
- Use varied MOQs: 1, 5, 10, 50 depending on product type.

## Images
- Use placeholder image URLs or shared Cloudinary test folder references. Each product should have at least 1 image; some have 3.

## Approval state
- Products created by vendors default to DRAFT and must go through admin approval to become ACTIVE. QA must include approved and unapproved products.

## Edge cases
- Products with zero stock (out-of-stock), products with very high MOQ, discontinued products, products with invalid/missing images.

