# QA Dataset Generation — Strategy

Purpose
- Define the design principles and governance for producing the official QA dataset (spec only).

Goals
- Produce deterministic, repeatable QA data that exercises production workflows without using real PII.
- Ensure generation is idempotent, auditable, and safe to run in the QA environment (mokshith-qa).

Principles
- Deterministic: given the same inputs and manifest version, generation produces identical logical dataset.
- Repeatable: generation steps can be re-run to refresh QA (with snapshot/backup).
- Idempotent: safe to run multiple times; final state predictable.
- Non-destructive: generation never touches production; always targets mokshith-qa.
- Application-driven: transactional data created by the application flows whenever possible.

Deterministic generation
- Use canonical fixture manifests for reference data (categories, warehouses).
- Use seeded pseudorandom generators with a fixed seed for synthetic identifiers.

Repeatability & Idempotency
- Use an orchestration layer that records run-id and manifest-version; check existing resources and update/skip accordingly.

Rollback
- Always snapshot QA before generation; preserve previous snapshot for quick rollback.

Validation & Versioning
- Each generation run produces a validation report (inspector/comparer + business checks).
- Manifest versioning (docs/qa-dataset/versioning) governs compatibility.

Environment isolation
- All generation orchestration runs in the QA project/cluster with dedicated service account; no access to production credentials.

