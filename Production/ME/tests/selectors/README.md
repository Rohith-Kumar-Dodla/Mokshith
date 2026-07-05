Selectors — Centralized UI locator strategy
==========================================

Purpose
-------
Centralize all UI selectors so locator updates for UI changes are made in one place. Each module gets its own selector file to keep selectors small and maintainable.

Structure (per-module files)
- auth.selectors.md
- public.selectors.md
- vendor.selectors.md
- admin.selectors.md
- products.selectors.md
- categories.selectors.md
- inventory.selectors.md
- orders.selectors.md
- checkout.selectors.md
- payments.selectors.md
- shared.selectors.md

Guidelines
- Prefer data-testids or dedicated automation attributes.
- Keep selectors resilient: avoid brittle XPath based on text, prefer stable attributes.
- Document intended scope and example usage in each module selector file.

