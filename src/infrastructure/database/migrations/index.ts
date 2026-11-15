import type { Migration } from '../migrator';
import { migration0001 } from './0001_meta_and_sync';
import { migration0002 } from './0002_characters_and_campaigns';
import { migration0003 } from './0003_content_packs';
import { migration0004 } from './0004_campaign_workspace';
import { migration0005 } from './0005_starships';

/** Ordered, append-only. Never edit an entry that has shipped; add a new migration. */
export const migrations: Migration[] = [
  migration0001,
  migration0002,
  migration0003,
  migration0004,
  migration0005,
];
