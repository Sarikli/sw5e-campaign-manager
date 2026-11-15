import type { CampaignRepository } from '../../application/ports/repositories';
import {
  campaignSchema,
  newCampaignSchema,
  type Campaign,
  type Character,
  type NewCampaign,
} from '../../domain/models';
import {
  campaignNoteSchema,
  campaignNpcSchema,
  campaignSessionSchema,
  encounterParticipantSchema,
  encounterSchema,
  type CampaignNote,
  type CampaignNpc,
  type CampaignSession,
  type Encounter,
  type EncounterParticipant,
  type ViewerRole,
  type Visibility,
} from '../../domain/models/campaignWorkspace';
import type { SqlDatabase } from '../database/types';
import { enqueueOutbox, type WriteContext } from '../database/outbox';
import { toCharacter } from './characterRepository';

interface Row {
  id: string;
  name: string;
  description: string;
  setting: string;
  status: string;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at: string | null;
}

function toCampaign(row: Row): Campaign {
  return campaignSchema.parse({
    id: row.id,
    name: row.name,
    description: row.description,
    setting: row.setting,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    deletedAt: row.deleted_at,
  });
}

const COLUMNS =
  'id, name, description, setting, status, created_at, updated_at, version, deleted_at';

export class SqliteCampaignRepository implements CampaignRepository {
  constructor(
    private readonly db: SqlDatabase,
    private readonly ctx: WriteContext,
  ) {}

