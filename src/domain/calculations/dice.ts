/**
 * Deterministic dice parser and roller for tabletop actions.
 * Pure TypeScript, zero platform dependencies; randomness is injected via `Rng`.
 */

export interface Rng {
  /** Returns an integer in [1, sides] inclusive. */
  rollDie(sides: number): number;
}

/** Default RNG backed by Math.random (can be swapped for crypto or seeded RNG in tests). */
export const defaultRng: Rng = {
  rollDie(sides: number): number {
    if (!Number.isInteger(sides) || sides < 1) {
      throw new Error(`Invalid die sides: ${sides}`);
    }
    return Math.floor(Math.random() * sides) + 1;
  },
};

export const SUPPORTED_DICE = [4, 6, 8, 10, 12, 20, 100] as const;
export type DieSides = (typeof SUPPORTED_DICE)[number];

export type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';

export interface ParsedNotation {
  count: number;
  sides: number;
  modifier: number;
}

export interface RollOutcome {
  notation: string;
  rolls: number[];
  keptRolls: number[];
  modifier: number;
  total: number;
  mode: AdvantageMode;
  isNatural20: boolean;
  isNatural1: boolean;
}

const NOTATION_RE = /^\s*(\d+)?d(\d+)\s*([+-]\s*\d+)?\s*$/i;

export function parseDiceNotation(notation: string): ParsedNotation {
  const match = NOTATION_RE.exec(notation);
  if (!match) {
    throw new Error(`Invalid dice notation: "${notation}"`);
  }
  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2]!, 10);
  const modifier = match[3] ? parseInt(match[3].replace(/\s+/g, ''), 10) : 0;
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
    throw new Error(`Dice out of range in notation: "${notation}"`);
  }
  return { count, sides, modifier };
}

/**
 * Resolves effective advantage state per PHB Chapter 7, p. 209:
 * Any combination of both advantage and disadvantage cancels out to 'normal',
 * regardless of how many sources of each apply.
 */
export function resolveAdvantage(
  advantageSources: number,
  disadvantageSources: number,
): AdvantageMode {
  if (advantageSources > 0 && disadvantageSources > 0) return 'normal';
  if (advantageSources > 0) return 'advantage';
  if (disadvantageSources > 0) return 'disadvantage';
  return 'normal';
}

/** Rolls a standard notation string, supporting advantage/disadvantage on 1d20 rolls. */
export function rollNotation(
  notation: string,
  mode: AdvantageMode = 'normal',
  rng: Rng = defaultRng,
): RollOutcome {
  const { count, sides, modifier } = parseDiceNotation(notation);

  if (count === 1 && sides === 20 && mode !== 'normal') {
    const first = rng.rollDie(20);
    const second = rng.rollDie(20);
    const kept = mode === 'advantage' ? Math.max(first, second) : Math.min(first, second);
    return {
      notation: formatNotation(1, 20, modifier),
      rolls: [first, second],
      keptRolls: [kept],
      modifier,
      total: kept + modifier,
      mode,
      isNatural20: kept === 20,
      isNatural1: kept === 1,
    };
  }

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(rng.rollDie(sides));
  }
  const sum = rolls.reduce((acc, n) => acc + n, 0);
  const singleD20 = count === 1 && sides === 20 ? rolls[0] : undefined;

  return {
    notation: formatNotation(count, sides, modifier),
    rolls,
    keptRolls: rolls,
    modifier,
    total: sum + modifier,
    mode: 'normal',
    isNatural20: singleD20 === 20,
    isNatural1: singleD20 === 1,
  };
}

/**
 * Rolls damage dice, doubling the number of dice on a critical hit plus any extra
 * brutal critical dice (PHB Chapter 9 & Berserker Brutal Critical, p. 50).
 */
export function rollDamage(
  notation: string,
  options: { critical?: boolean; extraCritDice?: number } = {},
  rng: Rng = defaultRng,
): RollOutcome {
  const { count, sides, modifier } = parseDiceNotation(notation);
  const effectiveCount = options.critical
    ? count * 2 + (options.extraCritDice ?? 0)
    : count;
  return rollNotation(formatNotation(effectiveCount, sides, modifier), 'normal', rng);
}

export function formatNotation(count: number, sides: number, modifier: number): string {
  const modPart = modifier === 0 ? '' : modifier > 0 ? `+${modifier}` : `${modifier}`;
  return `${count}d${sides}${modPart}`;
}
