# ADR-0002: Store choices, derive stats

Status: Proposed
Context: Level-ups, equipment, effects and sync conflicts make stored derived numbers fragile.
Decision: Persist only choices and tracked state (HP, resources, inventory); compute all derived stats in the domain engine. Manual overrides are explicit, stored, and audit-logged.
Consequences: Engine must be fast and cacheable; stats always consistent; conflicts merge on choices/deltas, not computed values.
