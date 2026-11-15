import {
  CLASS_STARTING_EQUIPMENT,
  BACKGROUND_STARTING_EQUIPMENT,
  getBackgroundStartingEquipment,
} from '../sw5e/sourcebooks';
import type { ClassKey } from '../sw5e/constants';
import {
  abilityModifier,
  calculateArmorClass,
  calculateMaxHp,
  calculatePowercasting,
  calculateSpeed,
  deriveCharacterStats,
  levelForXp,
  passiveScore,
  powerPointCost,
  proficiencyBonus,
  savingThrowModifier,
  skillModifier,
  xpForNextLevel,
  type AbilityScores,
} from './characterStats';
import {
  parseDiceNotation,
  resolveAdvantage,
  rollDamage,
  rollNotation,
  type Rng,
} from './dice';

const BASE_SCORES: AbilityScores = {
  str: 10,
  dex: 14,
  con: 14,
  int: 16,
  wis: 15,
  cha: 12,
};

function sequenceRng(values: number[]): Rng {
  let idx = 0;
  return {
    rollDie(): number {
      const val = values[idx % values.length]!;
      idx++;
      return val;
    },
  };
}

describe('SW5e calculation engine (verified against PHB)', () => {
  it('computes ability modifiers across PHB table (PHB p. 209)', () => {
    expect(abilityModifier(1)).toBe(-5);
    expect(abilityModifier(8)).toBe(-1);
    expect(abilityModifier(9)).toBe(-1);
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(11)).toBe(0);
    expect(abilityModifier(15)).toBe(2);
    expect(abilityModifier(18)).toBe(4);
    expect(abilityModifier(20)).toBe(5);
    expect(abilityModifier(30)).toBe(10);
  });

  it('computes proficiency bonus by level 1-20 (PHB p. 15)', () => {
    expect(proficiencyBonus(1)).toBe(2);
    expect(proficiencyBonus(4)).toBe(2);
    expect(proficiencyBonus(5)).toBe(3);
    expect(proficiencyBonus(8)).toBe(3);
    expect(proficiencyBonus(9)).toBe(4);
    expect(proficiencyBonus(13)).toBe(5);
    expect(proficiencyBonus(17)).toBe(6);
    expect(proficiencyBonus(20)).toBe(6);
  });

  it('maps XP thresholds to levels and next-level XP (PHB p. 15)', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(299)).toBe(1);
    expect(levelForXp(300)).toBe(2);
    expect(levelForXp(6500)).toBe(5);
    expect(levelForXp(355000)).toBe(20);
    expect(xpForNextLevel(1)).toBe(300);
    expect(xpForNextLevel(20)).toBeNull();
  });

  it('computes SW5e skill modifiers and passive Perception (PHB pp. 210-214)', () => {
    // PHB p. 211 example: 1st-level character with WIS 15 (+2) and proficiency (+2) in Perception -> passive 14
    const percMod = skillModifier(BASE_SCORES, 1, 'perception', 'proficient');
    expect(percMod).toBe(4);
    expect(passiveScore(percMod)).toBe(14);
    expect(passiveScore(percMod, 'advantage')).toBe(19);
    expect(passiveScore(percMod, 'disadvantage')).toBe(9);

    // Expertise doubles proficiency bonus (Ace Pilot feat on Piloting: INT 16 -> +3, L5 PB +3 * 2 = +6 -> +9)
    expect(skillModifier(BASE_SCORES, 5, 'piloting', 'expertise')).toBe(9);
  });

  it('computes saving throws (PHB p. 210)', () => {
    expect(savingThrowModifier(BASE_SCORES, 1, 'int', true)).toBe(5);
    expect(savingThrowModifier(BASE_SCORES, 1, 'str', false)).toBe(0);
  });

  it('computes Armor Class for light, medium, heavy, unarmored, and shields (PHB pp. 172-174)', () => {
    const highDex: AbilityScores = { ...BASE_SCORES, dex: 18, con: 16, wis: 16 }; // DEX +4, CON +3, WIS +3
    // Unarmored: 10 + 4 = 14
    expect(calculateArmorClass({ scores: highDex })).toBe(14);
    // Berserker Unarmored Defense: 10 + DEX(4) + CON(3) = 17
    expect(calculateArmorClass({ scores: highDex, unarmoredDefense: 'berserker' })).toBe(17);
    // Light Combat Suit (11 + DEX): 11 + 4 = 15
    expect(
      calculateArmorClass({
        scores: highDex,
        armor: { category: 'light', baseAc: 11 },
      }),
    ).toBe(15);
    // Medium Mesh Armor (13 + max 2 DEX) + Medium Shield (+2): 13 + 2 + 2 = 17
    expect(
      calculateArmorClass({
        scores: highDex,
        armor: { category: 'medium', baseAc: 13 },
        shield: { acBonus: 2 },
      }),
    ).toBe(17);
    // Heavy Battle Armor (16, ignores negative DEX per PHB p. 173!)
    const lowDex: AbilityScores = { ...BASE_SCORES, dex: 6 }; // DEX -2
    expect(
      calculateArmorClass({
        scores: lowDex,
        armor: { category: 'heavy', baseAc: 16 },
      }),
    ).toBe(16);
  });

  it('computes single-class and multiclass Hit Points (PHB p. 15, p. 191)', () => {
    // Fighter 4 / Operative 1 with CON 14 (+2):
    // L1 Fighter: 10 + 2 = 12; L2-4 Fighter: 3 * (6 + 2) = 24; L1 Operative (as 5th char lvl): 5 + 2 = 7 -> 43
    const hp = calculateMaxHp({
      classLevels: [
        { classKey: 'fighter', level: 4 },
        { classKey: 'operative', level: 1 },
      ],
      conScore: 14,
    });
    expect(hp).toBe(43);
  });

  it('computes Force and Tech points, DCs, and multiclass Max Power Level (PHB Ch. 3, Ch. 6 p. 192, Ch. 10 p. 233)', () => {
    // 3rd-level Consular with WIS 16 (+3), CHA 12 (+1):
    // Force points = 3 * 4 + 3 = 15, Max Power Level = 2nd, Light DC = 8 + 2 + 3 = 13, Dark DC = 8 + 2 + 1 = 11
    const consular = calculatePowercasting(
      [{ classKey: 'consular', level: 3 }],
      { ...BASE_SCORES, wis: 16, cha: 12 },
    );
    expect(consular.force.hasForcecasting).toBe(true);
    expect(consular.force.maxPoints).toBe(15);
    expect(consular.force.maxPowerLevel).toBe(2);
    expect(consular.force.lightSaveDc).toBe(13);
    expect(consular.force.darkSaveDc).toBe(11);
    expect(consular.force.universalSaveDc).toBe(13);

    // Multiclass Force caster: Consular 3 (3*4=12) + Guardian 2 (2*2=4) with WIS 16 (+3)
    // Points = 12 + 4 + 3 (casting modifier added ONCE per PHB p. 192) = 19
    const multiForce = calculatePowercasting(
      [
        { classKey: 'consular', level: 3 },
        { classKey: 'guardian', level: 2 },
      ],
      { ...BASE_SCORES, wis: 16, cha: 12 },
    );
    expect(multiForce.force.maxPoints).toBe(19);

    // PHB p. 192 example: 4 levels in Marauder Approach berserker (potentialMax 4 -> 4*(4/9)=1.77)
    // + 3 levels in guardian (potentialMax 5 -> 3*(5/9)=1.66) => floor(3.44) = 3rd-level caster -> Max Power Level 2
    const phbExample = calculatePowercasting(
      [
        {
          classKey: 'berserker',
          level: 4,
          archetypeCaster: { kind: 'force', pointsPerLevel: 1, potentialMaxPowerLevel: 4 },
        },
        { classKey: 'guardian', level: 3 },
      ],
      BASE_SCORES,
    );
    expect(phbExample.force.maxPowerLevel).toBe(2);

    // Power point cost table (PHB p. 233): At-will = 0, 1st = 2, 2nd = 3, 9th = 10
    expect(powerPointCost(0)).toBe(0);
    expect(powerPointCost(1)).toBe(2);
    expect(powerPointCost(2)).toBe(3);
    expect(powerPointCost(9)).toBe(10);
  });

  it('computes SW5e Slowed levels (1-4) and armor strength speed penalties (PHB p. 172, p. 306)', () => {
    expect(calculateSpeed({ baseSpeed: 30, slowedLevel: 0 })).toBe(30);
    expect(calculateSpeed({ baseSpeed: 30, slowedLevel: 1 })).toBe(15);
    expect(calculateSpeed({ baseSpeed: 30, slowedLevel: 2 })).toBe(5);
    expect(calculateSpeed({ baseSpeed: 30, slowedLevel: 3 })).toBe(0);
    expect(calculateSpeed({ baseSpeed: 30, slowedLevel: 4, bonusSpeed: 20 })).toBe(0);
    expect(calculateSpeed({ baseSpeed: 30, unmetArmorStrength: true })).toBe(20);
  });

  it('derives a complete character stat sheet deterministically', () => {
    const derived = deriveCharacterStats({
      scores: BASE_SCORES,
      classLevels: [{ classKey: 'engineer', level: 3 }],
      savingThrowProficiencies: ['con', 'int'],
      skillProficiencies: { technology: 'proficient', piloting: 'expertise' },
      armor: { category: 'light', baseAc: 12 },
      shield: { acBonus: 1 },
    });
    expect(derived.totalLevel).toBe(3);
    expect(derived.proficiencyBonus).toBe(2);
    expect(derived.armorClass).toBe(15); // 12 + DEX(2) + Shield(1)
    expect(derived.maxHp).toBe(24); // L1: 8+2=10; L2-3: 2*(5+2)=14 -> 24
    expect(derived.powercasting.tech.maxPoints).toBe(9); // 3*2 + INT(3)
    expect(derived.powercasting.tech.saveDc).toBe(13); // 8 + 2 + 3
  });
});

