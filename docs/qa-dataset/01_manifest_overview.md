# QA Dataset Manifest — Overview

## Purpose
This manifest is the canonical, version-controlled specification for the official QA dataset used by the Mokshith platform. It defines what data belongs in QA, how it is organized, ownership, constraints, and governance — without creating or modifying any data.

## Goals
- Provide a single source of truth for QA dataset structure and content.  
- Ensure QA behaves like production for functional, regression, and performance tests.  
- Make dataset generation repeatable, auditable, and safe (no real PII).  
- Ensure all flows (checkout, payments, shipments, refunds, notifications) can be exercised by tests.

## Scope
- Collections required to exercise application behavior (users, companies, vendors, categories, products, inventory, warehouses, orders, payments, shipments, notifications, audits, settings).  
- Reference/static data used across the app (countries, currencies, GST/tax rules, feature flags).  
- Test accounts and naming conventions.

## Non-goals
- This document does NOT perform data generation or include seed scripts.  
- It does NOT prescribe storage or infra changes for Atlas.  
- It does NOT contain production PII or credentials.

## Versioning strategy
- The manifest is versioned using semantic-like increments (v1, v2, ...). Each change must include: rationale, diff, compatibility notes, and migration (spec-only) plan.  
- Changes require review and sign-off by QA, Engineering, and Security.

## Environment usage
- QA dataset targets the `mokshith-qa` database only.  
- `mokshith-dev` remains for development. `test` is legacy rollback. `mokshith-uat`/`mokshith-production` unaffected by QA dataset management.

