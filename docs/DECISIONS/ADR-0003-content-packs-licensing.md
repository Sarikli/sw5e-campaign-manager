# ADR-0003: Content packs; no bundled third-party content until licensed

Status: Proposed
Context: Inspection (DATA_SOURCES.md) found MIT code license in sw5e-module but no established redistribution rights for content/art; ATTRIBUTION.md itself flags this. Legacy repo is GPLv3.
Decision: Data-driven versioned content packs with provenance. Ship only original demo content. Support user-imported packs. Pursue written permission separately. Foundry data is a reference, never copied into the repo.
Consequences: Initial app may have an empty/small compendium out of the box; value depends on import/permission. Architecture is unaffected by outcome.
