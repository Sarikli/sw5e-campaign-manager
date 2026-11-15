import { z } from 'zod';
import { campaignSchema, characterSchema } from '../../domain/models';
import type { WriteContext } from '../database/outbox';
import type { SqlDatabase } from '../database/types';
import { starshipSchema } from '../repositories/starshipRepository';

export const portableBundleSchema = z.object({
  format: z.literal('sw5e-portable-v1'),
  exportedAt: z.string(),
  deviceId: z.string(),
  characters: z.array(characterSchema),
  campaigns: z.array(campaignSchema),
  starships: z.array(starshipSchema).default([]),
});
export type PortableBundle = z.infer<typeof portableBundleSchema>;

export interface SyncConflictRecord {
  id: string;
  entityTable: string;
  entityId: string;
  localJson: string;
  remoteJson: string;
  detectedAt: string;
  status: 'open' | 'resolved_local' | 'resolved_remote' | 'resolved_merged';
}

export interface RemoteSyncAdapter {
  pushBatch(
    items: {
      id: string;
      entityTable: string;
      entityId: string;
      op: 'upsert' | 'delete';
      baseVersion: number;
      payloadJson: string;
      idempotencyKey: string;
    }[],
  ): Promise<{ acceptedIds: string[] }>;
}

export class SqliteSyncService {
  constructor(
    private readonly db: SqlDatabase,
    private readonly ctx: WriteContext,
  ) {}

