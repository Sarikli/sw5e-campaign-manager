/**
 * Verified SW5e constants and lookup tables.
 * Every constant carries a source reference to the SW5e Player's Handbook (PHB).
 * Domain layer: pure TypeScript, zero platform dependencies.
 */

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export type AbilityKey = (typeof ABILITIES)[number];

export const ABILITY_NAMES: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

/**
 * Verified SW5e skill list and governing abilities (PHB Chapter 7, p. 211).
 * Note: SW5e replaces D&D's Arcana/History/Religion with Lore, Piloting, and Technology.
 */
export const SKILLS = {
  athletics: { name: 'Athletics', ability: 'str' },
  acrobatics: { name: 'Acrobatics', ability: 'dex' },
  sleight_of_hand: { name: 'Sleight of Hand', ability: 'dex' },
  stealth: { name: 'Stealth', ability: 'dex' },
  investigation: { name: 'Investigation', ability: 'int' },
  lore: { name: 'Lore', ability: 'int' },
  nature: { name: 'Nature', ability: 'int' },
  piloting: { name: 'Piloting', ability: 'int' },
  technology: { name: 'Technology', ability: 'int' },
  animal_handling: { name: 'Animal Handling', ability: 'wis' },
  insight: { name: 'Insight', ability: 'wis' },
  medicine: { name: 'Medicine', ability: 'wis' },
  perception: { name: 'Perception', ability: 'wis' },
  survival: { name: 'Survival', ability: 'wis' },
  deception: { name: 'Deception', ability: 'cha' },
  intimidation: { name: 'Intimidation', ability: 'cha' },
  performance: { name: 'Performance', ability: 'cha' },
  persuasion: { name: 'Persuasion', ability: 'cha' },
} as const satisfies Record<string, { name: string; ability: AbilityKey }>;

export type SkillKey = keyof typeof SKILLS;
export const SKILL_KEYS = Object.keys(SKILLS) as SkillKey[];

export type ProficiencyLevel = 'none' | 'half' | 'proficient' | 'expertise';

/**
 * Character Advancement table: XP thresholds and proficiency bonus by level 1-20
 * (PHB Chapter 1, p. 15).
 */
export const XP_THRESHOLDS: readonly number[] = [
  0,      // Level 1
  300,    // Level 2
  900,    // Level 3
  2700,   // Level 4
  6500,   // Level 5
  14000,  // Level 6
  23000,  // Level 7
  34000,  // Level 8
  48000,  // Level 9
  64000,  // Level 10
  85000,  // Level 11
  100000, // Level 12
  120000, // Level 13
  140000, // Level 14
  165000, // Level 15
  195000, // Level 16
  225000, // Level 17
  265000, // Level 18
  305000, // Level 19
  355000, // Level 20
];

/**
 * Power Level Point Cost table (PHB Chapter 10, p. 233).
 * At-will (level 0) costs 0 points; levels 1-9 cost (powerLevel + 1) points.
 */
export const POWER_POINT_COST: Record<number, number> = {
  0: 0,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 8,
  8: 9,
  9: 10,
};

/**
 * Multiclass Max Power Level table by combined effective caster level 1-20
 * (PHB Chapter 6, p. 192).
 */
export const MULTICLASS_MAX_POWER_LEVEL: readonly number[] = [
  0, // 0
  1, 1, // 1-2
  2, 2, // 3-4
  3, 3, // 5-6
  4, 4, // 7-8
  5, 5, // 9-10
  6, 6, // 11-12
  7, 7, // 13-14
  8, 8, // 15-16
  9, 9, 9, 9, // 17-20
];

export type ClassKey =
  | 'berserker'
  | 'consular'
  | 'engineer'
  | 'fighter'
  | 'guardian'
  | 'monk'
  | 'operative'
  | 'scholar'
  | 'scout'
  | 'sentinel';

