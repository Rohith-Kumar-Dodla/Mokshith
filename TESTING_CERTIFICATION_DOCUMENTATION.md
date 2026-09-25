# Testing and Certification Documentation

## Admin V2 final lock

Admin V2 is final/locked for the agreed Admin scope. Certification evidence is recorded in `ADMIN_V2_FINAL_CERTIFICATION_REPORT.md`.

## Executed focused commands

- Frontend: `npm.cmd run build` — passed.
- Frontend: `npm.cmd test -- --run src/pages/Admin/Admin.hardening.test.jsx src/hooks/useSettings.test.js src/services/settingsService.test.js` — 3 files, 6 tests passed.
- Backend: `npm.cmd test -- --runInBand tests/integration/product.integration.test.js` — 35 tests passed.
- Backend: `npm.cmd test -- --runInBand tests/unit/bulkPricing.utils.test.js` — 14 tests passed.
- Backend: `npm.cmd test -- --runInBand tests/integration/settings.integration.test.js tests/integration/notification.worker.test.js` — 2 suites, 6 tests passed.
- Backend changed files: `node --check` passed for touched support, notification, settings and Phase 3 modules.
- Repository: `git diff --check` passed.

## Environment limitations

Playwright/API live certification and three-run browser certification require running services, seeded role accounts and deployment-specific origins. They were not claimed as passed in the final report. The full pre-existing backend suite is broader than the focused closure set and was not used as a blanket certification claim.
