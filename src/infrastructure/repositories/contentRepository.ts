import type {
  ContentRepository,
  ContentSearchFilter,
} from '../../application/ports/repositories';
import {
  contentBundleSchema,
  contentEntrySchema,
  contentPackSchema,
  type ContentBundle,
  type ContentEntry,
  type ContentPack,
  type ContentType,
} from '../../domain/sw5e/contentSchema';
import { checksum } from '../database/migrator';
import type { SqlDatabase, SqlValue } from '../database/types';

interface PackRow {
  id: string;
  namespace: string;
  name: string;
  publisher: string;
  rules_version: string;
  data_version: string;
  license_id: string;
  attribution: string;
  source_url: string;
  origin: string;
  checksum: string;
}

interface EntryRow {
  id: string;
  pack_id: string;
  slug: string;
  content_type: string;
  name: string;
  summary: string;
  description: string;
  prerequisites_json: string;
  properties_json: string;
  source_ref: string;
  rules_version: string;
  data_version: string;
  attribution: string;
  is_custom: number;
}

function toPack(row: PackRow): ContentPack {
  return contentPackSchema.parse({
    id: row.id,
    namespace: row.namespace,
    name: row.name,
    publisher: row.publisher,
    rulesVersion: row.rules_version,
    dataVersion: row.data_version,
    licenseId: row.license_id,
    attribution: row.attribution,
    sourceUrl: row.source_url,
    origin: row.origin,
  });
}

function toEntry(row: EntryRow): ContentEntry {
  return contentEntrySchema.parse({
    id: row.id,
    packId: row.pack_id,
    slug: row.slug,
    contentType: row.content_type,
    name: row.name,
    summary: row.summary,
    description: row.description,
    prerequisitesJson: row.prerequisites_json,
    propertiesJson: row.properties_json,
    sourceRef: row.source_ref,
    rulesVersion: row.rules_version,
    dataVersion: row.data_version,
    attribution: row.attribution,
    isCustom: row.is_custom === 1,
  });
}

export class SqliteContentRepository implements ContentRepository {
  constructor(
    private readonly db: SqlDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async installBundle(
    rawBundle: ContentBundle,
  ): Promise<{ installed: boolean; entryCount: number }> {
    const bundle = contentBundleSchema.parse(rawBundle);
    const { pack, entries } = bundle;

    // Enforce homebrew separation: homebrew packs cannot use canonical namespaces,
    // and every entry ID must start with `<pack.namespace>:`.
    if (pack.origin === 'homebrew' && !pack.namespace.startsWith('homebrew:')) {
      throw new Error('Homebrew packs must use a namespace starting with "homebrew:"');
    }
    if (pack.origin !== 'homebrew' && pack.namespace.startsWith('homebrew:')) {
      throw new Error('Non-homebrew packs cannot use the "homebrew:" namespace');
    }
    for (const entry of entries) {
      if (entry.packId !== pack.id) {
        throw new Error(`Entry ${entry.id} packId (${entry.packId}) does not match pack ${pack.id}`);
      }
      if (!entry.id.startsWith(`${pack.namespace}:`)) {
        throw new Error(`Entry ${entry.id} must be namespaced with "${pack.namespace}:"`);
      }
    }

    const bundleChecksum = checksum(
      JSON.stringify({
        pack,
        entries: entries.map((e) => ({ id: e.id, v: e.dataVersion, name: e.name })),
      }),
    );

    const existing = await this.db.getFirstAsync<{ id: string; checksum: string; origin: string }>(
      'SELECT id, checksum, origin FROM content_pack WHERE id = ?',
      [pack.id],
    );
    if (existing && existing.checksum === bundleChecksum) {
      return { installed: false, entryCount: entries.length };
    }
    if (existing && existing.origin !== 'homebrew' && pack.origin === 'homebrew') {
      throw new Error('Homebrew pack cannot overwrite a canonical content pack');
    }

    const ts = this.now();
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('DELETE FROM content_entry WHERE pack_id = ?', [pack.id]);
      await this.db.runAsync(
        `INSERT OR REPLACE INTO content_pack
          (id, namespace, name, publisher, rules_version, data_version, license_id,
           attribution, source_url, origin, checksum, installed_at, enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          pack.id,
          pack.namespace,
          pack.name,
          pack.publisher,
          pack.rulesVersion,
          pack.dataVersion,
          pack.licenseId,
          pack.attribution,
          pack.sourceUrl,
          pack.origin,
          bundleChecksum,
          ts,
        ],
      );

      for (const entry of entries) {
        await this.db.runAsync(
          `INSERT INTO content_entry
            (id, pack_id, slug, content_type, name, name_sort, summary, description,
             prerequisites_json, properties_json, source_ref, rules_version, data_version,
             attribution, is_custom)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.packId,
            entry.slug,
            entry.contentType,
            entry.name,
            entry.name.toLowerCase(),
            entry.summary,
            entry.description,
            entry.prerequisitesJson,
            entry.propertiesJson,
            entry.sourceRef,
            entry.rulesVersion,
            entry.dataVersion,
            entry.attribution,
            pack.origin === 'homebrew' || entry.isCustom ? 1 : 0,
          ],
        );
      }
    });

    return { installed: true, entryCount: entries.length };
  }

  async listPacks(): Promise<ContentPack[]> {
    const rows = await this.db.getAllAsync<PackRow>(
      'SELECT * FROM content_pack WHERE enabled = 1 ORDER BY name',
    );
    return rows.map(toPack);
  }

  async searchEntries(filter: ContentSearchFilter = {}): Promise<ContentEntry[]> {
    const clauses: string[] = ['p.enabled = 1'];
    const params: SqlValue[] = [];

    if (filter.contentType) {
      clauses.push('e.content_type = ?');
      params.push(filter.contentType);
    }
    if (filter.includeHomebrew === false) {
      clauses.push('e.is_custom = 0');
    }
    const q = filter.query?.trim().toLowerCase();
    if (q) {
      clauses.push('(e.name_sort LIKE ? OR LOWER(e.summary) LIKE ? OR LOWER(e.description) LIKE ?)');
      const pat = `%${q}%`;
      params.push(pat, pat, pat);
    }

    const limit = Math.max(1, Math.min(500, filter.limit ?? 200));
    params.push(limit);

    const rows = await this.db.getAllAsync<EntryRow>(
      `SELECT e.*
       FROM content_entry e
       JOIN content_pack p ON p.id = e.pack_id
       WHERE ${clauses.join(' AND ')}
       ORDER BY e.name_sort ASC
       LIMIT ?`,
      params,
    );
    return rows.map(toEntry);
  }

  async getEntry(id: string): Promise<ContentEntry | null> {
    const row = await this.db.getFirstAsync<EntryRow>(
      'SELECT * FROM content_entry WHERE id = ?',
      [id],
    );
    return row ? toEntry(row) : null;
  }

  async countEntries(contentType?: ContentType): Promise<number> {
    const row = contentType
      ? await this.db.getFirstAsync<{ n: number }>(
          'SELECT COUNT(*) as n FROM content_entry WHERE content_type = ?',
          [contentType],
        )
      : await this.db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM content_entry');
    return row?.n ?? 0;
  }
}
