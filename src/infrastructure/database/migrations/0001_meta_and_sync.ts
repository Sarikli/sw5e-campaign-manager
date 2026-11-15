import type { Migration } from '../migrator';

/** Meta tables and synchronization infrastructure (see docs/DATABASE_SCHEMA.md §2, §6). */
export const migration0001: Migration = {
  version: 1,
  name: 'meta_and_sync',
  sql: `
    CREATE TABLE app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE settings (
      key TEXT PRIMARY KEY NOT NULL,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE sync_outbox (
      id TEXT PRIMARY KEY NOT NULL,
      entity_table TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      op TEXT NOT NULL CHECK (op IN ('upsert','delete')),
      base_version INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE INDEX idx_sync_outbox_status ON sync_outbox (status, created_at);

    CREATE TABLE sync_state (
      entity_table TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      remote_version INTEGER,
      remote_updated_at TEXT,
      last_synced_at TEXT,
      PRIMARY KEY (entity_table, entity_id)
    );

    CREATE TABLE sync_cursor (
      scope TEXT PRIMARY KEY NOT NULL,
      cursor TEXT NOT NULL
    );

    CREATE TABLE sync_conflict (
      id TEXT PRIMARY KEY NOT NULL,
      entity_table TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      local_json TEXT NOT NULL,
      remote_json TEXT NOT NULL,
      base_json TEXT,
      detected_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','resolved_local','resolved_remote','resolved_merged')),
      resolved_at TEXT
    );
  `,
};