  async create(input: NewCampaign): Promise<Campaign> {
    const data = newCampaignSchema.parse(input);
    const id = this.ctx.newId();
    const ts = this.ctx.now();
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO campaign (id, name, description, setting, created_at, updated_at, device_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, data.name, data.description, data.setting, ts, ts, this.ctx.deviceId],
      );
      await enqueueOutbox(this.db, this.ctx, 'campaign', id, 'upsert', 1, { id, ...data });
    });
    const created = await this.get(id);
    if (!created) throw new Error('Campaign was not persisted');
    return created;
  }

  async list(): Promise<Campaign[]> {
    const rows = await this.db.getAllAsync<Row>(
      `SELECT ${COLUMNS} FROM campaign WHERE deleted_at IS NULL ORDER BY updated_at DESC`,
    );
    return rows.map(toCampaign);
  }

  async get(id: string): Promise<Campaign | null> {
    const row = await this.db.getFirstAsync<Row>(
      `SELECT ${COLUMNS} FROM campaign WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return row ? toCampaign(row) : null;
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.get(id);
    if (!existing) return;
    const ts = this.ctx.now();
    const version = existing.version + 1;
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `UPDATE campaign SET deleted_at = ?, updated_at = ?, version = ?, device_id = ? WHERE id = ?`,
        [ts, ts, version, this.ctx.deviceId, id],
      );
      await enqueueOutbox(this.db, this.ctx, 'campaign', id, 'delete', version, { id });
    });
  }

  async addCharacter(campaignId: string, characterId: string): Promise<void> {
    const ts = this.ctx.now();
    await this.db.withTransactionAsync(async () => {
      const existing = await this.db.getFirstAsync<{
        id: string;
        version: number;
        deleted_at: string | null;
      }>(
        'SELECT id, version, deleted_at FROM campaign_character WHERE campaign_id = ? AND character_id = ?',
        [campaignId, characterId],
      );
      if (existing) {
        if (existing.deleted_at === null) return;
        const version = existing.version + 1;
        await this.db.runAsync(
          `UPDATE campaign_character SET deleted_at = NULL, left_at = NULL, joined_at = ?, updated_at = ?,
             version = ?, device_id = ? WHERE id = ?`,
          [ts, ts, version, this.ctx.deviceId, existing.id],
        );
        await enqueueOutbox(this.db, this.ctx, 'campaign_character', existing.id, 'upsert', version, {
          id: existing.id,
          campaignId,
          characterId,
        });
        return;
      }
      const id = this.ctx.newId();
      await this.db.runAsync(
        `INSERT INTO campaign_character
           (id, campaign_id, character_id, joined_at, created_at, updated_at, device_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, campaignId, characterId, ts, ts, ts, this.ctx.deviceId],
      );
      await enqueueOutbox(this.db, this.ctx, 'campaign_character', id, 'upsert', 1, {
        id,
        campaignId,
        characterId,
      });
    });
  }

  async removeCharacter(campaignId: string, characterId: string): Promise<void> {
    const ts = this.ctx.now();
    await this.db.withTransactionAsync(async () => {
      const link = await this.db.getFirstAsync<{ id: string; version: number }>(
        `SELECT id, version FROM campaign_character
         WHERE campaign_id = ? AND character_id = ? AND deleted_at IS NULL`,
        [campaignId, characterId],
      );
      if (!link) return;
      const version = link.version + 1;
      await this.db.runAsync(
        `UPDATE campaign_character SET deleted_at = ?, left_at = ?, updated_at = ?, version = ?, device_id = ?
         WHERE id = ?`,
        [ts, ts, ts, version, this.ctx.deviceId, link.id],
      );
      await enqueueOutbox(this.db, this.ctx, 'campaign_character', link.id, 'delete', version, {
        id: link.id,
      });
    });
  }

  async listCharacters(campaignId: string): Promise<Character[]> {
    const rows = await this.db.getAllAsync<Parameters<typeof toCharacter>[0]>(
      `SELECT c.id, c.name, c.level_total, c.creation_state, c.data_json, c.created_at, c.updated_at, c.version, c.deleted_at
       FROM character c JOIN campaign_character cc ON cc.character_id = c.id
       WHERE cc.campaign_id = ? AND cc.deleted_at IS NULL AND c.deleted_at IS NULL
       ORDER BY c.name`,
      [campaignId],
    );
    return rows.map(toCharacter);
  }

  // ==================== SESSIONS ====================
  async addSession(input: {
    campaignId: string;
    sessionNumber: number;
    title: string;
    playedOn?: string;
    summary?: string;
    visibility?: Visibility;
  }): Promise<CampaignSession> {
    const id = this.ctx.newId();
    const ts = this.ctx.now();
    const vis: Visibility = input.visibility ?? 'shared';
    const session = campaignSessionSchema.parse({
      id,
      campaignId: input.campaignId,
      sessionNumber: input.sessionNumber,
      title: input.title,
      playedOn: input.playedOn ?? ts.slice(0, 10),
      summary: input.summary ?? '',
      visibility: vis,
    });
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO campaign_session
          (id, campaign_id, session_number, title, played_on, summary, visibility, created_at, updated_at, device_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.campaignId,
          session.sessionNumber,
          session.title,
          session.playedOn,
          session.summary,
          session.visibility,
          ts,
          ts,
          this.ctx.deviceId,
        ],
      );
      await enqueueOutbox(this.db, this.ctx, 'campaign_session', id, 'upsert', 1, session);
    });
    return session;
  }

  async listSessions(
    campaignId: string,
    viewerRole: ViewerRole = 'gm',
  ): Promise<CampaignSession[]> {
    const visClause = viewerRole === 'player' ? "AND visibility = 'shared'" : '';
    const rows = await this.db.getAllAsync<{
      id: string;
      campaign_id: string;
      session_number: number;
      title: string;
      played_on: string;
      summary: string;
      visibility: string;
    }>(
      `SELECT id, campaign_id, session_number, title, played_on, summary, visibility
       FROM campaign_session
       WHERE campaign_id = ? AND deleted_at IS NULL ${visClause}
       ORDER BY session_number DESC`,
      [campaignId],
    );
    return rows.map((r) =>
      campaignSessionSchema.parse({
        id: r.id,
        campaignId: r.campaign_id,
        sessionNumber: r.session_number,
        title: r.title,
        playedOn: r.played_on,
        summary: r.summary,
        visibility: r.visibility,
      }),
    );
  }

  // ==================== NOTES ====================
  async addNote(input: {
    campaignId: string;
    title: string;
    body: string;
    visibility?: Visibility;
  }): Promise<CampaignNote> {
    const id = this.ctx.newId();
    const ts = this.ctx.now();
    const note = campaignNoteSchema.parse({
      id,
      campaignId: input.campaignId,
      title: input.title,
      body: input.body,
      visibility: input.visibility ?? 'shared',
    });
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO campaign_note
          (id, campaign_id, title, body, visibility, created_at, updated_at, device_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [note.id, note.campaignId, note.title, note.body, note.visibility, ts, ts, this.ctx.deviceId],
      );
      await enqueueOutbox(this.db, this.ctx, 'campaign_note', id, 'upsert', 1, note);
    });
    return note;
  }

  async listNotes(campaignId: string, viewerRole: ViewerRole = 'gm'): Promise<CampaignNote[]> {
    const visClause = viewerRole === 'player' ? "AND visibility = 'shared'" : '';
    const rows = await this.db.getAllAsync<{
      id: string;
      campaign_id: string;
      title: string;
      body: string;
      visibility: string;
    }>(
      `SELECT id, campaign_id, title, body, visibility
       FROM campaign_note
       WHERE campaign_id = ? AND deleted_at IS NULL ${visClause}
       ORDER BY created_at DESC`,
      [campaignId],
    );
    return rows.map((r) =>
      campaignNoteSchema.parse({
        id: r.id,
        campaignId: r.campaign_id,
        title: r.title,
        body: r.body,
        visibility: r.visibility,
      }),
    );
  }

  // ==================== NPCS & CREATURES ====================
  async addNpc(input: {
    campaignId: string;
    name: string;
    roleOrType?: string;
    ac?: number;
    hpMax?: number;
    initiativeBonus?: number;
    notesShared?: string;
    notesGm?: string;
    visibility?: Visibility;
    isCreature?: boolean;
  }): Promise<CampaignNpc> {
    const id = this.ctx.newId();
    const ts = this.ctx.now();
    const npc = campaignNpcSchema.parse({
      id,
      campaignId: input.campaignId,
      name: input.name,
      roleOrType: input.roleOrType ?? 'NPC',
      ac: input.ac ?? 13,
      hpMax: input.hpMax ?? 22,
      initiativeBonus: input.initiativeBonus ?? 1,
      notesShared: input.notesShared ?? '',
      notesGm: input.notesGm ?? '',
      visibility: input.visibility ?? 'shared',
      isCreature: input.isCreature ?? false,
    });
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO campaign_npc
          (id, campaign_id, name, role_or_type, ac, hp_max, initiative_bonus,
           notes_shared, notes_gm, visibility, is_creature, created_at, updated_at, device_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          npc.id,
          npc.campaignId,
          npc.name,
          npc.roleOrType,
          npc.ac,
          npc.hpMax,
          npc.initiativeBonus,
          npc.notesShared,
          npc.notesGm,
          npc.visibility,
          npc.isCreature ? 1 : 0,
          ts,
          ts,
          this.ctx.deviceId,
        ],
      );
      await enqueueOutbox(this.db, this.ctx, 'campaign_npc', id, 'upsert', 1, npc);
    });
    return npc;
  }

  async listNpcs(campaignId: string, viewerRole: ViewerRole = 'gm'): Promise<CampaignNpc[]> {
    const visClause = viewerRole === 'player' ? "AND visibility = 'shared'" : '';
    const rows = await this.db.getAllAsync<{
      id: string;
      campaign_id: string;
      name: string;
      role_or_type: string;
      ac: number;
      hp_max: number;
      initiative_bonus: number;
      notes_shared: string;
      notes_gm: string;
      visibility: string;
      is_creature: number;
    }>(
      `SELECT id, campaign_id, name, role_or_type, ac, hp_max, initiative_bonus,
              notes_shared, notes_gm, visibility, is_creature
       FROM campaign_npc
       WHERE campaign_id = ? AND deleted_at IS NULL ${visClause}
       ORDER BY name ASC`,
      [campaignId],
    );
    return rows.map((r) =>
      campaignNpcSchema.parse({
        id: r.id,
        campaignId: r.campaign_id,
        name: r.name,
        roleOrType: r.role_or_type,
        ac: r.ac,
        hpMax: r.hp_max,
        initiativeBonus: r.initiative_bonus,
        notesShared: r.notes_shared,
        // Strictly strip GM-only notes when queried by a player!
        notesGm: viewerRole === 'player' ? '' : r.notes_gm,
        visibility: r.visibility,
        isCreature: r.is_creature === 1,
      }),
    );
  }

  // ==================== ENCOUNTERS & INITIATIVE ====================
  async createEncounter(input: {
    campaignId: string;
    name: string;
    visibility?: Visibility;
  }): Promise<Encounter> {
    const id = this.ctx.newId();
    const ts = this.ctx.now();
    const enc = encounterSchema.parse({
      id,
      campaignId: input.campaignId,
      name: input.name,
      status: 'active',
      round: 1,
      activeIndex: 0,
      visibility: input.visibility ?? 'shared',
    });
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO encounter
          (id, campaign_id, name, status, round, active_index, visibility, created_at, updated_at, device_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          enc.id,
          enc.campaignId,
          enc.name,
          enc.status,
          enc.round,
          enc.activeIndex,
          enc.visibility,
          ts,
          ts,
          this.ctx.deviceId,
        ],
      );
      await enqueueOutbox(this.db, this.ctx, 'encounter', id, 'upsert', 1, enc);
    });
    return enc;
  }

  async listEncounters(campaignId: string, viewerRole: ViewerRole = 'gm'): Promise<Encounter[]> {
    const visClause = viewerRole === 'player' ? "AND visibility = 'shared'" : '';
    const rows = await this.db.getAllAsync<{
      id: string;
      campaign_id: string;
      name: string;
      status: string;
      round: number;
      active_index: number;
      visibility: string;
    }>(
      `SELECT id, campaign_id, name, status, round, active_index, visibility
       FROM encounter
       WHERE campaign_id = ? AND deleted_at IS NULL ${visClause}
       ORDER BY created_at DESC`,
      [campaignId],
    );
    return rows.map((r) =>
      encounterSchema.parse({
        id: r.id,
        campaignId: r.campaign_id,
        name: r.name,
        status: r.status,
        round: r.round,
        activeIndex: r.active_index,
        visibility: r.visibility,
      }),
    );
  }

  async addParticipant(input: {
    encounterId: string;
    kind: 'character' | 'npc' | 'creature';
    refId?: string | null;
    name: string;
    initiative?: number;
    initiativeBonus?: number;
    hpMax: number;
    ac: number;
    isHiddenFromPlayers?: boolean;
  }): Promise<EncounterParticipant> {
    const id = this.ctx.newId();
    const ts = this.ctx.now();
    const part = encounterParticipantSchema.parse({
      id,
      encounterId: input.encounterId,
      kind: input.kind,
      refId: input.refId ?? null,
      name: input.name,
      initiative: input.initiative ?? 10,
      initiativeBonus: input.initiativeBonus ?? 0,
      hpCurrent: input.hpMax,
      hpMax: input.hpMax,
      ac: input.ac,
      conditions: [],
      isHiddenFromPlayers: input.isHiddenFromPlayers ?? false,
    });
    await this.db.runAsync(
      `INSERT INTO encounter_participant
        (id, encounter_id, kind, ref_id, name, initiative, initiative_bonus,
         hp_current, hp_max, ac, conditions_json, is_hidden_from_players, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?)`,
      [
        part.id,
        part.encounterId,
        part.kind,
        part.refId,
        part.name,
        part.initiative,
        part.initiativeBonus,
        part.hpCurrent,
        part.hpMax,
        part.ac,
        part.isHiddenFromPlayers ? 1 : 0,
        ts,
        ts,
      ],
    );
    return part;
  }

  async listParticipants(
    encounterId: string,
    viewerRole: ViewerRole = 'gm',
  ): Promise<EncounterParticipant[]> {
    const hiddenClause = viewerRole === 'player' ? 'AND is_hidden_from_players = 0' : '';
    const rows = await this.db.getAllAsync<{
      id: string;
      encounter_id: string;
      kind: string;
      ref_id: string | null;
      name: string;
      initiative: number;
      initiative_bonus: number;
      hp_current: number;
      hp_max: number;
      ac: number;
      conditions_json: string;
      is_hidden_from_players: number;
    }>(
      `SELECT * FROM encounter_participant
       WHERE encounter_id = ? ${hiddenClause}
       ORDER BY initiative DESC, name ASC`,
      [encounterId],
    );
    return rows.map((r) =>
      encounterParticipantSchema.parse({
        id: r.id,
        encounterId: r.encounter_id,
        kind: r.kind,
        refId: r.ref_id,
        name: r.name,
        initiative: r.initiative,
        initiativeBonus: r.initiative_bonus,
        hpCurrent: r.hp_current,
        hpMax: r.hp_max,
        ac: r.ac,
        conditions: JSON.parse(r.conditions_json || '[]'),
        isHiddenFromPlayers: r.is_hidden_from_players === 1,
      }),
    );
  }

  async updateParticipant(
    participantId: string,
    patch: {
      initiative?: number;
      hpCurrent?: number;
      conditions?: string[];
      isHiddenFromPlayers?: boolean;
    },
  ): Promise<void> {
    const existing = await this.db.getFirstAsync<{
      initiative: number;
      hp_current: number;
      hp_max: number;
      conditions_json: string;
      is_hidden_from_players: number;
    }>('SELECT * FROM encounter_participant WHERE id = ?', [participantId]);
    if (!existing) return;

    const nextInit = patch.initiative ?? existing.initiative;
    const nextHp =
      patch.hpCurrent !== undefined
        ? Math.max(0, Math.min(existing.hp_max, patch.hpCurrent))
        : existing.hp_current;
    const nextConds = patch.conditions
      ? JSON.stringify(patch.conditions)
      : existing.conditions_json;
    const nextHidden =
      patch.isHiddenFromPlayers !== undefined
        ? patch.isHiddenFromPlayers
          ? 1
          : 0
        : existing.is_hidden_from_players;

    await this.db.runAsync(
      `UPDATE encounter_participant
       SET initiative = ?, hp_current = ?, conditions_json = ?, is_hidden_from_players = ?, updated_at = ?
       WHERE id = ?`,
      [nextInit, nextHp, nextConds, nextHidden, this.ctx.now(), participantId],
    );
  }

  async advanceTurn(encounterId: string): Promise<Encounter> {
    const encRow = await this.db.getFirstAsync<{
      id: string;
      campaign_id: string;
      name: string;
      status: string;
      round: number;
      active_index: number;
      visibility: string;
      version: number;
    }>('SELECT * FROM encounter WHERE id = ? AND deleted_at IS NULL', [encounterId]);
    if (!encRow) throw new Error('Encounter not found');

    const participants = await this.listParticipants(encounterId, 'gm');
    const count = Math.max(1, participants.length);
    const nextIdx = (encRow.active_index + 1) % count;
    const nextRound = nextIdx === 0 ? encRow.round + 1 : encRow.round;
    const version = encRow.version + 1;
    const ts = this.ctx.now();

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `UPDATE encounter SET round = ?, active_index = ?, updated_at = ?, version = ? WHERE id = ?`,
        [nextRound, nextIdx, ts, version, encounterId],
      );
      await enqueueOutbox(this.db, this.ctx, 'encounter', encounterId, 'upsert', version, {
        id: encounterId,
        round: nextRound,
        activeIndex: nextIdx,
      });
    });

    return encounterSchema.parse({
      id: encRow.id,
      campaignId: encRow.campaign_id,
      name: encRow.name,
      status: encRow.status,
      round: nextRound,
      activeIndex: nextIdx,
      visibility: encRow.visibility,
    });
  }
}
