import { migrations } from '../database/migrations';
import { runMigrations } from '../database/migrator';
import { createTestDatabase } from '../database/testing/nodeSqlite';
import type { WriteContext } from '../database/outbox';
import type { SqlDatabase } from '../database/types';
import { SqliteCampaignRepository } from './campaignRepository';
import { SqliteCharacterRepository } from './characterRepository';

let counter = 0;
const ctx: WriteContext = {
  deviceId: 'device-1',
  now: () => new Date(Date.UTC(2026, 0, 1, 0, 0, counter++)).toISOString(),
  newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
};

let db: SqlDatabase;
let characters: SqliteCharacterRepository;
let campaigns: SqliteCampaignRepository;

beforeEach(async () => {
  db = createTestDatabase();
  await runMigrations(db, migrations);
  characters = new SqliteCharacterRepository(db, ctx);
  campaigns = new SqliteCampaignRepository(db, ctx);
});

describe('characters', () => {
  it('persists and reloads a character', async () => {
    const c = await characters.create({ name: '  Kira  ' });
    expect(c.name).toBe('Kira');
    expect(c.version).toBe(1);
    expect((await characters.get(c.id))?.name).toBe('Kira');
    expect(await characters.list()).toHaveLength(1);
  });

  it('rejects invalid input without writing', async () => {
    await expect(characters.create({ name: '   ' })).rejects.toThrow();
    expect(await characters.list()).toHaveLength(0);
    expect(await db.getAllAsync('SELECT * FROM sync_outbox')).toHaveLength(0);
  });

  it('soft-deletes and bumps the version', async () => {
    const c = await characters.create({ name: 'Kira' });
    await characters.softDelete(c.id);
    expect(await characters.get(c.id)).toBeNull();
    const row = await db.getFirstAsync<{ version: number; deleted_at: string }>(
      'SELECT version, deleted_at FROM character WHERE id = ?', [c.id]);
    expect(row?.version).toBe(2);
    expect(row?.deleted_at).not.toBeNull();
  });

  it('enqueues outbox entries atomically with writes', async () => {
    const c = await characters.create({ name: 'Kira' });
    await characters.softDelete(c.id);
    const ops = await db.getAllAsync<{ op: string }>('SELECT op FROM sync_outbox ORDER BY created_at');
    expect(ops.map((o) => o.op)).toEqual(['upsert', 'delete']);
  });

  it('persists, updates, and reloads full SW5e character sheet details across restarts', async () => {
    const created = await characters.create({
      name: 'Ahsoka',
      levelTotal: 3,
      creationState: 'complete',
      details: {
        speciesName: 'Togruta',
        classKey: 'sentinel',
        scores: { str: 10, dex: 16, con: 14, int: 12, wis: 15, cha: 14 },
        hpCurrent: 24,
        forcePointsSpent: 4,
        knownPowerIds: ['sw5e:core:force_power:burst-of-speed', 'sw5e:core:force_power:knight-speed'],
      },
    });
    expect(created.details.speciesName).toBe('Togruta');
    expect(created.details.classKey).toBe('sentinel');

    const updated = await characters.update(created.id, {
      levelTotal: 4,
      details: {
        hpCurrent: 31,
        forcePointsSpent: 0,
      },
    });
    expect(updated.levelTotal).toBe(4);
    expect(updated.version).toBe(2);
    expect(updated.details.hpCurrent).toBe(31);
    expect(updated.details.forcePointsSpent).toBe(0);
    expect(updated.details.speciesName).toBe('Togruta');
  });
});