  async getPendingOutboxCount(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) as n FROM sync_outbox WHERE status = 'pending'",
    );
    return row?.n ?? 0;
  }

  async flushOutbox(adapter: RemoteSyncAdapter): Promise<{ pushed: number }> {
    const pending = await this.db.getAllAsync<{
      id: string;
      entity_table: string;
      entity_id: string;
      op: 'upsert' | 'delete';
      base_version: number;
      payload_json: string;
      idempotency_key: string;
    }>(
      "SELECT id, entity_table, entity_id, op, base_version, payload_json, idempotency_key FROM sync_outbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT 100",
    );
    if (pending.length === 0) return { pushed: 0 };

    const result = await adapter.pushBatch(
      pending.map((p) => ({
        id: p.id,
        entityTable: p.entity_table,
        entityId: p.entity_id,
        op: p.op,
        baseVersion: p.base_version,
        payloadJson: p.payload_json,
        idempotencyKey: p.idempotency_key,
      })),
    );

    const ts = this.ctx.now();
    await this.db.withTransactionAsync(async () => {
      for (const id of result.acceptedIds) {
        await this.db.runAsync("UPDATE sync_outbox SET status = 'synced' WHERE id = ?", [id]);
      }
      for (const p of pending) {
        if (result.acceptedIds.includes(p.id)) {
          await this.db.runAsync(
            `INSERT OR REPLACE INTO sync_state (entity_table, entity_id, remote_version, remote_updated_at, last_synced_at)
             VALUES (?, ?, ?, ?, ?)`,
            [p.entity_table, p.entity_id, p.base_version, ts, ts],
          );
        }
      }
    });

    return { pushed: result.acceptedIds.length };
  }

  async exportPortableBundle(
    characters: z.infer<typeof characterSchema>[],
    campaigns: z.infer<typeof campaignSchema>[],
    starships: z.infer<typeof starshipSchema>[] = [],
  ): Promise<PortableBundle> {
    return portableBundleSchema.parse({
      format: 'sw5e-portable-v1',
      exportedAt: this.ctx.now(),
      deviceId: this.ctx.deviceId,
      characters,
      campaigns,
      starships,
    });
  }

  /**
   * Imports a portable or remote bundle with revision-aware conflict detection.
   * Never blindly overwrites local modifications: if an entity with the same ID already
   * exists locally with divergent content, a SyncConflictRecord is recorded in `sync_conflict`.
   */
  async importPortableBundle(rawBundle: unknown): Promise<{
    importedCharacters: number;
    importedCampaigns: number;
    conflictsDetected: number;
  }> {
    const bundle = portableBundleSchema.parse(rawBundle);
    let importedCharacters = 0;
    let importedCampaigns = 0;
    let conflictsDetected = 0;
    const ts = this.ctx.now();

    await this.db.withTransactionAsync(async () => {
      for (const incoming of bundle.characters) {
        const localRow = await this.db.getFirstAsync<{
          id: string;
          name: string;
          level_total: number;
          data_json: string;
          version: number;
          updated_at: string;
        }>('SELECT id, name, level_total, data_json, version, updated_at FROM character WHERE id = ?', [
          incoming.id,
        ]);

        if (!localRow) {
          await this.db.runAsync(
            `INSERT INTO character
              (id, name, level_total, creation_state, data_json, created_at, updated_at, version, device_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              incoming.id,
              incoming.name,
              incoming.levelTotal,
              incoming.creationState,
              JSON.stringify(incoming.details),
              incoming.createdAt,
              incoming.updatedAt,
              incoming.version,
              this.ctx.deviceId,
            ],
          );
          importedCharacters++;
        } else if (
          localRow.name !== incoming.name ||
          localRow.level_total !== incoming.levelTotal ||
          localRow.data_json !== JSON.stringify(incoming.details)
        ) {
          // Divergent modification -> record conflict instead of overwriting!
          const conflictId = this.ctx.newId();
          await this.db.runAsync(
            `INSERT INTO sync_conflict
              (id, entity_table, entity_id, local_json, remote_json, detected_at, status)
             VALUES (?, 'character', ?, ?, ?, ?, 'open')`,
            [
              conflictId,
              incoming.id,
              JSON.stringify({
                id: localRow.id,
                name: localRow.name,
                levelTotal: localRow.level_total,
                details: JSON.parse(localRow.data_json || '{}'),
                version: localRow.version,
              }),
              JSON.stringify(incoming),
              ts,
            ],
          );
          await this.db.runAsync("UPDATE character SET sync_state = 'conflict' WHERE id = ?", [
            incoming.id,
          ]);
          conflictsDetected++;
        }
      }

      for (const incomingCamp of bundle.campaigns) {
        const localCamp = await this.db.getFirstAsync<{ id: string; name: string }>(
          'SELECT id, name FROM campaign WHERE id = ?',
          [incomingCamp.id],
        );
        if (!localCamp) {
          await this.db.runAsync(
            `INSERT INTO campaign
              (id, name, description, setting, status, created_at, updated_at, version, device_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              incomingCamp.id,
              incomingCamp.name,
              incomingCamp.description,
              incomingCamp.setting,
              incomingCamp.status,
              incomingCamp.createdAt,
              incomingCamp.updatedAt,
              incomingCamp.version,
              this.ctx.deviceId,
            ],
          );
          importedCampaigns++;
        }
      }
    });

    return { importedCharacters, importedCampaigns, conflictsDetected };
  }

  async listOpenConflicts(): Promise<SyncConflictRecord[]> {
    const rows = await this.db.getAllAsync<{
      id: string;
      entity_table: string;
      entity_id: string;
      local_json: string;
      remote_json: string;
      detected_at: string;
      status: SyncConflictRecord['status'];
    }>("SELECT * FROM sync_conflict WHERE status = 'open' ORDER BY detected_at DESC");

    return rows.map((r) => ({
      id: r.id,
      entityTable: r.entity_table,
      entityId: r.entity_id,
      localJson: r.local_json,
      remoteJson: r.remote_json,
      detectedAt: r.detected_at,
      status: r.status,
    }));
  }

  async resolveConflict(
    conflictId: string,
    resolution: 'keep_local' | 'accept_remote',
  ): Promise<void> {
    const row = await this.db.getFirstAsync<{
      id: string;
      entity_table: string;
      entity_id: string;
      remote_json: string;
    }>("SELECT id, entity_table, entity_id, remote_json FROM sync_conflict WHERE id = ? AND status = 'open'", [
      conflictId,
    ]);
    if (!row) return;

    const ts = this.ctx.now();
    await this.db.withTransactionAsync(async () => {
      if (resolution === 'accept_remote' && row.entity_table === 'character') {
        const remote = characterSchema.parse(JSON.parse(row.remote_json));
        await this.db.runAsync(
          `UPDATE character
           SET name = ?, level_total = ?, creation_state = ?, data_json = ?,
               updated_at = ?, version = version + 1, sync_state = 'synced'
           WHERE id = ?`,
          [
            remote.name,
            remote.levelTotal,
            remote.creationState,
            JSON.stringify(remote.details),
            ts,
            row.entity_id,
          ],
        );
      } else if (row.entity_table === 'character') {
        await this.db.runAsync("UPDATE character SET sync_state = 'local' WHERE id = ?", [
          row.entity_id,
        ]);
      }

      const nextStatus = resolution === 'keep_local' ? 'resolved_local' : 'resolved_remote';
      await this.db.runAsync(
        'UPDATE sync_conflict SET status = ?, resolved_at = ? WHERE id = ?',
        [nextStatus, ts, conflictId],
      );
    });
  }
}
