Test Artifacts — centralized storage (outside framework)
=======================================================

Purpose
-------
Keep all execution artifacts outside the automation codebase to keep the framework repository clean. CI should persist artifacts to this top-level location or a dedicated artifacts store.

Structure
- reports/
- videos/
- screenshots/
- traces/
- results/
- downloads/
- logs/

Retention notes
- Define retention policy in CI (e.g., keep last 30 runs).

