import type { SqlDatabase } from './types';

/**
 * Web stub for expoDatabase so Metro never bundles wa-sqlite.wasm on web.
 * DatabaseProvider uses `webFallbackRepositories` (localStorage) on Platform.OS === 'web'.
 */
export async function openAppDatabase(): Promise<SqlDatabase> {
  throw new Error('Use webFallbackRepositories on web');
}
