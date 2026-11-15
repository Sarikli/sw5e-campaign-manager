import type { CharacterRepository } from '../../application/ports/repositories';
import {
  characterDataSchema,
  characterSchema,
  newCharacterSchema,
  type Character,
  type CharacterDetails,
  type NewCharacter,
} from '../../domain/models';
import type { SqlDatabase } from '../database/types';
import { enqueueOutbox, type WriteContext } from '../database/outbox';

interface Row {
  id: string;
  name: string;
  level_total: number;
  creation_state: string;
  data_json: string;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at: string | null;
}

export function toCharacter(row: Row): Character {
  let rawDetails: unknown = {};
  try {
    rawDetails = row.data_json ? JSON.parse(row.data_json) : {};
  } catch {
    rawDetails = {};
  }
  return characterSchema.parse({
    id: row.id,
    name: row.name,
    levelTotal: row.level_total,
    creationState: row.creation_state,
    details: characterDataSchema.parse(rawDetails),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    deletedAt: row.deleted_at,
  });
}

const COLUMNS =
  'id, name, level_total, creation_state, data_json, created_at, updated_at, version, deleted_at';

export class SqliteCharacterRepository implements CharacterRepository {
  constructor(
    private readonly db: SqlDatabase,
    private readonly ctx: WriteContext,
  ) {}

  async create(input: NewCharacter): Promise<Character> {
    const parsed = newCharacterSchema.parse(input);
    const details = characterDataSchema.parse(parsed.details ?? {});
    const levelTotal = parsed.levelTotal ?? 1;
    const creationState = parsed.creationState ?? 'draft';
    const id = this.ctx.newId();
    const ts = this.ctx.now();
    const dataJson = JSON.stringify(details);

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO character
          (id, name, level_total, creation_state, data_json, created_at, updated_at, device_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, parsed.name, levelTotal, creationState, dataJson, ts, ts, this.ctx.deviceId],
      );
      await enqueueOutbox(this.db, this.ctx, 'character', id, 'upsert', 1, {
        id,
        name: parsed.name,
        levelTotal,
        creationState,
        details,
      });
    });
    const created = await this.get(id);
    if (!created) throw new Error('Character was not persisted');
    return created;
  }

  async update(
    id: string,
    patch: {
      name?: string;
      levelTotal?: number;
      creationState?: 'draft' | 'complete';
      details?: Partial<CharacterDetails>;
    },
  ): Promise<Character> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Character not found: ${id}`);

    const nextName = patch.name !== undefined ? patch.name.trim() : existing.name;
    if (!nextName) throw new Error('Name is required');
    const nextLevel = patch.levelTotal ?? existing.levelTotal;
    const nextState = patch.creationState ?? existing.creationState;
    const nextDetails = characterDataSchema.parse({
      ...existing.details,
      ...(patch.details ?? {}),
    });
    const version = existing.version + 1;
    const ts = this.ctx.now();
    const dataJson = JSON.stringify(nextDetails);

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `UPDATE character
         SET name = ?, level_total = ?, creation_state = ?, data_json = ?,
             updated_at = ?, version = ?, device_id = ?
         WHERE id = ?`,
        [nextName, nextLevel, nextState, dataJson, ts, version, this.ctx.deviceId, id],
      );
      await enqueueOutbox(this.db, this.ctx, 'character', id, 'upsert', version, {
        id,
        name: nextName,
        levelTotal: nextLevel,
        creationState: nextState,
        details: nextDetails,
      });
    });

    const updated = await this.get(id);
    if (!updated) throw new Error('Character update failed');
    return updated;
  }

  async list(): Promise<Character[]> {
    const rows = await this.db.getAllAsync<Row>(
      `SELECT ${COLUMNS} FROM character WHERE deleted_at IS NULL ORDER BY updated_at DESC`,
    );
    return rows.map(toCharacter);
  }

  async get(id: string): Promise<Character | null> {
    const row = await this.db.getFirstAsync<Row>(
      `SELECT ${COLUMNS} FROM character WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return row ? toCharacter(row) : null;
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.get(id);
    if (!existing) return;
    const ts = this.ctx.now();
    const version = existing.version + 1;
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `UPDATE character SET deleted_at = ?, updated_at = ?, version = ?, device_id = ? WHERE id = ?`,
        [ts, ts, version, this.ctx.deviceId, id],
      );
      await enqueueOutbox(this.db, this.ctx, 'character', id, 'delete', version, { id });
    });
  }
}
