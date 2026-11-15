import type { Migration } from '../migrator';

/**
 * Campaign & Game Master workspace tables: sessions, notes, NPCs/creatures,
 * encounters, and initiative/combat participants (docs/DATABASE_SCHEMA.md §5).
 * Privacy rule: visibility ('gm_only' | 'shared'), notes_gm, and is_hidden_from_players
 * enforce strict separation between GM and player-facing views.
 */
export const migration0004: Migration = {
  version: 4,
  name: 'campaign_workspace',
  sql: `
    CREATE TABLE campaign_session (
      id TEXT PRIMARY KEY NOT NULL,
      campaign_id TEXT NOT NULL REFERENCES campaign (id) ON DELETE CASCADE,
      session_number INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      played_on TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'shared' CHECK (visibility IN ('gm_only','shared')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      device_id TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'local'
        CHECK (sync_state IN ('local','pending','synced','conflict'))
    );
    CREATE INDEX idx_session_campaign ON campaign_session (campaign_id, session_number);

    CREATE TABLE campaign_note (
      id TEXT PRIMARY KEY NOT NULL,
      campaign_id TEXT NOT NULL REFERENCES campaign (id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'shared' CHECK (visibility IN ('gm_only','shared')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      device_id TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'local'
        CHECK (sync_state IN ('local','pending','synced','conflict'))
    );
    CREATE INDEX idx_note_campaign_vis ON campaign_note (campaign_id, visibility);

    CREATE TABLE campaign_npc (
      id TEXT PRIMARY KEY NOT NULL,
      campaign_id TEXT NOT NULL REFERENCES campaign (id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role_or_type TEXT NOT NULL DEFAULT 'NPC',
      ac INTEGER NOT NULL DEFAULT 12,
      hp_max INTEGER NOT NULL DEFAULT 20,
      initiative_bonus INTEGER NOT NULL DEFAULT 0,
      notes_shared TEXT NOT NULL DEFAULT '',
      notes_gm TEXT NOT NULL DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'shared' CHECK (visibility IN ('gm_only','shared')),
      is_creature INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      device_id TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'local'
        CHECK (sync_state IN ('local','pending','synced','conflict'))
    );
    CREATE INDEX idx_npc_campaign ON campaign_npc (campaign_id);

    CREATE TABLE encounter (
      id TEXT PRIMARY KEY NOT NULL,
      campaign_id TEXT NOT NULL REFERENCES campaign (id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing','active','completed')),
      round INTEGER NOT NULL DEFAULT 1,
      active_index INTEGER NOT NULL DEFAULT 0,
      visibility TEXT NOT NULL DEFAULT 'shared' CHECK (visibility IN ('gm_only','shared')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      device_id TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'local'
        CHECK (sync_state IN ('local','pending','synced','conflict'))
    );
    CREATE INDEX idx_encounter_campaign ON encounter (campaign_id);

    CREATE TABLE encounter_participant (
      id TEXT PRIMARY KEY NOT NULL,
      encounter_id TEXT NOT NULL REFERENCES encounter (id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('character','npc','creature')),
      ref_id TEXT,
      name TEXT NOT NULL,
      initiative INTEGER NOT NULL DEFAULT 10,
      initiative_bonus INTEGER NOT NULL DEFAULT 0,
      hp_current INTEGER NOT NULL DEFAULT 10,
      hp_max INTEGER NOT NULL DEFAULT 10,
      ac INTEGER NOT NULL DEFAULT 12,
      conditions_json TEXT NOT NULL DEFAULT '[]',
      is_hidden_from_players INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX idx_participant_encounter ON encounter_participant (encounter_id, initiative DESC);
  `,
};
