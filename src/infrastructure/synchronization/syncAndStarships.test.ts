import { migrations } from '../database/migrations';
import { runMigrations } from '../database/migrator';
import type { WriteContext } from '../database/outbox';
import { createTestDatabase } from '../database/testing/nodeSqlite';
import type { SqlDatabase } from '../database/types';
import { SqliteCampaignRepository } from '../repositories/campaignRepository';
import { SqliteCharacterRepository } from '../repositories/characterRepository';
import { SqliteStarshipRepository } from '../repositories/starshipRepository';
import { SqliteSyncService } from './syncService';

let counter = 0;
const ctx: WriteContext = {
  deviceId: 'device-test',
  now: () => new Date(Date.UTC(2026, 0, 1, 0, 0, ++counter)).toISOString(),
  newId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
};

let db: SqlDatabase;
let characters: SqliteCharacterRepository;
let campaigns: SqliteCampaignRepository;
let starships: SqliteStarshipRepository;
let sync: SqliteSyncService;

beforeEach(async () => {
  db = createTestDatabase();
  await runMigrations(db, migrations);
  characters = new SqliteCharacterRepository(db, ctx);
  campaigns = new SqliteCampaignRepository(db, ctx);
  starships = new SqliteStarshipRepository(db, ctx);
  sync = new SqliteSyncService(db, ctx);
});

describe('Phase 6 & 7 — Sync, Conflict Handling, Export/Import, and Starships', () => {
  it('creates starships, tracks hull & shields, and regenerates shields (SotG)', async () => {
    const ship = await starships.create({
      name: 'Ebon Hawk',
      size: 'Medium',
      tier: 2,
      hullMax: 60,
      shieldMax: 30,
      shieldRegen: 6,
    });
    expect(ship.hullCurrent).toBe(60);
    expect(ship.shieldCurrent).toBe(30);

    const damaged = await starships.updateStatus(ship.id, {
      shieldCurrent: 12,
      hullCurrent: 45,
    });
    expect(damaged.shieldCurrent).toBe(12);
    expect(damaged.hullCurrent).toBe(45);

    const regenerated = await starships.regenerateShields(ship.id);
    expect(regenerated.shieldCurrent).toBe(18);
  });

  it('exports portable bundle, detects revision conflicts without overwriting, and resolves them', async () => {
    const c = await characters.create({ name: 'Revan', levelTotal: 5 });
    const camp = await campaigns.create({ name: 'Mandalorian Wars' });
    const ship = await starships.create({ name: 'Harbinger' });

    const bundle = await sync.exportPortableBundle(
      await characters.list(),
      await campaigns.list(),
      await starships.list(),
    );
    expect(bundle.format).toBe('sw5e-portable-v1');
    expect(bundle.characters).toHaveLength(1);
    expect(bundle.starships[0]!.name).toBe(ship.name);

    // Modify character locally to level 6
    await characters.update(c.id, { levelTotal: 6 });

    // Re-importing the older level 5 bundle must NOT overwrite level 6; it must record a conflict!
    const importRes = await sync.importPortableBundle(bundle);
    expect(importRes.conflictsDetected).toBe(1);
    expect((await characters.get(c.id))?.levelTotal).toBe(6);

    const openConflicts = await sync.listOpenConflicts();
    expect(openConflicts).toHaveLength(1);

    // Resolve by accepting the incoming version
    await sync.resolveConflict(openConflicts[0]!.id, 'accept_remote');
    expect(await sync.listOpenConflicts()).toHaveLength(0);
    expect((await characters.get(c.id))?.levelTotal).toBe(5);
    expect(camp.name).toBe('Mandalorian Wars');
  });

  it('flushes pending outbox operations idempotently through RemoteSyncAdapter', async () => {
    await characters.create({ name: 'Meetra Surik' });
    expect(await sync.getPendingOutboxCount()).toBe(1);

    const flushRes = await sync.flushOutbox({
      pushBatch: async (items) => ({
        acceptedIds: items.map((i) => i.id),
      }),
    });
    expect(flushRes.pushed).toBe(1);
    expect(await sync.getPendingOutboxCount()).toBe(0);
  });
});
