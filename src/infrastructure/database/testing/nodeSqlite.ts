import { DatabaseSync } from 'node:sqlite';
import type { SqlDatabase, SqlValue } from '../types';

/** Test-only adapter: runs the real SQL on Node's built-in SQLite. */
export function createTestDatabase(): SqlDatabase {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  return {
    execAsync: async (sql) => {
      raw.exec(sql);
    },
    runAsync: async (sql, params: SqlValue[] = []) => {
      raw.prepare(sql).run(...params);
    },
    getAllAsync: async <T>(sql: string, params: SqlValue[] = []) =>
      raw.prepare(sql).all(...params) as unknown as T[],
    getFirstAsync: async <T>(sql: string, params: SqlValue[] = []) =>
      (raw.prepare(sql).get(...params) as unknown as T | undefined) ?? null,
    withTransactionAsync: async (task) => {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
