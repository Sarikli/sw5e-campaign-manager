import { migrations } from '../database/migrations';
import { runMigrations } from '../database/migrator';
import { sw5eCoreBundle } from '../database/seed/sw5eCorePack';
import { createTestDatabase } from '../database/testing/nodeSqlite';
import type { SqlDatabase } from '../database/types';
import { SqliteContentRepository } from './contentRepository';

let db: SqlDatabase;
let content: SqliteContentRepository;

beforeEach(async () => {
  db = createTestDatabase();
  await runMigrations(db, migrations);
  content = new SqliteContentRepository(db);
});

describe('SqliteContentRepository & sw5eCoreBundle', () => {
  it('installs the canonical SW5e bundle idempotently and verifies checksum', async () => {
    const first = await content.installBundle(sw5eCoreBundle);
    expect(first.installed).toBe(true);
    expect(first.entryCount).toBeGreaterThan(60);

    const second = await content.installBundle(sw5eCoreBundle);
    expect(second.installed).toBe(false);
    expect(await content.countEntries()).toBe(first.entryCount);
  });

  it('includes all 10 SW5e classes and core categories', async () => {
    await content.installBundle(sw5eCoreBundle);
    const classes = await content.searchEntries({ contentType: 'class' });
    expect(classes.map((c) => c.slug).sort()).toEqual([
      'berserker',
      'consular',
      'engineer',
      'fighter',
      'guardian',
      'monk',
      'operative',
      'scholar',
      'scout',
      'sentinel',
    ]);

    const forcePowers = await content.searchEntries({ contentType: 'force_power' });
    expect(forcePowers.length).toBeGreaterThanOrEqual(10);

    const techPowers = await content.searchEntries({ contentType: 'tech_power' });
    expect(techPowers.length).toBeGreaterThanOrEqual(8);
  });

  it('searches by keyword and filters by content type', async () => {
    await content.installBundle(sw5eCoreBundle);
    const lightsabers = await content.searchEntries({ query: 'lightsaber', contentType: 'weapon' });
    expect(lightsabers.some((w) => w.slug === 'lightsaber')).toBe(true);

    const cathar = await content.getEntry('sw5e:core:species:cathar');
    expect(cathar?.name).toBe('Cathar');
    expect(cathar?.sourceRef).toContain('PHB');
  });

  it('enforces homebrew namespace isolation so custom content never overwrites canonical records', async () => {
    await content.installBundle(sw5eCoreBundle);

    await expect(
      content.installBundle({
        ...sw5eCoreBundle,
        pack: { ...sw5eCoreBundle.pack, origin: 'homebrew' },
      }),
    ).rejects.toThrow(/homebrew:/);
  });
});
