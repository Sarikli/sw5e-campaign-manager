import type { SqlDatabase } from './types';

export type SyncedTable =
  | 'character'
  | 'campaign'
  | 'campaign_character'
  | 'campaign_session'
  | 'campaign_note'
  | 'campaign_npc'
  | 'encounter'
  | 'starship';

export interface WriteContext {
  deviceId: string;
  now: () => string;
  newId: () => string;
}

/**
 * Enqueues an outbound sync record. Must be called inside the same transaction as
 * the entity write so the queue and data can never diverge (SYNC_STRATEGY.md).
 */
export async function enqueueOutbox(
  db: SqlDatabase,
  ctx: WriteContext,
  table: SyncedTable,
  entityId: string,
  op: 'upsert' | 'delete',
  version: number,
  payload: unknown,
): Promise<void> {
  const id = ctx.newId();
  await db.runAsync(
    `INSERT INTO sync_outbox
       (id, entity_table, entity_id, op, base_version, payload_json, idempotency_key, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      table,
      entityId,
      op,
      version,
      JSON.stringify(payload),
      `${ctx.deviceId}:${table}:${entityId}:${version}:${op}`,
      ctx.now(),
    ],
  );
}
