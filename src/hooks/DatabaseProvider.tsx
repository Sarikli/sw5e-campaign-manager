import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { LoadingState } from '../components/StateViews';
import type {
  CampaignRepository,
  CharacterRepository,
  ContentRepository,
} from '../application/ports/repositories';
import { createWriteContext, getOrCreateDeviceId } from '../application/services/device';
import { openAppDatabase } from '../infrastructure/database/expoDatabase';
import { sw5eCoreBundle } from '../infrastructure/database/seed/sw5eCorePack';
import { SqliteCampaignRepository } from '../infrastructure/repositories/campaignRepository';
import { SqliteCharacterRepository } from '../infrastructure/repositories/characterRepository';
import { SqliteContentRepository } from '../infrastructure/repositories/contentRepository';
import {
  SqliteStarshipRepository,
  type StarshipRepository,
} from '../infrastructure/repositories/starshipRepository';
import { createFallbackRepositories } from '../infrastructure/repositories/webFallbackRepositories';
import {
  portableBundleSchema,
  SqliteSyncService,
  type PortableBundle,
  type SyncConflictRecord,
} from '../infrastructure/synchronization/syncService';

export interface SyncController {
  getPendingOutboxCount(): Promise<number>;
  listOpenConflicts(): Promise<SyncConflictRecord[]>;
  resolveConflict(conflictId: string, resolution: 'keep_local' | 'accept_remote'): Promise<void>;
  exportPortableBundle(
    characters: Awaited<ReturnType<CharacterRepository['list']>>,
    campaigns: Awaited<ReturnType<CampaignRepository['list']>>,
    starships?: Awaited<ReturnType<StarshipRepository['list']>>,
  ): Promise<PortableBundle>;
  importPortableBundle(rawBundle: unknown): Promise<{
    importedCharacters: number;
    importedCampaigns: number;
    conflictsDetected: number;
  }>;
}

interface Repositories {
  characters: CharacterRepository;
  campaigns: CampaignRepository;
  content: ContentRepository;
  starships: StarshipRepository;
  sync: SyncController;
}

const RepositoryContext = createContext<Repositories | null>(null);

export function useRepositories(): Repositories {
  const value = useContext(RepositoryContext);
  if (!value) throw new Error('useRepositories must be used inside <DatabaseProvider>');
  return value;
}

function buildFallbackSync(fb: ReturnType<typeof createFallbackRepositories>): SyncController {
  return {
    async getPendingOutboxCount() {
      return 0;
    },
    async listOpenConflicts() {
      return [];
    },
    async resolveConflict() {
      // no-op in fallback
    },
    async exportPortableBundle(characters, campaigns, starships = []) {
      return portableBundleSchema.parse({
        format: 'sw5e-portable-v1',
        exportedAt: new Date().toISOString(),
        deviceId: 'web-local',
        characters,
        campaigns,
        starships,
      });
    },
    async importPortableBundle(rawBundle: unknown) {
      const bundle = portableBundleSchema.parse(rawBundle);
      for (const ch of bundle.characters) {
        await fb.characters.create({
          name: ch.name,
          levelTotal: ch.levelTotal,
          creationState: ch.creationState,
          details: ch.details,
        });
      }
      for (const camp of bundle.campaigns) {
        await fb.campaigns.create({
          name: camp.name,
          description: camp.description,
          setting: camp.setting,
        });
      }
      return {
        importedCharacters: bundle.characters.length,
        importedCampaigns: bundle.campaigns.length,
        conflictsDetected: 0,
      };
    },
  };
}

/**
 * Opens + migrates the SQLite database on native Android/iOS, and automatically
 * falls back to the persistent localStorage repository engine on Web or if WASM
 * SharedArrayBuffer headers are absent.
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [repos, setRepos] = useState<Repositories | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (Platform.OS === 'web') {
        const fb = createFallbackRepositories();
        if (!cancelled) {
          setRepos({ ...fb, sync: buildFallbackSync(fb) });
        }
        return;
      }
      try {
        const db = await openAppDatabase();
        const ctx = createWriteContext(await getOrCreateDeviceId(db));
        const content = new SqliteContentRepository(db, ctx.now);
        await content.installBundle(sw5eCoreBundle);
        if (!cancelled) {
          setRepos({
            characters: new SqliteCharacterRepository(db, ctx),
            campaigns: new SqliteCampaignRepository(db, ctx),
            content,
            starships: new SqliteStarshipRepository(db, ctx),
            sync: new SqliteSyncService(db, ctx),
          });
        }
      } catch {
        const fb = createFallbackRepositories();
        if (!cancelled) {
          setRepos({ ...fb, sync: buildFallbackSync(fb) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!repos) return <LoadingState />;
  return <RepositoryContext.Provider value={repos}>{children}</RepositoryContext.Provider>;
}
