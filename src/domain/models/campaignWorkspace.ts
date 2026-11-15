import { z } from 'zod';

export const visibilitySchema = z.enum(['gm_only', 'shared']);
export type Visibility = z.infer<typeof visibilitySchema>;
export type ViewerRole = 'gm' | 'player';

export const campaignSessionSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  sessionNumber: z.number().int().min(1),
  title: z.string().trim().min(1),
  playedOn: z.string(),
  summary: z.string(),
  visibility: visibilitySchema,
});
export type CampaignSession = z.infer<typeof campaignSessionSchema>;

export const campaignNoteSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  title: z.string().trim().min(1),
  body: z.string(),
  visibility: visibilitySchema,
});
export type CampaignNote = z.infer<typeof campaignNoteSchema>;

export const campaignNpcSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  name: z.string().trim().min(1),
  roleOrType: z.string(),
  ac: z.number().int().min(1),
  hpMax: z.number().int().min(1),
  initiativeBonus: z.number().int(),
  notesShared: z.string(),
  /** Stripped to empty string when queried by a player viewer! */
  notesGm: z.string(),
  visibility: visibilitySchema,
  isCreature: z.boolean(),
});
export type CampaignNpc = z.infer<typeof campaignNpcSchema>;

export const encounterParticipantSchema = z.object({
  id: z.string(),
  encounterId: z.string(),
  kind: z.enum(['character', 'npc', 'creature']),
  refId: z.string().nullable(),
  name: z.string().trim().min(1),
  initiative: z.number().int(),
  initiativeBonus: z.number().int(),
  hpCurrent: z.number().int().min(0),
  hpMax: z.number().int().min(1),
  ac: z.number().int().min(1),
  conditions: z.array(z.string()).default([]),
  isHiddenFromPlayers: z.boolean(),
});
export type EncounterParticipant = z.infer<typeof encounterParticipantSchema>;

export const encounterSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  name: z.string().trim().min(1),
  status: z.enum(['preparing', 'active', 'completed']),
  round: z.number().int().min(1),
  activeIndex: z.number().int().min(0),
  visibility: visibilitySchema,
});
export type Encounter = z.infer<typeof encounterSchema>;
