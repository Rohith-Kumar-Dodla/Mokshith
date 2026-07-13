CI — pipeline templates and guidance
===================================

Purpose
-------
Contain CI pipeline templates and guidance for GitHub Actions, Jenkins, GitLab CI, and Azure DevOps. This folder holds architecture and required steps (no workflows included in scaffold).

Planned structure
- github/README.md
- jenkins/README.md
- gitlab/README.md
- azure/README.md

Guidelines
- Define stages: install, unit, api, smoke, parallel-e2e, artifact-collection, nightly-regression.
- Include matrix strategy for cross-browser runs.

