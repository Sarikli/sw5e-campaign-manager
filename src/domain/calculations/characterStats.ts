/**
 * Pure SW5e calculation engine.
 * Every function cites its verified SW5e Player's Handbook (PHB) rule reference.
 */
import {
  ABILITIES,
  CLASS_SPECS,
  MULTICLASS_MAX_POWER_LEVEL,
  POWER_POINT_COST,
  SKILL_KEYS,
  SKILLS,
  XP_THRESHOLDS,
  type AbilityKey,
  type ClassKey,
  type ProficiencyLevel,
  type SkillKey,
} from '../sw5e/constants';
import type { AdvantageMode } from './dice';

export type AbilityScores = Record<AbilityKey, number>;

/**
 * Ability score modifier: floor((score - 10) / 2).
 * Rule ref: PHB Chapter 7, p. 209 ("subtract 10 from the ability score and then divide by 2, round down").
 */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function computeMaxHp(classKey: ClassKey, level: number, conMod: number): number {
  const spec = CLASS_SPECS[classKey] ?? CLASS_SPECS.guardian;
  const clamped = Math.max(1, Math.min(20, level));
  let hp = Math.max(1, spec.hitDie + conMod);
  for (let i = 2; i <= clamped; i++) {
    hp += Math.max(1, spec.fixedHpPerLevel + conMod);
  }
  return hp;
}

/**
 * Proficiency bonus by total character level (1-20): +2 at L1..4, +3 at L5..8, +4 at L9..12, +5 at L13..16, +6 at L17..20.
 * Rule ref: PHB Chapter 1, p. 15 (Character Advancement table) & Chapter 6, p. 191 (Multiclassing).
 */
export function proficiencyBonus(totalLevel: number): number {
  const clamped = Math.max(1, Math.min(20, Math.floor(totalLevel)));
  return Math.floor((clamped - 1) / 4) + 2;
}

/**
 * Determines character level (1-20) from total XP.
 * Rule ref: PHB Chapter 1, p. 15.
 */
export function levelForXp(xp: number): number {
  let lvl = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]!) {
      lvl = i + 1;
    } else {
      break;
    }
  }
  return lvl;
}

/** Returns XP required for the next level, or null at level 20. */
export function xpForNextLevel(currentLevel: number): number | null {
  if (currentLevel >= 20) return null;
  const idx = Math.max(1, Math.floor(currentLevel));
  return XP_THRESHOLDS[idx] ?? null;
}

/**
 * Skill check modifier.
 * Rule ref: PHB Chapter 7, pp. 210-211 (Proficiency Bonus, Expertise, Skills).
 */
export function skillModifier(
  scores: AbilityScores,
  totalLevel: number,
  skill: SkillKey,
  proficiency: ProficiencyLevel = 'none',
  miscBonus = 0,
): number {
  const ability = SKILLS[skill].ability;
  const mod = abilityModifier(scores[ability]);
  const pb = proficiencyBonus(totalLevel);
  const profPart =
    proficiency === 'expertise'
      ? pb * 2
      : proficiency === 'proficient'
        ? pb
        : proficiency === 'half'
          ? Math.floor(pb / 2)
          : 0;
  return mod + profPart + miscBonus;
}

/**
 * Passive check score: 10 + modifier (+5 with advantage, -5 with disadvantage).
 * Rule ref: PHB Chapter 7, p. 211 (Passive Checks).
 */
export function passiveScore(modifier: number, mode: AdvantageMode = 'normal'): number {
  const shift = mode === 'advantage' ? 5 : mode === 'disadvantage' ? -5 : 0;
  return 10 + modifier + shift;
}

/**
 * Saving throw modifier.
 * Rule ref: PHB Chapter 7, p. 210.
 */
export function savingThrowModifier(
  scores: AbilityScores,
  totalLevel: number,
  ability: AbilityKey,
  proficient: boolean,
  miscBonus = 0,
): number {
  return (
    abilityModifier(scores[ability]) +
    (proficient ? proficiencyBonus(totalLevel) : 0) +
    miscBonus
  );
}

export interface EquippedArmorSpec {
  category: 'light' | 'medium' | 'heavy';
  baseAc: number;
  enhancementBonus?: number;
  strengthRequirement?: number;
}

export interface EquippedShieldSpec {
  acBonus: number;
  enhancementBonus?: number;
  strengthRequirement?: number;
}

export type UnarmoredDefenseMode = 'none' | 'berserker' | 'monk';

