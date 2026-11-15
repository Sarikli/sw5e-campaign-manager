import type { Migration } from '../migrator';

/**
 * Starships of the Galaxy table for Phase 7 Starship Sheets (SotG Ch. 2-5).
 * Tracks hull points, shield points, regeneration, speed/turning, weapons, and crew deployments.
 */
export const migration0005: Migration = {
  version: 5,
  name: 'starships',
  sql: `
    CREATE TABLE starship (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      size TEXT NOT NULL DEFAULT 'Medium'
        CHECK (size IN ('Tiny','Small','Medium','Large','Huge','Gargantuan')),
      tier INTEGER NOT NULL DEFAULT 1 CHECK (tier >= 0 AND tier <= 5),
      ac INTEGER NOT NULL DEFAULT 14,
      hull_current INTEGER NOT NULL DEFAULT 45,
      hull_max INTEGER NOT NULL DEFAULT 45,
      shield_current INTEGER NOT NULL DEFAULT 25,
      shield_max INTEGER NOT NULL DEFAULT 25,
      shield_regen INTEGER NOT NULL DEFAULT 5,
      flying_speed INTEGER NOT NULL DEFAULT 250,
      turning_speed INTEGER NOT NULL DEFAULT 150,
      weapons_json TEXT NOT NULL DEFAULT '[]',
      crew_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      device_id TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'local'
        CHECK (sync_state IN ('local','pending','synced','conflict'))
    );
    CREATE INDEX idx_starship_updated ON starship (updated_at);
  `,
};
