import type {
  Campaign,
  Character,
  CharacterDetails,
  NewCampaign,
  NewCharacter,
} from '../../domain/models';
import type {
  CampaignNote,
  CampaignNpc,
  CampaignSession,
  Encounter,
  EncounterParticipant,
  ViewerRole,
  Visibility,
} from '../../domain/models/campaignWorkspace';
import type {
  ContentBundle,
  ContentEntry,
  ContentPack,
  ContentType,
} from '../../domain/sw5e/contentSchema';

export interface CharacterRepository {
  create(input: NewCharacter): Promise<Character>;
  update(
    id: string,
    patch: {
      name?: string;
      levelTotal?: number;
      creationState?: 'draft' | 'complete';
      details?: Partial<CharacterDetails>;
    },
  ): Promise<Character>;
  list(): Promise<Character[]>;
  get(id: string): Promise<Character | null>;
  softDelete(id: string): Promise<void>;
}

export interface CampaignRepository {
  create(input: NewCampaign): Promise<Campaign>;
  list(): Promise<Campaign[]>;
  get(id: string): Promise<Campaign | null>;
  softDelete(id: string): Promise<void>;
  /** Links an existing character; never duplicates the character record. */
  addCharacter(campaignId: string, characterId: string): Promise<void>;
  removeCharacter(campaignId: string, characterId: string): Promise<void>;
  listCharacters(campaignId: string): Promise<Character[]>;

  // Sessions & Notes (respecting GM/Player privacy)
  addSession(input: {
    campaignId: string;
    sessionNumber: number;
    title: string;
    playedOn?: string;
    summary?: string;
    visibility?: Visibility;
  }): Promise<CampaignSession>;
  listSessions(campaignId: string, viewerRole?: ViewerRole): Promise<CampaignSession[]>;

  addNote(input: {
    campaignId: string;
    title: string;
    body: string;
    visibility?: Visibility;
  }): Promise<CampaignNote>;
  listNotes(campaignId: string, viewerRole?: ViewerRole): Promise<CampaignNote[]>;

  // NPCs & Creatures (respecting GM/Player privacy)
  addNpc(input: {
    campaignId: string;
    name: string;
    roleOrType?: string;
    ac?: number;
    hpMax?: number;
    initiativeBonus?: number;
    notesShared?: string;
    notesGm?: string;
    visibility?: Visibility;
    isCreature?: boolean;
  }): Promise<CampaignNpc>;
  listNpcs(campaignId: string, viewerRole?: ViewerRole): Promise<CampaignNpc[]>;

  // Encounters & Initiative Combat Tracker
  createEncounter(input: {
    campaignId: string;
    name: string;
    visibility?: Visibility;
  }): Promise<Encounter>;
  listEncounters(campaignId: string, viewerRole?: ViewerRole): Promise<Encounter[]>;
  addParticipant(input: {
    encounterId: string;
    kind: 'character' | 'npc' | 'creature';
    refId?: string | null;
    name: string;
    initiative?: number;
    initiativeBonus?: number;
    hpMax: number;
    ac: number;
    isHiddenFromPlayers?: boolean;
  }): Promise<EncounterParticipant>;
  listParticipants(
    encounterId: string,
    viewerRole?: ViewerRole,
  ): Promise<EncounterParticipant[]>;
  updateParticipant(
    participantId: string,
    patch: {
      initiative?: number;
      hpCurrent?: number;
      conditions?: string[];
      isHiddenFromPlayers?: boolean;
    },
  ): Promise<void>;
  advanceTurn(encounterId: string): Promise<Encounter>;
}

export interface ContentSearchFilter {
  query?: string;
  contentType?: ContentType;
  includeHomebrew?: boolean;
  limit?: number;
}

export interface ContentRepository {
  installBundle(bundle: ContentBundle): Promise<{ installed: boolean; entryCount: number }>;
  listPacks(): Promise<ContentPack[]>;
  searchEntries(filter?: ContentSearchFilter): Promise<ContentEntry[]>;
  getEntry(id: string): Promise<ContentEntry | null>;
  countEntries(contentType?: ContentType): Promise<number>;
}
