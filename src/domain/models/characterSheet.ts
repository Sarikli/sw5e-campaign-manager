import { z } from 'zod';
import {
  CLASS_SPECS,
  CONDITIONS,
  SKILL_KEYS,
  type AbilityKey,
  type ClassKey,
  type ConditionKey,
  type ProficiencyLevel,
  type SkillKey,
} from '../sw5e/constants';

export const abilityScoresSchema = z.object({
  str: z.number().int().min(1).max(30),
  dex: z.number().int().min(1).max(30),
  con: z.number().int().min(1).max(30),
  int: z.number().int().min(1).max(30),
  wis: z.number().int().min(1).max(30),
  cha: z.number().int().min(1).max(30),
});

export const inventoryItemSchema = z.object({
  id: z.string().min(1),
  contentId: z.string().nullable().default(null),
  name: z.string().trim().min(1),
  kind: z.enum(['weapon', 'armor', 'shield', 'equipment', 'consumable', 'enhanced_item']),
  quantity: z.number().int().min(1).default(1),
  equipped: z.boolean().default(false),
  weight: z.number().min(0).default(0),
  cost: z.number().min(0).default(0),
  // Mechanical properties for equipped calculation
  armorCategory: z.enum(['light', 'medium', 'heavy']).optional(),
  baseAc: z.number().int().optional(),
  shieldAcBonus: z.number().int().optional(),
  enhancementBonus: z.number().int().default(0),
  strengthRequirement: z.number().int().optional(),
  damageDice: z.string().optional(),
  damageType: z.string().optional(),
  finesse: z.boolean().optional(),
  ranged: z.boolean().optional(),
  properties: z.array(z.string()).default([]),
});
export type InventoryItemData = z.infer<typeof inventoryItemSchema>;

