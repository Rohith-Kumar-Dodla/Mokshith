# QA Dataset Generation — Version Strategy

Versioning model
- Manifest-driven versioning (v1, v2, v3...). Each generation run records manifest version.

Version contents
- Reference fixtures, generation layers, validation rules, and tolerated deltas.

Upgrade path
- Provide migration notes between versions. If v2 changes schema/indexes, generate compatibility report via comparer.

Backward compatibility
- Where possible keep generation flows backward compatible; otherwise provide transformer scripts (design only) and migration preview.

