import type { SqlDatabase } from './types';

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

/** Cheap, deterministic checksum (FNV-1a) used to detect edited historical migrations. */
export function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

interface AppliedRow {
  version: number;
  checksum: string;
}

/**
 * Applies pending migrations in order, each inside its own transaction.
 * Forward-only. Throws if an already-applied migration was modified or if the
 * database is newer than this build knows about.
 */
export async function runMigrations(
  db: SqlDatabase,
  migrations: Migration[],
  now: () => string = () => new Date().toISOString(),
): Promise<number[]> {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  sorted.forEach((m, i) => {
    if (m.version !== i + 1) {
      throw new Error(`Migration versions must be contiguous from 1; got ${m.version} at index ${i}`);
    }
  });

  await db.execAsync(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL,
    checksum TEXT NOT NULL
  )`);

  const applied = await db.getAllAsync<AppliedRow>(
    'SELECT version, checksum FROM schema_migrations ORDER BY version',
  );
  const appliedMap = new Map(applied.map((r) => [r.version, r.checksum]));

  const newest = sorted.length;
  const dbMax = applied.length ? applied[applied.length - 1]!.version : 0;
  if (dbMax > newest) {
    throw new Error(`Database schema v${dbMax} is newer than this app (v${newest}). Update the app.`);
  }

  const ran: number[] = [];
  for (const m of sorted) {
    const sum = checksum(m.sql);
    const existing = appliedMap.get(m.version);
    if (existing !== undefined) {
      if (existing !== sum) {
        throw new Error(`Migration ${m.version} (${m.name}) was modified after being applied.`);
      }
      continue;
    }
    await db.withTransactionAsync(async () => {
      await db.execAsync(m.sql);
      await db.runAsync(
        'INSERT INTO schema_migrations (version, name, applied_at, checksum) VALUES (?, ?, ?, ?)',
        [m.version, m.name, now(), sum],
      );
    });
    ran.push(m.version);
  }
  return ran;
}