describe('Dice parser and roller', () => {
  it('parses standard dice notations', () => {
    expect(parseDiceNotation('2d6+3')).toEqual({ count: 2, sides: 6, modifier: 3 });
    expect(parseDiceNotation('d20 - 1')).toEqual({ count: 1, sides: 20, modifier: -1 });
  });

  it('cancels advantage and disadvantage when both apply (PHB p. 209)', () => {
    expect(resolveAdvantage(2, 1)).toBe('normal');
    expect(resolveAdvantage(1, 0)).toBe('advantage');
    expect(resolveAdvantage(0, 2)).toBe('disadvantage');
  });

  it('rolls with advantage, disadvantage, and critical damage deterministically', () => {
    const rng = sequenceRng([5, 17]);
    const adv = rollNotation('1d20+4', 'advantage', rng);
    expect(adv.keptRolls).toEqual([17]);
    expect(adv.total).toBe(21);

    const dis = rollNotation('1d20+4', 'disadvantage', sequenceRng([5, 17]));
    expect(dis.keptRolls).toEqual([5]);
    expect(dis.total).toBe(9);

    const crit = rollDamage('2d6+3', { critical: true, extraCritDice: 1 }, sequenceRng([4]));
    expect(crit.rolls).toHaveLength(5); // 2*2 + 1 brutal critical die
    expect(crit.total).toBe(23);
  });
});

