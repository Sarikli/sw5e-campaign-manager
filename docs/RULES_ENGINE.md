# Rules Engine Design & Verification Log

Status: **Phase 2 Verified & Implemented** (`src/domain/sw5e/constants.ts`, `src/domain/calculations/characterStats.ts`, `src/domain/calculations/dice.ts`).
Every rule below has been verified against the SW5e Player's Handbook (PHB) PDF in the workspace and is covered by unit tests in `src/domain/calculations/calculations.test.ts`.

## 1. Principles
- Pure TypeScript in `src/domain`; zero React Native, Expo, or SQLite imports (enforced by ESLint `no-restricted-imports`).
- Characters store choices; the engine derives stats (`deriveCharacterStats(choices) → DerivedCharacterStats`).
- Every rule function cites its exact book and page reference.
- Randomness is injected (`Rng` port in `src/domain/calculations/dice.ts`).

## 2. Verified SW5e Mechanics (PHB)

| Module | Verified Formula / Rule | Source Reference |
|---|---|---|
| `abilityModifier` | `floor((score - 10) / 2)` for scores 1–30 (-5 to +10) | PHB Ch. 7, p. 209 ✔ |
| `proficiencyBonus` | `floor((totalLevel - 1) / 4) + 2` (+2 at L1..4 up to +6 at L17..20) | PHB Ch. 1, p. 15; Ch. 6, p. 191 ✔ |
| `skills` | 18 SW5e skills: Athletics (STR); Acrobatics, Sleight of Hand, Stealth (DEX); Investigation, Lore, Nature, Piloting, Technology (INT); Animal Handling, Insight, Medicine, Perception, Survival (WIS); Deception, Intimidation, Performance, Persuasion (CHA) | PHB Ch. 7, pp. 210–214 ✔ |
| `passiveScore` | `10 + modifier + (+5 advantage / -5 disadvantage)` | PHB Ch. 7, p. 211 ✔ |
| `armorClass` | Light: `base + DEX`; Medium: `base + min(DEX, 2)`; Heavy: `base` (ignores negative DEX); Unarmored: `10 + DEX` (Berserker `+ CON`, Monk `+ max(WIS, CHA)`); Shield: `+1/+2/+3` | PHB Ch. 5, pp. 172–174 ✔ |
| `hitPoints` | 1st character level: `hitDie + CON mod`; subsequent levels: `fixedAverage (or roll) + CON mod` (min 1 HP per level) | PHB Ch. 1, p. 15; Ch. 6, p. 191 ✔ |
| `powerPointCost` | Level 0 (At-will): `0` pts; Level 1–9: `powerLevel + 1` pts (2 to 10 pts) | PHB Ch. 10, p. 233 ✔ |
| `powercasting` | **Force:** Consular `4×lvl`, Sentinel `3×lvl`, Guardian `2×lvl`, 1/3 Archetypes `1×lvl`, plus `max(WIS mod, CHA mod)` added **once** across all forcecasting classes. Recharges on **Long Rest**. Light uses WIS, Dark uses CHA, Universal uses `max(WIS, CHA)`.<br>**Tech:** Engineer `2×lvl`, Scout `1×lvl` (from L2), 1/3 Archetypes `ceil(0.5×lvl)`, plus `INT mod` added **once**. Recharges on **Short or Long Rest**. Requires a tech focus (wristpad). | PHB Ch. 3, pp. 59, 67, 89, 131, 139; Ch. 6, p. 192; Ch. 10, pp. 233–235 ✔ |
| `multiclassMaxPowerLevel` | `floor(sum((classPotentialMax / 9) * classLevel))` mapped via Multiclass Max Power Level table | PHB Ch. 6, p. 192 ✔ |
| `conditions` | 17 conditions including SW5e-specific **Shocked** (no reactions; action OR bonus action) and **Slowed 1–4** (L1 -15 ft, L2 -25 ft, L3 -30 ft, L4 speed 0; Grappled & Restrained impose Slowed 4) | PHB App. A, pp. 305–306 ✔ |
| `weapons` | 69 canonical weapons across 6 categories (Simple/Martial Blasters, Simple/Martial Lightweapons, Simple/Martial Vibroweapons). To Hit: `abilityMod + profBonus (if proficient) + enhancement`. Ability: DEX for ranged, STR for melee, `max(STR, DEX)` for finesse. SW5e Heavy property: `+ceil(strMod / 2)` (min +1) on STR hits. Damage: `dice + abilityMod + heavyBonus + enhancement`. | PHB Ch. 5, pp. 175–178 ✔ |
| `dice` | Advantage and disadvantage cancel out regardless of count; critical hits double damage dice plus any Brutal Critical dice | PHB Ch. 7, p. 209; Ch. 9 ✔ |

## 3. Resolved Ambiguities Register
| ID | Question | Resolution |
|---|---|---|
| RQ-1 | Exact SW5e skill list and ability linkage | Resolved (PHB p. 211): 18 skills; Lore, Piloting, and Technology are under INT. |
| RQ-2 | Force vs tech point pool formulas per class/level | Resolved (PHB Ch. 3 & Ch. 10): Force 4x/3x/2x/1x (Long Rest); Tech 2x/1x/0.5x (Short/Long Rest); casting ability modifier added once. |
| RQ-3 | Proficiency bonus & ability modifier equal to 5e? | Resolved (PHB p. 15, p. 209): Identical formulas verified. |
| RQ-4 | HP at level 1 and level-up method | Resolved (PHB p. 15, p. 191): Max hit die only at 1st total character level; fixed average (`hitDie/2 + 1`) or roll thereafter. |
| RQ-5 | Multiclassing prerequisites and power-point combination | Resolved (PHB p. 191–192): Separate Force/Tech pools; modifier added once per pool; weighted Max Power Level formula implemented. |
| RQ-6/7 | Ruleset taxonomy | `SW5e-PHB-2022` used as canonical baseline across PHB, S&V, SotG, and WH. |
