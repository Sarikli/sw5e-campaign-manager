import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';
import { runMigrations } from './migrator';
import type { SqlDatabase, SqlValue } from './types';

const DB_NAME = 'sw5e-campaign-manager.db';

function adapt(db: SQLite.SQLiteDatabase): SqlDatabase {
  return {
    execAsync: (sql) => db.execAsync(sql),
    runAsync: async (sql, params = []) => {
      await db.runAsync(sql, params as SqlValue[]);
    },
    getAllAsync: <T>(sql: string, params: SqlValue[] = []) => db.getAllAsync<T>(sql, params),
    getFirstAsync: <T>(sql: string, params: SqlValue[] = []) => db.getFirstAsync<T>(sql, params),
    withTransactionAsync: (task) => db.withTransactionAsync(task),
  };
}

let opening: Promise<SqlDatabase> | null = null;

/** Opens the app database once, enables FK + WAL, and applies pending migrations. */
export function openAppDatabase(): Promise<SqlDatabase> {
  opening ??= (async () => {
    const raw = await SQLite.openDatabaseAsync(DB_NAME);
    const db = adapt(raw);
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await runMigrations(db, migrations);
    return db;
  })();
  opening.catch(() => {
    opening = null;
  });
  return opening;
}
