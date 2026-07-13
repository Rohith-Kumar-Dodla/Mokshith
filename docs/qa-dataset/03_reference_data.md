# QA Dataset Manifest — Reference Data

This document lists static reference datasets that are stable and required across the platform. These should be provided as fixtures and versioned.

## Companies (platform / vendor parents)
- Purpose: owner records for vendor accounts.  
- Recommended: 12 canonical entries (platform, logistics partner, 10 vendor companies).

## Categories
- Purpose: product taxonomy.  
- Recommended: 25 entries (6 top-level + subcategories).

## Warehouses
- Purpose: inventory locations.  
- Recommended: 3 regional warehouses with addresses and contact info.

## Settings / Feature Flags
- Purpose: global flags and environment toggles.  
- Examples: ENABLE_REGISTRATIONS, AUTH_STRICT_MODE, FEATURE_X_ENABLED.

## Promotions / Coupons
- Purpose: price adjustments for test flows.  
- Example entries: 10 promo codes (percentage & fixed).

## Countries / States / Cities
- Purpose: shipping validation and address normalization.  
- Include: primary operating country + a sample of states/cities.

## Currencies / GST / Tax rules
- Purpose: pricing and tax calculation.  
- Include: default currency, tax slabs, GST entries for products.

## Notes
- All reference data must use non-sensitive placeholder values and be versioned (file-based YAML/JSON fixtures).

