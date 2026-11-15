/**
 * Browser / Web fallback implementation of the repository interfaces backed by
 * localStorage when available (and in-memory otherwise).
 *
 * Why: On native Android and iOS, `expo-sqlite` is the primary persistent store.
 * On Web previews where COOP/COEP SharedArrayBuffer headers for `wa-sqlite.wasm`
 * are unavailable, this fallback ensures the app launches immediately and all
 * character, campaign, compendium, starship, and sync workflows remain functional.
 */
import type {
  CampaignRepository,
  CharacterRepository,
  ContentRepository,
  ContentSearchFilter,
} from '../../application/ports/repositories';
import {
  campaignSchema,
  characterDataSchema,
  characterSchema,
  newCampaignSchema,
  newCharacterSchema,
  type Campaign,
  type Character,
  type CharacterDetails,
  type NewCampaign,
  type NewCharacter,
} from '../../domain/models';
import {
  campaignNoteSchema,
  campaignNpcSchema,
  campaignSessionSchema,
  encounterParticipantSchema,
  encounterSchema,
  type CampaignNote,
  type CampaignNpc,
  type CampaignSession,
  type Encounter,
  type EncounterParticipant,
  type ViewerRole,
  type Visibility,
} from '../../domain/models/campaignWorkspace';
import type {
  ContentBundle,
  ContentEntry,
  ContentPack,
  ContentType,
} from '../../domain/sw5e/contentSchema';
import { sw5eCoreBundle } from '../database/seed/sw5eCorePack';
import {
  starshipSchema,
  type Starship,
  type StarshipCrewSlot,
  type StarshipRepository,
  type StarshipSize,
} from './starshipRepository';

interface StoreState {
  characters: Character[];
  campaigns: Campaign[];
  campaignCharacters: Record<string, string[]>;
  sessions: CampaignSession[];
  notes: CampaignNote[];
  npcs: CampaignNpc[];
  encounters: Encounter[];
  participants: EncounterParticipant[];
  starships: Starship[];
  packs: ContentPack[];
  entries: ContentEntry[];
}

const STORAGE_KEY = 'sw5e_campaign_manager_store_v1';

function loadState(): StoreState {
  const initial: StoreState = {
    characters: [],
    campaigns: [],
    campaignCharacters: {},
    sessions: [],
    notes: [],
    npcs: [],
    encounters: [],
    participants: [],
    starships: [],
    packs: [sw5eCoreBundle.pack],
    entries: [...sw5eCoreBundle.entries],
  };
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoreState>;
        const customEntries = (parsed.entries ?? []).filter((e) => e.isCustom);
        return {
          ...initial,
          ...parsed,
          packs: [sw5eCoreBundle.pack],
          entries: [...sw5eCoreBundle.entries, ...customEntries],
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return initial;
}

function saveState(state: StoreState): void {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // ignore storage errors
  }
}

let seq = 1;
function makeUuid(): string {
  const hex = (++seq + Date.now()).toString(16).padStart(12, '0').slice(-12);
  return `00000000-0000-4000-8000-${hex}`;
}