export const characterDataSchema = z.object({
  speciesId: z.string().default('sw5e:core:species:human'),
  speciesName: z.string().default('Human'),
  classKey: z
    .enum([
      'berserker',
      'consular',
      'engineer',
      'fighter',
      'guardian',
      'monk',
      'operative',
      'scholar',
      'scout',
      'sentinel',
    ])
    .default('guardian'),
  archetypeId: z.string().nullable().default(null),
  archetypeName: z.string().default(''),
  backgroundId: z.string().default('sw5e:core:background:jedi'),
  backgroundName: z.string().default('Jedi'),
  alignment: z.string().default('Light Side'),
  xp: z.number().int().min(0).default(0),
  scores: abilityScoresSchema.default({
    str: 15,
    dex: 13,
    con: 14,
    int: 10,
    wis: 12,
    cha: 8,
  }),
  skillProficiencies: z
    .record(z.string(), z.enum(['none', 'half', 'proficient', 'expertise']))
    .default({}),
  savingThrowProficiencies: z
    .array(z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']))
    .default(['con', 'cha']),
  hpCurrent: z.number().int().min(0).default(12),
  hpTemp: z.number().int().min(0).default(0),
  hpMaxOverride: z.number().int().min(1).nullable().default(null),
  hitDiceSpent: z.number().int().min(0).default(0),
  forcePointsSpent: z.number().int().min(0).default(0),
  techPointsSpent: z.number().int().min(0).default(0),
  credits: z.number().int().min(0).default(500),
  baseSpeed: z.number().int().min(0).default(30),
  slowedLevel: z.number().int().min(0).max(4).default(0),
  exhaustionLevel: z.number().int().min(0).max(6).default(0),
  activeConditions: z.array(z.enum(CONDITIONS)).default([]),
  knownPowerIds: z.array(z.string()).default([]),
  featIds: z.array(z.string()).default([]),
  inventory: z.array(inventoryItemSchema).default([]),
  notes: z.string().default(''),
  // Extended D&D Beyond-style Builder & Sheet fields
  abilityGenerationMethod: z
    .enum(['standard_array', 'point_buy', 'manual'])
    .default('standard_array'),
  backgroundAbilityBonuses: z.record(z.string(), z.number().int()).default({}),
  abilityOverrides: z.record(z.string(), z.number().int()).default({}),
  heroicInspiration: z.boolean().default(false),
  pinnedSkills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default(['Galactic Basic']),
  toolProficiencies: z.array(z.string()).default([]),
  armorProficiencies: z
    .array(z.string())
    .default(['Light Armor', 'Medium Armor', 'Light Shields', 'Medium Shields']),
  weaponProficiencies: z
    .array(z.string())
    .default(['Simple Vibroweapons', 'Martial Lightweapons', 'Simple Blasters']),
  resistances: z.array(z.string()).default([]),
  immunities: z.array(z.string()).default([]),
  vulnerabilities: z.array(z.string()).default([]),
  characteristics: z
    .object({
      gender: z.string().default(''),
      age: z.string().default(''),
      height: z.string().default(''),
      weight: z.string().default(''),
      eyes: z.string().default(''),
      hair: z.string().default(''),
      skin: z.string().default(''),
      faith: z.string().default(''),
      lifestyle: z.string().default('Modest'),
      personalityTraits: z.string().default(''),
      ideals: z.string().default(''),
      bonds: z.string().default(''),
      flaws: z.string().default(''),
    })
    .default({
      gender: '',
      age: '',
      height: '',
      weight: '',
      eyes: '',
      hair: '',
      skin: '',
      faith: '',
      lifestyle: 'Modest',
      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
    }),
  structuredNotes: z
    .object({
      organizations: z.string().default(''),
      allies: z.string().default(''),
      enemies: z.string().default(''),
      backstory: z.string().default(''),
      other: z.string().default(''),
    })
    .default({
      organizations: '',
      allies: '',
      enemies: '',
      backstory: '',
      other: '',
    }),
  extrasCreatureIds: z.array(z.string()).default([]),
  avatarUri: z.string().nullable().default(null),
  customBackground: z
    .object({
      name: z.string().default('Custom Background'),
      skills: z.array(z.string()).default([]),
      tools: z.array(z.string()).default([]),
      languages: z.array(z.string()).default([]),
      featureTitle: z.string().default(''),
      featureDescription: z.string().default(''),
    })
    .nullable()
    .default(null),
});

export type CharacterDetails = z.infer<typeof characterDataSchema>;

export interface PowerPrerequisiteCheck {
  valid: boolean;
  reason?: string;
}

/**
 * Validates SW5e power selection rules (PHB Ch. 10, pp. 233-234):
 * 1. Power level cannot exceed the character's Max Power Level for that casting type.
 * 2. If a power has a prerequisite power (e.g. Force Lightning requires Shock, Knight Speed requires Burst of Speed),
 *    the prerequisite must also be known or selected at the same time.
 */
export function validatePowerSelection(params: {
  powerSlug: string;
  powerKind: 'force' | 'tech';
  powerLevel: number;
  prerequisitePowerSlug?: string;
  maxForceLevel: number;
  maxTechLevel: number;
  knownPowerSlugs: readonly string[];
}): PowerPrerequisiteCheck {
  const maxAllowed =
    params.powerKind === 'force' ? params.maxForceLevel : params.maxTechLevel;
  if (maxAllowed === 0 && params.powerLevel > 0) {
    return {
      valid: false,
      reason: `Character does not have ${params.powerKind}casting levels required for level ${params.powerLevel} powers.`,
    };
  }
  if (params.powerLevel > maxAllowed) {
    return {
      valid: false,
      reason: `Power level (${params.powerLevel}) exceeds character's Max Power Level (${maxAllowed}).`,
    };
  }
  if (
    params.prerequisitePowerSlug &&
    !params.knownPowerSlugs.includes(params.prerequisitePowerSlug)
  ) {
    return {
      valid: false,
      reason: `Requires prerequisite power "${params.prerequisitePowerSlug}".`,
    };
  }
  return { valid: true };
}

/** Builds default starting saving throw proficiencies for a given SW5e class. */
export function defaultSavesForClass(classKey: ClassKey): AbilityKey[] {
  return [...CLASS_SPECS[classKey].savingThrows];
}

export function sanitizeSkillProficiencies(
  raw: Record<string, ProficiencyLevel>,
): Partial<Record<SkillKey, ProficiencyLevel>> {
  const out: Partial<Record<SkillKey, ProficiencyLevel>> = {};
  for (const k of SKILL_KEYS) {
    if (raw[k]) out[k] = raw[k];
  }
  return out;
}

export type { ConditionKey };
