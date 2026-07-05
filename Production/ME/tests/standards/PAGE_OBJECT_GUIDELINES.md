PAGE OBJECT GUIDELINES
======================

Purpose
-------
Define page-object responsibilities, composition, and interaction patterns.

Guidelines
- Page objects expose intent-driven actions (e.g., login, addToCart) not low-level clicks.
- Keep locators inside selectors/ and reference them from page objects.
- Prefer composition over inheritance for shared UI elements.