export function createFallbackRepositories() {
  const state = loadState();
  const now = () => new Date().toISOString();

  const characters: CharacterRepository = {
    async create(input: NewCharacter): Promise<Character> {
      const parsed = newCharacterSchema.parse(input);
      const ts = now();
      const ch = characterSchema.parse({
        id: makeUuid(),
        name: parsed.name,
        levelTotal: parsed.levelTotal ?? 1,
        creationState: parsed.creationState ?? 'complete',
        details: characterDataSchema.parse(parsed.details ?? {}),
        createdAt: ts,
        updatedAt: ts,
        version: 1,
        deletedAt: null,
      });
      state.characters.unshift(ch);
      saveState(state);
      return ch;
    },
    async update(
      id: string,
      patch: {
        name?: string;
        levelTotal?: number;
        creationState?: 'draft' | 'complete';
        details?: Partial<CharacterDetails>;
      },
    ): Promise<Character> {
      const idx = state.characters.findIndex((c) => c.id === id);
      if (idx < 0) throw new Error('Character not found');
      const existing = state.characters[idx]!;
      const updated = characterSchema.parse({
        ...existing,
        name: patch.name !== undefined ? patch.name.trim() : existing.name,
        levelTotal: patch.levelTotal ?? existing.levelTotal,
        creationState: patch.creationState ?? existing.creationState,
        details: characterDataSchema.parse({ ...existing.details, ...(patch.details ?? {}) }),
        updatedAt: now(),
        version: existing.version + 1,
      });
      state.characters[idx] = updated;
      saveState(state);
      return updated;
    },
    async list(): Promise<Character[]> {
      return state.characters.filter((c) => !c.deletedAt);
    },
    async get(id: string): Promise<Character | null> {
      return state.characters.find((c) => c.id === id && !c.deletedAt) ?? null;
    },
    async softDelete(id: string): Promise<void> {
      const ch = state.characters.find((c) => c.id === id);
      if (ch) {
        ch.deletedAt = now();
        saveState(state);
      }
    },
  };

  const campaigns: CampaignRepository = {
    async create(input: NewCampaign): Promise<Campaign> {
      const data = newCampaignSchema.parse(input);
      const ts = now();
      const camp = campaignSchema.parse({
        id: makeUuid(),
        name: data.name,
        description: data.description,
        setting: data.setting,
        status: 'planning',
        createdAt: ts,
        updatedAt: ts,
        version: 1,
        deletedAt: null,
      });
      state.campaigns.unshift(camp);
      saveState(state);
      return camp;
    },
    async list(): Promise<Campaign[]> {
      return state.campaigns.filter((c) => !c.deletedAt);
    },
    async get(id: string): Promise<Campaign | null> {
      return state.campaigns.find((c) => c.id === id && !c.deletedAt) ?? null;
    },
    async softDelete(id: string): Promise<void> {
      const camp = state.campaigns.find((c) => c.id === id);
      if (camp) {
        camp.deletedAt = now();
        saveState(state);
      }
    },
    async addCharacter(campaignId: string, characterId: string): Promise<void> {
      const list = state.campaignCharacters[campaignId] ?? [];
      if (!list.includes(characterId)) {
        state.campaignCharacters[campaignId] = [...list, characterId];
        saveState(state);
      }
    },
    async removeCharacter(campaignId: string, characterId: string): Promise<void> {
      const list = state.campaignCharacters[campaignId] ?? [];
      state.campaignCharacters[campaignId] = list.filter((id) => id !== characterId);
      saveState(state);
    },
    async listCharacters(campaignId: string): Promise<Character[]> {
      const ids = new Set(state.campaignCharacters[campaignId] ?? []);
      return state.characters.filter((c) => ids.has(c.id) && !c.deletedAt);
    },
    async addSession(input) {
      const s = campaignSessionSchema.parse({
        id: makeUuid(),
        campaignId: input.campaignId,
        sessionNumber: input.sessionNumber,
        title: input.title,
        playedOn: input.playedOn ?? now().slice(0, 10),
        summary: input.summary ?? '',
        visibility: input.visibility ?? 'shared',
      });
      state.sessions.unshift(s);
      saveState(state);
      return s;
    },
    async listSessions(campaignId: string, viewerRole: ViewerRole = 'gm') {
      return state.sessions.filter(
        (s) => s.campaignId === campaignId && (viewerRole === 'gm' || s.visibility === 'shared'),
      );
    },
    async addNote(input) {
      const n = campaignNoteSchema.parse({
        id: makeUuid(),
        campaignId: input.campaignId,
        title: input.title,
        body: input.body,
        visibility: input.visibility ?? 'shared',
      });
      state.notes.unshift(n);
      saveState(state);
      return n;
    },
    async listNotes(campaignId: string, viewerRole: ViewerRole = 'gm') {
      return state.notes.filter(
        (n) => n.campaignId === campaignId && (viewerRole === 'gm' || n.visibility === 'shared'),
      );
    },
    async addNpc(input) {
      const npc = campaignNpcSchema.parse({
        id: makeUuid(),
        campaignId: input.campaignId,
        name: input.name,
        roleOrType: input.roleOrType ?? 'NPC',
        ac: input.ac ?? 13,
        hpMax: input.hpMax ?? 22,
        initiativeBonus: input.initiativeBonus ?? 1,
        notesShared: input.notesShared ?? '',
        notesGm: input.notesGm ?? '',
        visibility: input.visibility ?? 'shared',
        isCreature: input.isCreature ?? false,
      });
      state.npcs.push(npc);
      saveState(state);
      return npc;
    },
    async listNpcs(campaignId: string, viewerRole: ViewerRole = 'gm') {
      return state.npcs
        .filter(
          (n) => n.campaignId === campaignId && (viewerRole === 'gm' || n.visibility === 'shared'),
        )
        .map((n) => (viewerRole === 'player' ? { ...n, notesGm: '' } : n));
    },
    async createEncounter(input: { campaignId: string; name: string; visibility?: Visibility }) {
      const enc = encounterSchema.parse({
        id: makeUuid(),
        campaignId: input.campaignId,
        name: input.name,
        status: 'active',
        round: 1,
        activeIndex: 0,
        visibility: input.visibility ?? 'shared',
      });
      state.encounters.unshift(enc);
      saveState(state);
      return enc;
    },
    async listEncounters(campaignId: string, viewerRole: ViewerRole = 'gm') {
      return state.encounters.filter(
        (e) => e.campaignId === campaignId && (viewerRole === 'gm' || e.visibility === 'shared'),
      );
    },
    async addParticipant(input) {
      const p = encounterParticipantSchema.parse({
        id: makeUuid(),
        encounterId: input.encounterId,
        kind: input.kind,
        refId: input.refId ?? null,
        name: input.name,
        initiative: input.initiative ?? 10,
        initiativeBonus: input.initiativeBonus ?? 0,
        hpCurrent: input.hpMax,
        hpMax: input.hpMax,
        ac: input.ac,
        conditions: [],
        isHiddenFromPlayers: input.isHiddenFromPlayers ?? false,
      });
      state.participants.push(p);
      saveState(state);
      return p;
    },
    async listParticipants(encounterId: string, viewerRole: ViewerRole = 'gm') {
      return state.participants
        .filter(
          (p) =>
            p.encounterId === encounterId && (viewerRole === 'gm' || !p.isHiddenFromPlayers),
        )
        .sort((a, b) => b.initiative - a.initiative);
    },
    async updateParticipant(participantId: string, patch) {
      const p = state.participants.find((item) => item.id === participantId);
      if (!p) return;
      if (patch.initiative !== undefined) p.initiative = patch.initiative;
      if (patch.hpCurrent !== undefined) {
        p.hpCurrent = Math.max(0, Math.min(p.hpMax, patch.hpCurrent));
      }
      if (patch.conditions !== undefined) p.conditions = patch.conditions;
      if (patch.isHiddenFromPlayers !== undefined) {
        p.isHiddenFromPlayers = patch.isHiddenFromPlayers;
      }
      saveState(state);
    },
    async advanceTurn(encounterId: string) {
      const enc = state.encounters.find((e) => e.id === encounterId);
      if (!enc) throw new Error('Encounter not found');
      const parts = await this.listParticipants(encounterId, 'gm');
      const count = Math.max(1, parts.length);
      enc.activeIndex = (enc.activeIndex + 1) % count;
      if (enc.activeIndex === 0) enc.round += 1;
      saveState(state);
      return enc;
    },
  };

  const content: ContentRepository = {
    async installBundle(bundle: ContentBundle) {
      state.packs = [bundle.pack];
      state.entries = [...bundle.entries];
      saveState(state);
      return { installed: true, entryCount: bundle.entries.length };
    },
    async listPacks() {
      return state.packs;
    },
    async searchEntries(filter: ContentSearchFilter = {}) {
      const q = filter.query?.trim().toLowerCase();
      return state.entries
        .filter((e) => {
          if (filter.contentType && e.contentType !== filter.contentType) return false;
          if (q) {
            return (
              e.name.toLowerCase().includes(q) ||
              e.summary.toLowerCase().includes(q) ||
              e.description.toLowerCase().includes(q)
            );
          }
          return true;
        })
        .slice(0, filter.limit ?? 200);
    },
    async getEntry(id: string) {
      return state.entries.find((e) => e.id === id) ?? null;
    },
    async countEntries(contentType?: ContentType) {
      return contentType
        ? state.entries.filter((e) => e.contentType === contentType).length
        : state.entries.length;
    },
  };

  const starships: StarshipRepository = {
    async create(input: {
      name: string;
      size?: StarshipSize;
      tier?: number;
      ac?: number;
      hullMax?: number;
      shieldMax?: number;
      shieldRegen?: number;
      flyingSpeed?: number;
      turningSpeed?: number;
      weapons?: string[];
      crew?: StarshipCrewSlot[];
    }) {
      const hullMax = input.hullMax ?? 45;
      const shieldMax = input.shieldMax ?? 25;
      const ship = starshipSchema.parse({
        id: makeUuid(),
        name: input.name,
        size: input.size ?? 'Medium',
        tier: input.tier ?? 1,
        ac: input.ac ?? 14,
        hullCurrent: hullMax,
        hullMax,
        shieldCurrent: shieldMax,
        shieldMax,
        shieldRegen: input.shieldRegen ?? 5,
        flyingSpeed: input.flyingSpeed ?? 250,
        turningSpeed: input.turningSpeed ?? 150,
        weapons: input.weapons ?? [
          'Quad Laser Cannon (2d8 energy)',
          'Concussion Missile Launcher (3d10 kinetic)',
        ],
        crew: input.crew ?? [
          { role: 'pilot', characterName: 'Unassigned', rank: 1 },
          { role: 'gunner', characterName: 'Unassigned', rank: 1 },
        ],
        version: 1,
      });
      state.starships.unshift(ship);
      saveState(state);
      return ship;
    },
    async list() {
      return state.starships;
    },
    async updateStatus(id, patch) {
      const ship = state.starships.find((s) => s.id === id);
      if (!ship) throw new Error('Starship not found');
      if (patch.hullCurrent !== undefined) {
        ship.hullCurrent = Math.max(0, Math.min(ship.hullMax, patch.hullCurrent));
      }
      if (patch.shieldCurrent !== undefined) {
        ship.shieldCurrent = Math.max(0, Math.min(ship.shieldMax, patch.shieldCurrent));
      }
      if (patch.tier !== undefined) ship.tier = patch.tier;
      if (patch.crew !== undefined) ship.crew = patch.crew;
      ship.version += 1;
      saveState(state);
      return { ...ship };
    },
    async regenerateShields(id) {
      const ship = state.starships.find((s) => s.id === id);
      if (!ship) throw new Error('Starship not found');
      ship.shieldCurrent = Math.min(ship.shieldMax, ship.shieldCurrent + ship.shieldRegen);
      saveState(state);
      return { ...ship };
    },
  };

  return { characters, campaigns, content, starships };
}