export interface ClassMechanicsSpec {
  key: ClassKey;
  name: string;
  hitDie: 6 | 8 | 10 | 12;
  fixedHpPerLevel: number;
  savingThrows: readonly [AbilityKey, AbilityKey];
  casterKind: 'none' | 'force' | 'tech';
  /** Points per class level before adding the casting modifier once (PHB Chapter 3). */
  pointsPerLevel: number;
  /** Potential max power level at level 20 for this class (9, 7, 5, or 0). */
  potentialMaxPowerLevel: 0 | 4 | 5 | 7 | 9;
  /** Minimum class level required before casting begins (Scout starts at 2). */
  castingStartLevel: number;
  armorProficiencies: readonly string[];
  weaponProficiencies: readonly string[];
  skillChoices: readonly SkillKey[];
  skillChoiceCount: number;
}

/**
 * Verified SW5e 10 core classes mechanical table (PHB Chapter 3, p. 49 & class tables).
 */
export const CLASS_SPECS: Record<ClassKey, ClassMechanicsSpec> = {
  berserker: {
    key: 'berserker',
    name: 'Berserker',
    hitDie: 12,
    fixedHpPerLevel: 7,
    savingThrows: ['str', 'con'],
    casterKind: 'none',
    pointsPerLevel: 0,
    potentialMaxPowerLevel: 0,
    castingStartLevel: 99,
    armorProficiencies: ['Light Armor', 'Medium Armor', 'Light Shields', 'Medium Shields'],
    weaponProficiencies: ['Simple Vibroweapons', 'Martial Vibroweapons', 'Simple Blasters'],
    skillChoices: ['animal_handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
    skillChoiceCount: 2,
  },
  consular: {
    key: 'consular',
    name: 'Consular',
    hitDie: 6,
    fixedHpPerLevel: 4,
    savingThrows: ['wis', 'cha'],
    casterKind: 'force',
    pointsPerLevel: 4,
    potentialMaxPowerLevel: 9,
    castingStartLevel: 1,
    armorProficiencies: [],
    weaponProficiencies: ['Simple Lightweapons', 'Simple Vibroweapons'],
    skillChoices: ['deception', 'insight', 'intimidation', 'investigation', 'lore', 'medicine', 'persuasion'],
    skillChoiceCount: 2,
  },
  engineer: {
    key: 'engineer',
    name: 'Engineer',
    hitDie: 8,
    fixedHpPerLevel: 5,
    savingThrows: ['con', 'int'],
    casterKind: 'tech',
    pointsPerLevel: 2,
    potentialMaxPowerLevel: 9,
    castingStartLevel: 1,
    armorProficiencies: ['Light Armor', 'Medium Armor', 'Light Shields'],
    weaponProficiencies: ['Simple Blasters', 'Simple Vibroweapons'],
    skillChoices: ['investigation', 'lore', 'medicine', 'nature', 'piloting', 'technology'],
    skillChoiceCount: 3,
  },
  fighter: {
    key: 'fighter',
    name: 'Fighter',
    hitDie: 10,
    fixedHpPerLevel: 6,
    savingThrows: ['str', 'con'],
    casterKind: 'none',
    pointsPerLevel: 0,
    potentialMaxPowerLevel: 0,
    castingStartLevel: 99,
    armorProficiencies: ['All Armor (Light, Medium, Heavy)', 'All Shields (Light, Medium, Heavy)'],
    weaponProficiencies: ['All Vibroweapons', 'All Blasters', 'All Lightweapons'],
    skillChoices: ['acrobatics', 'animal_handling', 'athletics', 'insight', 'intimidation', 'perception', 'survival'],
    skillChoiceCount: 2,
  },
  guardian: {
    key: 'guardian',
    name: 'Guardian',
    hitDie: 10,
    fixedHpPerLevel: 6,
    savingThrows: ['con', 'cha'],
    casterKind: 'force',
    pointsPerLevel: 2,
    potentialMaxPowerLevel: 5,
    castingStartLevel: 1,
    armorProficiencies: ['Light Armor', 'Medium Armor', 'Light Shields', 'Medium Shields'],
    weaponProficiencies: ['All Lightweapons', 'All Vibroweapons'],
    skillChoices: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'lore', 'perception', 'persuasion', 'piloting'],
    skillChoiceCount: 2,
  },
  monk: {
    key: 'monk',
    name: 'Monk',
    hitDie: 8,
    fixedHpPerLevel: 5,
    savingThrows: ['str', 'dex'],
    casterKind: 'none',
    pointsPerLevel: 0,
    potentialMaxPowerLevel: 0,
    castingStartLevel: 99,
    armorProficiencies: [],
    weaponProficiencies: ['Simple Vibroweapons', 'Simple Lightweapons'],
    skillChoices: ['acrobatics', 'athletics', 'insight', 'lore', 'perception', 'stealth'],
    skillChoiceCount: 2,
  },
  operative: {
    key: 'operative',
    name: 'Operative',
    hitDie: 8,
    fixedHpPerLevel: 5,
    savingThrows: ['dex', 'int'],
    casterKind: 'none',
    pointsPerLevel: 0,
    potentialMaxPowerLevel: 0,
    castingStartLevel: 99,
    armorProficiencies: ['Light Armor'],
    weaponProficiencies: ['Simple Blasters', 'Simple Vibroweapons', 'Vibrorapier', 'Vibrostiletto'],
    skillChoices: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight_of_hand', 'stealth', 'technology'],
    skillChoiceCount: 4,
  },
  scholar: {
    key: 'scholar',
    name: 'Scholar',
    hitDie: 8,
    fixedHpPerLevel: 5,
    savingThrows: ['int', 'wis'],
    casterKind: 'none',
    pointsPerLevel: 0,
    potentialMaxPowerLevel: 0,
    castingStartLevel: 99,
    armorProficiencies: ['Light Armor'],
    weaponProficiencies: ['Simple Blasters', 'Simple Vibroweapons'],
    skillChoices: ['animal_handling', 'deception', 'insight', 'investigation', 'lore', 'medicine', 'nature', 'perception', 'persuasion', 'technology'],
    skillChoiceCount: 3,
  },
  scout: {
    key: 'scout',
    name: 'Scout',
    hitDie: 10,
    fixedHpPerLevel: 6,
    savingThrows: ['str', 'dex'],
    casterKind: 'tech',
    pointsPerLevel: 1,
    potentialMaxPowerLevel: 5,
    castingStartLevel: 2,
    armorProficiencies: ['Light Armor', 'Medium Armor', 'Light Shields', 'Medium Shields'],
    weaponProficiencies: ['All Blasters', 'All Vibroweapons'],
    skillChoices: ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'piloting', 'stealth', 'survival'],
    skillChoiceCount: 3,
  },
  sentinel: {
    key: 'sentinel',
    name: 'Sentinel',
    hitDie: 8,
    fixedHpPerLevel: 5,
    savingThrows: ['dex', 'cha'],
    casterKind: 'force',
    pointsPerLevel: 3,
    potentialMaxPowerLevel: 7,
    castingStartLevel: 1,
    armorProficiencies: ['Light Armor'],
    weaponProficiencies: ['Simple Vibroweapons', 'Simple Lightweapons', 'Chakram', 'Doubleblade', 'Doublesaber', 'Doubleshoto', 'Doublesword', 'Hidden Blade', 'Lightfoil', 'Light Ring', 'Saberwhip', 'Vibrorapier', 'Vibrowhip'],
    skillChoices: ['acrobatics', 'animal_handling', 'insight', 'intimidation', 'perception', 'persuasion', 'piloting', 'stealth', 'technology'],
    skillChoiceCount: 3,
  },
};

/**
 * Verified SW5e conditions (PHB Appendix A, pp. 305-306).
 * Includes SW5e-specific Shocked and Slowed (levels 1-4).
 */
export const CONDITIONS = [
  'blinded',
  'charmed',
  'deafened',
  'diseased',
  'exhaustion',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'shocked',
  'slowed',
  'stunned',
  'unconscious',
] as const;

export type ConditionKey = (typeof CONDITIONS)[number];