/**
 * Armor Class calculation.
 * Rule ref: PHB Chapter 5, pp. 172-174:
 * - Light armor: baseAc + DEX mod
 * - Medium armor: baseAc + min(DEX mod, 2)
 * - Heavy armor: baseAc (does not add DEX mod and does not penalize negative DEX mod!)
 * - Unarmored: 10 + DEX mod (or Berserker 10 + DEX + CON, Monk 10 + DEX + max(WIS, CHA))
 * - Shield: +acBonus (only one shield at a time)
 */
export function calculateArmorClass(params: {
  scores: AbilityScores;
  armor?: EquippedArmorSpec | null;
  shield?: EquippedShieldSpec | null;
  unarmoredDefense?: UnarmoredDefenseMode;
  flatBonus?: number;
}): number {
  const { scores, armor, shield, unarmoredDefense = 'none', flatBonus = 0 } = params;
  const dexMod = abilityModifier(scores.dex);

  let ac: number;
  if (armor) {
    const armorEnh = armor.enhancementBonus ?? 0;
    if (armor.category === 'light') {
      ac = armor.baseAc + dexMod + armorEnh;
    } else if (armor.category === 'medium') {
      ac = armor.baseAc + Math.min(dexMod, 2) + armorEnh;
    } else {
      // Heavy armor: PHB p. 173 "Heavy armor doesn't let you add your Dexterity modifier
      // to your Armor Class, but it also doesn't penalize you if your Dexterity modifier is negative."
      ac = armor.baseAc + armorEnh;
    }
  } else if (unarmoredDefense === 'berserker') {
    ac = 10 + dexMod + abilityModifier(scores.con);
  } else if (unarmoredDefense === 'monk') {
    const mentalMod = Math.max(abilityModifier(scores.wis), abilityModifier(scores.cha));
    ac = 10 + dexMod + mentalMod;
  } else {
    ac = 10 + dexMod;
  }

  if (shield) {
    ac += shield.acBonus + (shield.enhancementBonus ?? 0);
  }

  return ac + flatBonus;
}

export interface ClassLevelEntry {
  classKey: ClassKey;
  level: number;
  /** Optional subclass caster progression override (e.g., Marauder Berserker, Tactical Specialist Fighter). */
  archetypeCaster?: {
    kind: 'force' | 'tech';
    pointsPerLevel: number; // e.g. 0.5 for 1/3 tech caster, 1 for 1/3 force caster
    potentialMaxPowerLevel: 4;
  };
}

/**
 * Maximum Hit Points calculation across single or multiple classes.
 * Rule ref: PHB Chapter 1, p. 15 & Chapter 6, p. 191 (1st character level gets max Hit Die;
 * subsequent levels use fixed average or rolled values + CON mod per level, minimum 1 HP gained per level).
 */
export function calculateMaxHp(params: {
  classLevels: readonly ClassLevelEntry[];
  conScore: number;
  bonusPerLevel?: number;
  flatBonus?: number;
}): number {
  const { classLevels, conScore, bonusPerLevel = 0, flatBonus = 0 } = params;
  if (classLevels.length === 0) return 0;

  const conMod = abilityModifier(conScore);
  let totalHp = 0;
  let isFirstCharacterLevel = true;

  for (const entry of classLevels) {
    const spec = CLASS_SPECS[entry.classKey];
    for (let i = 1; i <= entry.level; i++) {
      if (isFirstCharacterLevel) {
        totalHp += Math.max(1, spec.hitDie + conMod + bonusPerLevel);
        isFirstCharacterLevel = false;
      } else {
        totalHp += Math.max(1, spec.fixedHpPerLevel + conMod + bonusPerLevel);
      }
    }
  }

  return totalHp + flatBonus;
}

export interface PowercastingStats {
  force: {
    hasForcecasting: boolean;
    maxPoints: number;
    maxPowerLevel: number;
    lightSaveDc: number;
    lightAttackBonus: number;
    darkSaveDc: number;
    darkAttackBonus: number;
    universalSaveDc: number;
    universalAttackBonus: number;
  };
  tech: {
    hasTechcasting: boolean;
    maxPoints: number;
    maxPowerLevel: number;
    saveDc: number;
    attackBonus: number;
  };
}

/**
 * Computes Force and Tech power pools, max power levels, DCs, and attack modifiers.
 * Rule refs:
 * - PHB Chapter 10, pp. 233-235 (Power Level Point Cost, Power Alignments, Save DCs)
 * - PHB Chapter 6, p. 192 (Multiclassing Force and Tech Points: sum class points, add casting mod ONCE;
 *   Max Power Level formula: floor(sum((classPotentialMax / 9) * classLevel))).
 */
