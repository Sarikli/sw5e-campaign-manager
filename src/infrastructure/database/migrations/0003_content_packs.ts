import type { Migration } from '../migrator';

/**
 * Canonical and homebrew content pack tables (docs/DATABASE_SCHEMA.md §3).
 * Homebrew entries live only in packs with origin = 'homebrew' and namespaced IDs,
 * preventing any accidental overwrite of official reference records.
 */
export const migration0003: Migration = {
  version: 3,
  name: 'content_packs',
  sql: `
    CREATE TABLE content_pack (
      id TEXT PRIMARY KEY NOT NULL,
      namespace TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      publisher TEXT NOT NULL,
      rules_version TEXT NOT NULL,
      data_version TEXT NOT NULL,
      license_id TEXT NOT NULL,
      attribution TEXT NOT NULL,
      source_url TEXT NOT NULL DEFAULT '',
      origin TEXT NOT NULL CHECK (origin IN ('bundled','user_import','homebrew')),
      checksum TEXT NOT NULL,
      installed_at TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE content_entry (
      id TEXT PRIMARY KEY NOT NULL,
      pack_id TEXT NOT NULL REFERENCES content_pack (id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      content_type TEXT NOT NULL,
      name TEXT NOT NULL,
      name_sort TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      prerequisites_json TEXT NOT NULL DEFAULT '{}',
      properties_json TEXT NOT NULL DEFAULT '{}',
      source_ref TEXT NOT NULL,
      rules_version TEXT NOT NULL,
      data_version TEXT NOT NULL,
      attribution TEXT NOT NULL DEFAULT '',
      is_custom INTEGER NOT NULL DEFAULT 0,
      UNIQUE (pack_id, content_type, slug)
    );
    CREATE INDEX idx_content_entry_type_name ON content_entry (content_type, name_sort);
    CREATE INDEX idx_content_entry_pack ON content_entry (pack_id);
  `,
};
