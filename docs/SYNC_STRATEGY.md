# Synchronization Strategy

Status: Phase 0 design. Implemented in Phase 6; **data model is sync-ready from Phase 1.**

## 1. Goals
Local DB stays the source of truth on the device; the app is fully functional offline; sync never requires replacing the local DB; operations are idempotent and resumable; no silent overwrites; conflicts are visible and recoverable; private GM data never leaves authorized scope.

## 2. Local building blocks (present from Phase 1)
UUID ids; `created_at/updated_at/version/deleted_at/device_id`; `sync_outbox`; `sync_state`; `sync_cursor`; `sync_conflict`; append-only `action_log`. Every use-case mutation writes entity + outbox (+ action_log) in one transaction.

## 3. Protocol (Supabase, Phase 6)
- **Push:** worker drains `sync_outbox` in order per entity; each item carries `idempotency_key` and `base_version`. Server applies via RPC/edge function in a transaction; replay of the same key is a no-op returning the original result.
- **Pull:** per-scope cursor (`user`, `campaign:<id>`); server returns changes with `server_version`; client applies in a transaction, updates `sync_state`.
- **Tombstones:** soft deletes sync as deletes; purge after retention window.
- **Retry/backoff:** exponential, offline-aware (`NetInfo`); the outbox survives restarts.
- **Realtime:** only for active campaign screens (initiative, shared HP); polling pull is the correctness baseline, realtime is an optimization.
- Clients never hold service-role keys; only the anon key + user JWT; all authorization via RLS and RPCs.

## 4. Conflict policy by data type
| Data | Policy |
|---|---|
| Settings/preferences | Latest `updated_at` wins (server-ordered), documented, per key |
| Character core (identity, choices, class levels) | Optimistic concurrency via `base_version`. On mismatch: attempt field-level 3-way merge (base/local/remote) when edits touch disjoint fields; otherwise create `sync_conflict`, keep both, ask user |
| HP, temp HP, resources, credits, inventory quantity | **Operation-based:** sync deltas from `action_log` (e.g. `hp -5`, `spend force_point 2`), apply commutatively on server with bounds clamping; preserves history, avoids lost updates |
| Inventory/powers/features lists | Per-row sync keyed by UUID; add/remove merge naturally; same-row edit → row-level versioning |
| Campaign notes | Per-note versioning; conflict → keep both copies, flag; (no CRDT in v1) |
| Campaign structure & membership | Owner/GM authority; server-authoritative; players' attempts to edit GM rows are rejected |
| Encounters/initiative (live) | GM-authoritative single writer; players submit intents (e.g., own initiative roll) |

Unresolved conflicts: shown in a **Sync Issues** screen with local vs remote diff and actions (keep mine / keep theirs / merge); nothing is dropped until user resolves; losing versions retained in `sync_conflict`.

## 5. Permissions & privacy in sync
Server schema (Postgres) mirrors local with `owner_id`, `campaign_id`; RLS policies: campaign members read `shared` rows only; GM/owner read all; players write only own characters' rows and own-intent rows. Responses to player clients are produced from views/RPCs that **omit `gm_only` columns/rows** (never rely on client filtering). Test suite with two simulated users asserts no leakage.

## 6. Account linking & migration of existing local data
First sign-in: "Back up this device's data?" → bulk-enqueue all local entities as upserts (idempotent) with a pre-flight summary. If account already has data: reconcile by UUID; collisions surface as conflicts, never overwrites. Sign-out keeps local data (option to wipe is explicit and confirmed).

## 7. Export/Import (available from Phase 1/3, independent of cloud)
Portable JSON (`sw5e-companion-export`, `format_version`, `app_version`, `schema_version`, `exported_at`, `device_id`, entities with UUIDs, content pack references with ids/versions, **no secrets**). Import: validate with Zod, preview, dry-run diff, merge-by-UUID with explicit conflict choice (skip/replace/duplicate-with-new-id), transactional, never partial. Player-facing campaign export excludes `gm_only`. Format documented in `docs/` when implemented.

## 8. Risks
Merge complexity (R6), schema drift between client versions (mitigate: `schema_version` in protocol, server rejects too-old clients with upgrade prompt), clock skew (use server timestamps for ordering, `version` counters locally), large initial uploads (chunking).
