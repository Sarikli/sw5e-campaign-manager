import { migrations } from './migrations';
import { checksum, runMigrations } from './migrator';
import { createTestDatabase } from './testing/nodeSqlite';

describe('runMigrations', () => {
  it('applies all migrations on a fresh database', async () => {
    const db = createTestDatabase();
    const ran = await runMigrations(db, migrations);
    expect(ran).toEqual(migrations.map((m) => m.version));
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const names = tables.map((t) => t.name);
    for (const t of ['character', 'campaign', 'campaign_character', 'sync_outbox', 'schema_migrations']) {
      expect(names).toContain(t);
    }
  });

  it('is idempotent when run twice', async () => {
    const db = createTestDatabase();
    await runMigrations(db, migrations);
    expect(await runMigrations(db, migrations)).toEqual([]);
  });

  it('upgrades a database that is one version behind', async () => {
    const db = createTestDatabase();
    await runMigrations(db, migrations.slice(0, -1));
    const newest = migrations[migrations.length - 1]!.version;
    expect(await runMigrations(db, migrations)).toEqual([newest]);
  });

  it('rolls back a failed migration and does not record it', async () => {
    const db = createTestDatabase();
    const bad = [{ version: 1, name: 'bad', sql: 'CREATE TABLE a (x); CREATE TABLE a (x);' }];
    await expect(runMigrations(db, bad)).rejects.toThrow();
    const rows = await db.getAllAsync('SELECT * FROM schema_migrations');
    expect(rows).toHaveLength(0);
  });

  it('rejects a modified historical migration', async () => {
    const db = createTestDatabase();
    await runMigrations(db, migrations);
    const tampered = migrations.map((m, i) => (i === 0 ? { ...m, sql: m.sql + ' ' } : m));
    await expect(runMigrations(db, tampered)).rejects.toThrow(/modified/);
  });

  it('rejects a database newer than the app', async () => {
    const db = createTestDatabase();
    await runMigrations(db, migrations);
    await expect(runMigrations(db, migrations.slice(0, 1))).rejects.toThrow(/newer/);
  });

  it('rejects non-contiguous versions', async () => {
    const db = createTestDatabase();
    await expect(runMigrations(db, [{ version: 2, name: 'x', sql: 'SELECT 1' }])).rejects.toThrow(/contiguous/);
  });

  it('produces stable checksums', () => {
    expect(checksum('abc')).toBe(checksum('abc'));
    expect(checksum('abc')).not.toBe(checksum('abd'));
  });
});
