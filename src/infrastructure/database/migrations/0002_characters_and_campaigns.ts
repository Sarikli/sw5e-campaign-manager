import type { Migration } from '../migrator';

/**
 * Core character and campaign tables. Detailed child tables (powers, resources,
 * inventory, encounters, ...) arrive with the phases that use them.
 * Characters link to campaigns through campaign_character (many-to-many, ADR-0005).
 */
export const migration0002: Migration = {
  version: 2,
  name: 'characters_and_campaigns',
  sql: `
    CREATE TABLE character (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      portrait_uri TEXT,
      level_total INTEGER NOT NULL DEFAULT 1,
      creation_state TEXT NOT NULL DEFAULT 'draft' CHECK (creation_state IN ('draft','complete')),
      data_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      device_id TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'local'
        CHECK (sync_state IN ('local','pending','synced','conflict')),
      remote_version INTEGER
    );
    CREATE INDEX idx_character_updated ON character (updated_at);

    CREATE TABLE campaign (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      setting TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'planning'
        CHECK (status IN ('planning','active','paused','completed')),
      house_rules_json TEXT NOT NULL DEFAULT '[]',
      party_info TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      device_id TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'local'
        CHECK (sync_state IN ('local','pending','synced','conflict')),
      remote_version INTEGER
    );

    CREATE TABLE campaign_character (
      id TEXT PRIMARY KEY NOT NULL,
      campaign_id TEXT NOT NULL REFERENCES campaign (id),
      character_id TEXT NOT NULL REFERENCES character (id),
      joined_at TEXT NOT NULL,
      left_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      device_id TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'local'
        CHECK (sync_state IN ('local','pending','synced','conflict')),
      remote_version INTEGER,
      UNIQUE (campaign_id, character_id)
    );
    CREATE INDEX idx_cc_campaign ON campaign_character (campaign_id);
    CREATE INDEX idx_cc_character ON campaign_character (character_id);
  `,
};
