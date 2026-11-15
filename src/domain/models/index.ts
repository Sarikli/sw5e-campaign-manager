import { z } from 'zod';
import {
  characterDataSchema,
  type CharacterDetails,
  type InventoryItemData,
} from './characterSheet';

export {
  abilityScoresSchema,
  characterDataSchema,
  defaultSavesForClass,
  inventoryItemSchema,
  sanitizeSkillProficiencies,
  validatePowerSelection,
  type CharacterDetails,
  type InventoryItemData,
  type PowerPrerequisiteCheck,
} from './characterSheet';

export const syncMetaSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().min(1),
  deletedAt: z.string().nullable(),
});

export const characterSchema = syncMetaSchema.extend({
  name: z.string().trim().min(1, 'Name is required').max(80),
  levelTotal: z.number().int().min(1).max(20),
  creationState: z.enum(['draft', 'complete']),
  details: characterDataSchema.default(() => characterDataSchema.parse({})),
});
export type Character = z.infer<typeof characterSchema>;

export const newCharacterSchema = z.object({
  name: characterSchema.shape.name,
  levelTotal: z.number().int().min(1).max(20).optional(),
  creationState: z.enum(['draft', 'complete']).optional(),
  details: characterDataSchema.partial().optional(),
});
export type NewCharacter = z.input<typeof newCharacterSchema>;

export const campaignStatusSchema = z.enum(['planning', 'active', 'paused', 'completed']);
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

export const campaignSchema = syncMetaSchema.extend({
  name: z.string().trim().min(1, 'Name is required').max(80),
  description: z.string(),
  setting: z.string(),
  status: campaignStatusSchema,
});
export type Campaign = z.infer<typeof campaignSchema>;

export const newCampaignSchema = z.object({
  name: campaignSchema.shape.name,
  description: z.string().default(''),
  setting: z.string().default(''),
});
export type NewCampaign = z.input<typeof newCampaignSchema>;

export type { CharacterDetails as CharacterSheetDetails, InventoryItemData as CharacterInventoryItem };