export function calculatePowercasting(
  classLevels: readonly ClassLevelEntry[],
  scores: AbilityScores,
): PowercastingStats {
  const totalLevel = classLevels.reduce((sum, c) => sum + c.level, 0) || 1;
  const pb = proficiencyBonus(totalLevel);

  const wisMod = abilityModifier(scores.wis);
  const chaMod = abilityModifier(scores.cha);
  const forceBestMod = Math.max(wisMod, chaMod);
  const intMod = abilityModifier(scores.int);

  let forceBasePoints = 0;
  let forceCasterClasses = 0;
  let forceWeightedSum = 0;
  let singleForcePotential: number | null = null;
  let singleForceLevel = 0;

  let techBasePoints = 0;
  let techCasterClasses = 0;
  let techWeightedSum = 0;
  let singleTechPotential: number | null = null;
  let singleTechLevel = 0;

  for (const entry of classLevels) {
    if (entry.level <= 0) continue;
    const spec = CLASS_SPECS[entry.classKey];
    const kind = entry.archetypeCaster?.kind ?? spec.casterKind;
    const pointsRate = entry.archetypeCaster?.pointsPerLevel ?? spec.pointsPerLevel;
    const potentialMax =
      entry.archetypeCaster?.potentialMaxPowerLevel ?? spec.potentialMaxPowerLevel;
    const minLevel = entry.archetypeCaster ? 3 : spec.castingStartLevel;

    if (kind === 'force' && entry.level >= minLevel) {
      forceCasterClasses++;
      forceBasePoints += Math.ceil(entry.level * pointsRate);
      forceWeightedSum += (potentialMax / 9) * entry.level;
      singleForcePotential = potentialMax;
      singleForceLevel = entry.level;
    } else if (kind === 'tech' && entry.level >= minLevel) {
      techCasterClasses++;
      techBasePoints += Math.ceil(entry.level * pointsRate);
      techWeightedSum += (potentialMax / 9) * entry.level;
      singleTechPotential = potentialMax;
      singleTechLevel = entry.level;
    }
  }

  const hasForce = forceCasterClasses > 0;
  const hasTech = techCasterClasses > 0;

  const forceMaxLevel = !hasForce
    ? 0
    : forceCasterClasses === 1 && singleForcePotential !== null
      ? singleClassMaxPowerLevel(singleForceLevel, singleForcePotential)
      : (MULTICLASS_MAX_POWER_LEVEL[Math.min(20, Math.floor(forceWeightedSum))] ?? 0);

  const techMaxLevel = !hasTech
    ? 0
    : techCasterClasses === 1 && singleTechPotential !== null
      ? singleClassMaxPowerLevel(singleTechLevel, singleTechPotential)
      : (MULTICLASS_MAX_POWER_LEVEL[Math.min(20, Math.floor(techWeightedSum))] ?? 0);

  return {
    force: {
      hasForcecasting: hasForce,
      maxPoints: hasForce ? Math.max(0, forceBasePoints + forceBestMod) : 0,
      maxPowerLevel: forceMaxLevel,
      lightSaveDc: 8 + pb + wisMod,
      lightAttackBonus: pb + wisMod,
      darkSaveDc: 8 + pb + chaMod,
      darkAttackBonus: pb + chaMod,
      universalSaveDc: 8 + pb + forceBestMod,
      universalAttackBonus: pb + forceBestMod,
    },
    tech: {
      hasTechcasting: hasTech,
      maxPoints: hasTech ? Math.max(0, techBasePoints + intMod) : 0,
      maxPowerLevel: techMaxLevel,
      saveDc: 8 + pb + intMod,
      attackBonus: pb + intMod,
    },
  };
}

function singleClassMaxPowerLevel(level: number, potentialMax: number): number {
  const clamped = Math.max(1, Math.min(20, level));
  if (potentialMax === 9) {
    // Full caster (Consular, Engineer): 1-2→1, 3-4→2, ..., 17-20→9
    return MULTICLASS_MAX_POWER_LEVEL[clamped] ?? 1;
  }
  if (potentialMax === 7) {
    // 3/4 caster (Sentinel, PHB p. 139): 1-2→1, 3-5→2, 6-8→3, 9-10→4, 11-13→5, 14-16→6, 17-20→7
    if (clamped <= 2) return 1;
    if (clamped <= 5) return 2;
    if (clamped <= 8) return 3;
    if (clamped <= 10) return 4;
    if (clamped <= 13) return 5;
    if (clamped <= 16) return 6;
    return 7;
  }
  if (potentialMax === 5) {
    // 1/2 caster (Guardian, Scout, PHB p. 89 & p. 131): 1-4→1, 5-8→2, 9-12→3, 13-16→4, 17-20→5
    return Math.min(5, Math.floor((clamped - 1) / 4) + 1);
  }
  if (potentialMax === 4) {
    // 1/3 caster (Archetypes, PHB p. 53/75): 3-6→1, 7-12→2, 13-18→3, 19-20→4
    if (clamped < 3) return 0;
    if (clamped <= 6) return 1;
    if (clamped <= 12) return 2;
    if (clamped <= 18) return 3;
    return 4;
  }
  return 0;
}