describe('campaigns', () => {
  it('creates a campaign with defaults', async () => {
    const camp = await campaigns.create({ name: 'Outer Rim' });
    expect(camp.status).toBe('planning');
    expect(await campaigns.list()).toHaveLength(1);
  });

  it('links one character to several campaigns without duplicating it', async () => {
    const c = await characters.create({ name: 'Kira' });
    const a = await campaigns.create({ name: 'A' });
    const b = await campaigns.create({ name: 'B' });
    await campaigns.addCharacter(a.id, c.id);
    await campaigns.addCharacter(b.id, c.id);
    expect(await campaigns.listCharacters(a.id)).toHaveLength(1);
    expect(await campaigns.listCharacters(b.id)).toHaveLength(1);
    expect(await characters.list()).toHaveLength(1);
  });

  it('addCharacter is idempotent', async () => {
    const c = await characters.create({ name: 'Kira' });
    const a = await campaigns.create({ name: 'A' });
    await campaigns.addCharacter(a.id, c.id);
    await campaigns.addCharacter(a.id, c.id);
    expect(await campaigns.listCharacters(a.id)).toHaveLength(1);
  });

  it('removing a character keeps its data and allows re-adding', async () => {
    const c = await characters.create({ name: 'Kira' });
    const a = await campaigns.create({ name: 'A' });
    await campaigns.addCharacter(a.id, c.id);
    await campaigns.removeCharacter(a.id, c.id);
    expect(await campaigns.listCharacters(a.id)).toHaveLength(0);
    expect((await characters.get(c.id))?.name).toBe('Kira');
    await campaigns.addCharacter(a.id, c.id);
    expect(await campaigns.listCharacters(a.id)).toHaveLength(1);
  });

  it('strictly hides GM-only notes, NPC secrets, and hidden encounter participants from player views', async () => {
    const camp = await campaigns.create({ name: 'Shadows of Nar Shaddaa' });

    await campaigns.addNote({
      campaignId: camp.id,
      title: 'Public Holonet Bounty',
      body: '10,000 cr for the Hutt courier',
      visibility: 'shared',
    });
    await campaigns.addNote({
      campaignId: camp.id,
      title: 'GM Plot Twist',
      body: 'The courier is an Imperial Inquisitor',
      visibility: 'gm_only',
    });

    expect(await campaigns.listNotes(camp.id, 'gm')).toHaveLength(2);
    const playerNotes = await campaigns.listNotes(camp.id, 'player');
    expect(playerNotes).toHaveLength(1);
    expect(playerNotes[0]!.title).toBe('Public Holonet Bounty');

    await campaigns.addNpc({
      campaignId: camp.id,
      name: 'Vinto the Informant',
      notesShared: 'Friendly Rodian broker',
      notesGm: 'Secretly reports to Black Sun',
      visibility: 'shared',
    });
    await campaigns.addNpc({
      campaignId: camp.id,
      name: 'Cloaked Sith Assassin',
      notesGm: 'Ambushes in Round 2',
      visibility: 'gm_only',
    });

    const gmNpcs = await campaigns.listNpcs(camp.id, 'gm');
    expect(gmNpcs).toHaveLength(2);
    expect(gmNpcs.find((n) => n.name === 'Vinto the Informant')?.notesGm).toContain('Black Sun');

    const playerNpcs = await campaigns.listNpcs(camp.id, 'player');
    expect(playerNpcs).toHaveLength(1);
    expect(playerNpcs[0]!.name).toBe('Vinto the Informant');
    expect(playerNpcs[0]!.notesGm).toBe('');
  });

  it('manages encounters, initiative order, HP changes, and turn/round progression', async () => {
    const camp = await campaigns.create({ name: 'Clone Wars' });
    const enc = await campaigns.createEncounter({ campaignId: camp.id, name: 'Geonosis Arena' });

    const p1 = await campaigns.addParticipant({
      encounterId: enc.id,
      kind: 'character',
      name: 'Kira',
      initiative: 18,
      hpMax: 30,
      ac: 16,
    });
    await campaigns.addParticipant({
      encounterId: enc.id,
      kind: 'creature',
      name: 'Droideka',
      initiative: 12,
      hpMax: 68,
      ac: 15,
    });
    await campaigns.addParticipant({
      encounterId: enc.id,
      kind: 'npc',
      name: 'Stealth Probe',
      initiative: 20,
      hpMax: 15,
      ac: 14,
      isHiddenFromPlayers: true,
    });

    expect(await campaigns.listParticipants(enc.id, 'gm')).toHaveLength(3);
    const visibleToPlayers = await campaigns.listParticipants(enc.id, 'player');
    expect(visibleToPlayers.map((p) => p.name)).toEqual(['Kira', 'Droideka']);

    await campaigns.updateParticipant(p1.id, { hpCurrent: 22 });
    const afterDmg = await campaigns.listParticipants(enc.id, 'player');
    expect(afterDmg[0]!.hpCurrent).toBe(22);

    const turn2 = await campaigns.advanceTurn(enc.id);
    expect(turn2.round).toBe(1);
    expect(turn2.activeIndex).toBe(1);

    await campaigns.advanceTurn(enc.id);
    const round2 = await campaigns.advanceTurn(enc.id);
    expect(round2.round).toBe(2);
    expect(round2.activeIndex).toBe(0);
  });
});
