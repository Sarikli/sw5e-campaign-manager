# Database Schema (Proposed)

Status: Phase 0 proposal. SQLite via expo-sqlite. Changes after approval go through migrations.

## 1. Conventions
- IDs: UUID v4 text (`id TEXT PRIMARY KEY`), generated client-side with expo-crypto.
- Every user-data table includes the **sync columns**:
  `created_at TEXT` (ISO-8601 UTC), `updated_at TEXT`, `version INTEGER` (increments per local write), `deleted_at TEXT NULL` (soft delete), `device_id TEXT` (last writer), `sync_state TEXT` (`local`|`pending`|`synced`|`conflict`), `remote_version INTEGER NULL`.
- JSON columns (`*_json`) only for flexible, non-queried payloads; validated by Zod on read/write. Anything filtered/sorted gets real columns.
- Booleans as INTEGER 0/1. Foreign keys ON. WAL mode.
- Visibility enum used on campaign content: `gm_only` | `shared` (| later `player:<id>`).

## 2. Meta
```sql
schema_migrations(version INTEGER PK, name TEXT, applied_at TEXT, checksum TEXT)
app_meta(key TEXT PK, value TEXT)            -- device_id, schema info, export_format_version
settings(key TEXT PK, value_json TEXT, updated_at TEXT, version INTEGER)  -- latest-wins policy
```

## 3. Content (canonical, read-only to user flows)
```sql
content_pack(id TEXT PK, namespace TEXT UNIQUE,   -- e.g. 'user-import:<slug>', 'original:core'
  name TEXT, publisher TEXT, rules_version TEXT, data_version TEXT,
  license_id TEXT, license_text TEXT, attribution TEXT, source_url TEXT,
  origin TEXT CHECK(origin IN ('bundled','user_import','homebrew')),
  checksum TEXT, installed_at TEXT, enabled INTEGER)

content_entry(id TEXT PK,                 -- stable ID: '<namespace>:<type>:<slug>'
  pack_id TEXT FK, content_type TEXT,     -- species, class, archetype, background, feat, ...
  name TEXT, name_sort TEXT, summary TEXT, description TEXT,
  prerequisites_json TEXT, properties_json TEXT,   -- mechanical properties (Zod-validated per type)
  source_ref TEXT,                         -- book/page/section
  rules_version TEXT, data_version TEXT, attribution TEXT,
  is_custom INTEGER DEFAULT 0, UNIQUE(pack_id, content_type, slug))
content_entry_fts  -- FTS5 virtual table on name, summary, description (compendium search)
content_link(from_id, to_id, relation)   -- e.g. archetype→class, feature→class level
```
Constraint: homebrew rows live only in packs with `origin='homebrew'`; IDs namespaced so they can never collide with or overwrite another pack's IDs.

## 4. Characters
```sql
character(id PK, name, portrait_uri, species_id, background_id, alignment, level_total INTEGER,
  xp INTEGER, hp_max_override INTEGER NULL, hp_current INTEGER, hp_temp INTEGER, hit_dice_json,
  credits INTEGER, ruleset_pack_ids_json, content_data_versions_json,
  creation_state TEXT CHECK(... 'draft','complete'), owner_user_id TEXT NULL, <sync cols>)
character_class_level(id PK, character_id FK, class_id, level_in_class, archetype_id NULL,
  hp_roll_or_avg INTEGER, ordinal INTEGER)          -- supports multiclassing, ordered level history
character_ability(character_id FK, ability TEXT, base_score INTEGER, bonus_json, PK(character_id, ability))
character_proficiency(id PK, character_id FK, kind TEXT, content_id/skill_key TEXT, level TEXT, source TEXT)
character_feature(id PK, character_id FK, content_id, source_kind, source_id, choice_json, ordinal)
character_power(id PK, character_id FK, content_id, power_kind TEXT CHECK('force','tech'),
  status TEXT CHECK('known','prepared'), source_class_id)
character_maneuver(id PK, character_id FK, content_id, ...)
character_condition(id PK, character_id FK, condition_key, source, duration_json, <sync cols>)
character_resource(id PK, character_id FK, key TEXT,  -- 'force_points','tech_points','superiority_dice','hit_dice', feature uses...
  max_override INTEGER NULL, current INTEGER, recharge TEXT, source_id)
inventory_item(id PK, character_id FK, content_id NULL, custom_json NULL, quantity INTEGER,
  equipped INTEGER, slot TEXT NULL, notes, ordinal)       -- either a content ref or a custom item
character_note(id PK, character_id FK, title, body, <sync cols>)
character_draft(id PK, wizard_state_json, step TEXT, updated_at)   -- resumable wizard
action_log(id PK, character_id FK, kind TEXT,  -- hp_change, resource_spend, rest, level_up, equip, roll...
  payload_json, occurred_at, device_id, seq INTEGER)      -- append-only; basis for merge of HP/resources
roll_history(id PK, character_id NULL, campaign_id NULL, notation, dice_json, modifier, total, context_json, rolled_at)
```
Derived stats are never stored (only computed); optional cache table later if profiling demands.