/**
 * Returns the force/tech point cost to cast a power at a given level (0-9).
 * Rule ref: PHB Chapter 10, p. 233 (Power Level Point Cost table).
 */
export function powerPointCost(powerLevel: number): number {
  const cost = POWER_POINT_COST[powerLevel];
  if (cost === undefined) {
    throw new Error(`Invalid power level: ${powerLevel} (expected 0-9)`);
  }
  return cost;
}

/**
 * Calculates effective walking speed after SW5e Slowed levels (1-4) and armor/encumbrance penalties.
 * Rule ref: PHB Appendix A, p. 306 (Slowed: L1 -15ft, L2 -25ft, L3 -30ft, L4 speed becomes 0).
 */
export function calculateSpeed(params: {
  baseSpeed: number;
  slowedLevel?: number;
  unmetArmorStrength?: boolean;
  bonusSpeed?: number;
}): number {
  const { baseSpeed, slowedLevel = 0, unmetArmorStrength = false, bonusSpeed = 0 } = params;
  if (slowedLevel >= 4) return 0;
  const slowedPenalty =
    slowedLevel === 3 ? 30 : slowedLevel === 2 ? 25 : slowedLevel === 1 ? 15 : 0;
  const armorPenalty = unmetArmorStrength ? 10 : 0;
  return Math.max(0, baseSpeed + bonusSpeed - slowedPenalty - armorPenalty);
}

export interface DerivedCharacterStats {
  totalLevel: number;
  proficiencyBonus: number;
  abilityModifiers: Record<AbilityKey, number>;
  savingThrows: Record<AbilityKey, number>;
  skills: Record<SkillKey, number>;
  passivePerception: number;
  initiative: number;
  armorClass: number;
  maxHp: number;
  speed: number;
  carryingCapacity: number;
  powercasting: PowercastingStats;
}

export function deriveCharacterStats(input: {
  scores: AbilityScores;
  classLevels: readonly ClassLevelEntry[];
  savingThrowProficiencies: readonly AbilityKey[];
  skillProficiencies: Partial<Record<SkillKey, ProficiencyLevel>>;
  armor?: EquippedArmorSpec | null;
  shield?: EquippedShieldSpec | null;
  unarmoredDefense?: UnarmoredDefenseMode;
  baseSpeed?: number;
  slowedLevel?: number;
  hpMaxOverride?: number | null;
  initiativeBonus?: number;
  acBonus?: number;
}): DerivedCharacterStats {
  const totalLevel = Math.max(
    1,
    input.classLevels.reduce((acc, c) => acc + c.level, 0),
  );
  const pb = proficiencyBonus(totalLevel);

  const abilityModifiers = {} as Record<AbilityKey, number>;
  const savingThrows = {} as Record<AbilityKey, number>;
  for (const ab of ABILITIES) {
    abilityModifiers[ab] = abilityModifier(input.scores[ab]);
    savingThrows[ab] = savingThrowModifier(
      input.scores,
      totalLevel,
      ab,
      input.savingThrowProficiencies.includes(ab),
    );
  }

  const skills = {} as Record<SkillKey, number>;
  for (const sk of SKILL_KEYS) {
    skills[sk] = skillModifier(
      input.scores,
      totalLevel,
      sk,
      input.skillProficiencies[sk] ?? 'none',
    );
  }

  const unmetStr =
    (input.armor?.strengthRequirement !== undefined &&
      input.scores.str < input.armor.strengthRequirement) ||
    (input.shield?.strengthRequirement !== undefined &&
      input.scores.str < input.shield.strengthRequirement);

  return {
    totalLevel,
    proficiencyBonus: pb,
    abilityModifiers,
    savingThrows,
    skills,
    passivePerception: passiveScore(skills.perception),
    initiative: abilityModifiers.dex + (input.initiativeBonus ?? 0),
    armorClass: calculateArmorClass({
      scores: input.scores,
      armor: input.armor,
      shield: input.shield,
      unarmoredDefense: input.unarmoredDefense,
      flatBonus: input.acBonus,
    }),
    maxHp:
      input.hpMaxOverride ??
      calculateMaxHp({
        classLevels: input.classLevels,
        conScore: input.scores.con,
      }),
    speed: calculateSpeed({
      baseSpeed: input.baseSpeed ?? 30,
      slowedLevel: input.slowedLevel,
      unmetArmorStrength: unmetStr,
    }),
    carryingCapacity: input.scores.str * 15,
    powercasting: calculatePowercasting(input.classLevels, input.scores),
  };
}