describe('SW5e starting equipment & wealth rules (PHB Chapter 3 & 4)', () => {
  const all10Classes: ClassKey[] = [
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
  ];

  it('defines valid starting equipment packages for all 10 SW5e classes', () => {
    for (const classKey of all10Classes) {
      const pkg = CLASS_STARTING_EQUIPMENT[classKey];
      expect(pkg).toBeDefined();
      expect(pkg.packageAItems.length).toBeGreaterThan(0);
      expect(pkg.packageALabel).toContain('(A)');
      expect(pkg.packageACredits).toBe(0);
      expect(pkg.packageBCredits).toBeGreaterThanOrEqual(1000);
      expect(pkg.packageBCredits).toBeLessThanOrEqual(2000);
    }
  });

  it('defines authentic starting equipment packages for all 20 SW5e backgrounds', () => {
    const backgroundKeys = Object.keys(BACKGROUND_STARTING_EQUIPMENT);
    expect(backgroundKeys).toHaveLength(20);

    for (const key of backgroundKeys) {
      const bg = BACKGROUND_STARTING_EQUIPMENT[key]!;
      expect(bg.name).toBeTruthy();
      expect(bg.label).toBeTruthy();
      expect(bg.items.length).toBeGreaterThan(0);
      expect(bg.credits).toBeGreaterThanOrEqual(50);
      expect(bg.credits).toBeLessThanOrEqual(250);
    }
  });

  it('resolves background starting equipment by clean slug, namespaced ID, or unknown fallback', () => {
    const jediFromSlug = getBackgroundStartingEquipment('jedi');
    const jediFromId = getBackgroundStartingEquipment('sw5e:core:background:jedi');
    expect(jediFromSlug.name).toBe('Jedi');
    expect(jediFromId.name).toBe('Jedi');
    expect(jediFromId.credits).toBe(150);

    const mandalorian = getBackgroundStartingEquipment('sw5e:core:background:mandalorian');
    expect(mandalorian.name).toBe('Mandalorian');
    expect(mandalorian.credits).toBe(200);

    const fallback = getBackgroundStartingEquipment('sw5e:core:background:custom-unknown');
    expect(fallback.name).toBe('Custom');
    expect(fallback.credits).toBe(100);
  });
});
