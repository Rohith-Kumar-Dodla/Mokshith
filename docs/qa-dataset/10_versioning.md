# QA Dataset Manifest — Versioning

## Versioning model
- Use semantic-like versions: v1, v2, v3… Each version is a snapshot of the manifest (fixtures + generation instructions).  
- Changes to manifest that alter required collections, reference data, or generation flows increment the minor version; breaking changes increment major.

## v1 (initial)
- Contains reference data, entities list, generation order, validation checklist, and test account conventions.

## Migration strategy
- For new manifest versions: provide compatibility notes and a migration preview via `scripts/migration/preview.js` (read-only) to validate structural changes.

## Backward compatibility
- Generation flows should be able to detect manifest version and adapt where possible. Test harnesses should record manifest version used.

## Governance
- Every manifest version change requires PR, changelog, and sign-off.

