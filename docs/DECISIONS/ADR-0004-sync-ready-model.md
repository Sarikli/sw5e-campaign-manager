# ADR-0004: Sync-ready from day one; operation log for HP/resources

Status: Proposed
Context: Cloud sync comes in Phase 6 but retrofitting identity/versioning is costly.
Decision: UUIDs, version/timestamps/tombstones/device id, sync_outbox, and append-only action_log exist from schema v1. HP/resource changes are recorded as operations and merged by delta; other entities use revision-aware conflict handling.
Consequences: Slight write overhead now; no history migration later; conflicts never silently overwrite.
