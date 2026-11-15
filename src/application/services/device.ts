import * as Crypto from 'expo-crypto';
import type { SqlDatabase } from '../../infrastructure/database/types';
import type { WriteContext } from '../../infrastructure/database/outbox';

/** Returns the stable per-install device id, creating it on first run. */
export async function getOrCreateDeviceId(db: SqlDatabase): Promise<string> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'device_id'",
  );
  if (row) return row.value;
  const id = Crypto.randomUUID();
  await db.runAsync("INSERT OR IGNORE INTO app_meta (key, value) VALUES ('device_id', ?)", [id]);
  const stored = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'device_id'",
  );
  return stored?.value ?? id;
}

export function createWriteContext(deviceId: string): WriteContext {
  return {
    deviceId,
    now: () => new Date().toISOString(),
    newId: () => Crypto.randomUUID(),
  };
}