## 5. Campaigns
```sql
campaign(id PK, name, description, setting, status TEXT CHECK('planning','active','paused','completed'),
  house_rules_json, party_info, owner_user_id NULL, local_owner_role TEXT, <sync cols>)
campaign_member(id PK, campaign_id FK, user_id NULL, display_name, role TEXT CHECK('gm','player'),
  status TEXT CHECK('active','invited','removed'), <sync cols>)
campaign_character(id PK, campaign_id FK, character_id FK, member_id FK NULL, joined_at, left_at NULL,
  UNIQUE(campaign_id, character_id), <sync cols>)         -- link only; no character duplication
session(id PK, campaign_id FK, number INTEGER, title, played_on TEXT, summary, objectives_json,
  important_events_json, visibility, <sync cols>)
note(id PK, campaign_id FK, session_id NULL, title, body, visibility TEXT CHECK('gm_only','shared'),
  category, <sync cols>)
npc(id PK, campaign_id FK NULL, content_id NULL, name, stat_block_json, notes_gm, notes_shared,
  visibility, is_creature INTEGER, <sync cols>)
encounter(id PK, campaign_id FK, name, description, is_template INTEGER, status TEXT, round INTEGER,
  active_participant_id NULL, visibility, <sync cols>)
encounter_participant(id PK, encounter_id FK, kind TEXT CHECK('character','npc','creature'),
  character_id NULL, npc_id NULL, content_id NULL, name, initiative INTEGER NULL, initiative_bonus INTEGER,
  hp_current, hp_max, ac, conditions_json, order_index, is_hidden_from_players INTEGER, <sync cols>)
```
Privacy rule: `*.visibility = 'gm_only'`, `notes_gm`, `is_hidden_from_players` are excluded by a single `PlayerViewRepository`/query layer used for every player-facing read and every export-for-player; covered by tests.

## 6. Sync infrastructure
```sql
sync_outbox(id PK, entity_table TEXT, entity_id TEXT, op TEXT CHECK('upsert','delete'),
  base_version INTEGER, payload_json TEXT, idempotency_key TEXT UNIQUE,
  created_at TEXT, attempts INTEGER DEFAULT 0, last_error TEXT NULL, status TEXT)
sync_state(entity_table TEXT, entity_id TEXT, remote_version INTEGER, remote_updated_at TEXT, last_synced_at TEXT, PK(entity_table, entity_id))
sync_cursor(scope TEXT PK, cursor TEXT)         -- per-scope pull cursor
sync_conflict(id PK, entity_table, entity_id, local_json, remote_json, base_json, detected_at,
  status TEXT CHECK('open','resolved_local','resolved_remote','resolved_merged'), resolved_at NULL)
```
Outbox is empty/unused until Phase 6 but is written from Phase 1 so no migration of history is needed.

## 7. Indices (initial)
`character(updated_at)`, `campaign_character(campaign_id)`, `campaign_character(character_id)`, `note(campaign_id, visibility)`, `encounter_participant(encounter_id, order_index)`, `action_log(character_id, seq)`, `content_entry(content_type, name_sort)`, `sync_outbox(status, created_at)`, plus FTS5 on content.

## 8. Migration policy
Forward-only; one numbered migration file per change; transactional; checksum verified; pre-migration file backup for destructive ops; tests that upgrade a DB fixture from every previous version; never drop columns holding user data without export step.

## 9. Open items
- Confirm FTS5 availability in expo-sqlite SDK 58 builds (verify in Phase 1 spike).
- Character-to-campaign cardinality: schema allows many campaigns per character; confirm product rule.
- Final content-entry property shapes per type are defined in Phase 2 after SW5e verification.
