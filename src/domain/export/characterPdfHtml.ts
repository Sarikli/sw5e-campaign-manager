import {
  abilityModifier,
  calculatePowercasting,
  formatSigned,
  proficiencyBonus,
  savingThrowModifier,
  skillModifier,
  xpForNextLevel,
} from '../calculations/characterStats';
import type { CharacterDetails, InventoryItemData } from '../models/characterSheet';
import {
  CLASS_SPECS,
  type AbilityKey,
  type ProficiencyLevel,
  type SkillKey,
} from '../sw5e/constants';
import type { ContentEntry } from '../sw5e/contentSchema';
import {
  CLASS_LEVEL_FEATURES,
  getBackgroundBenefits,
  getSpeciesTraits,
} from '../sw5e/sourcebooks';
import { calculateWeaponCombatStats } from '../sw5e/weapons';
import { OFFICIAL_SHEET_PAGES } from './officialSheetPages';

export interface CharacterPdfParams {
  name: string;
  levelTotal: number;
  details: CharacterDetails;
  ac: number;
  maxHp: number;
  maxForcePoints: number;
  maxTechPoints: number;
  knownPowers: ContentEntry[];
  feats: ContentEntry[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const ABILITY_COORDS: ReadonlyArray<{
  key: AbilityKey;
  modTop: number;
  scoreTop: number;
  saveCy: number;
}> = [
  { key: 'str', modTop: 124.5, scoreTop: 151.5, saveCy: 143.6 },
  { key: 'dex', modTop: 179.4, scoreTop: 206.4, saveCy: 198.5 },
  { key: 'con', modTop: 251.4, scoreTop: 278.4, saveCy: 270.5 },
  { key: 'int', modTop: 306.3, scoreTop: 333.3, saveCy: 325.4 },
  { key: 'wis', modTop: 404.1, scoreTop: 431.1, saveCy: 423.3 },
  { key: 'cha', modTop: 501.9, scoreTop: 528.9, saveCy: 521.1 },
];

const SKILL_COORDS: ReadonlyArray<{ key: SkillKey; cy: number }> = [
  { key: 'athletics', cy: 158.6 },
  { key: 'acrobatics', cy: 213.5 },
  { key: 'sleight_of_hand', cy: 226.5 },
  { key: 'stealth', cy: 239.6 },
  { key: 'investigation', cy: 340.4 },
  { key: 'lore', cy: 353.4 },
  { key: 'nature', cy: 366.5 },
  { key: 'piloting', cy: 379.5 },
  { key: 'technology', cy: 392.5 },
  { key: 'animal_handling', cy: 438.2 },
  { key: 'insight', cy: 451.2 },
  { key: 'medicine', cy: 464.3 },
  { key: 'perception', cy: 477.4 },
  { key: 'survival', cy: 490.4 },
  { key: 'deception', cy: 536.0 },
  { key: 'intimidation', cy: 549.1 },
  { key: 'performance', cy: 562.1 },
  { key: 'persuasion', cy: 575.2 },
];

const HIT_DICE_BOX_CENTERS: ReadonlyArray<{ cx: number; cy: number }> = [
  { cx: 424.3, cy: 309.2 },
  { cx: 434.9, cy: 309.2 },
  { cx: 445.5, cy: 309.2 },
  { cx: 456.0, cy: 309.2 },
  { cx: 466.6, cy: 309.2 },
  { cx: 494.4, cy: 309.2 },
  { cx: 505.0, cy: 309.2 },
  { cx: 515.5, cy: 309.2 },
  { cx: 526.1, cy: 309.2 },
  { cx: 536.7, cy: 309.2 },
  { cx: 424.3, cy: 319.7 },
  { cx: 434.9, cy: 319.7 },
  { cx: 445.5, cy: 319.7 },
  { cx: 456.0, cy: 319.7 },
  { cx: 466.6, cy: 319.7 },
  { cx: 494.4, cy: 319.7 },
  { cx: 505.0, cy: 319.7 },
  { cx: 515.5, cy: 319.7 },
  { cx: 526.1, cy: 319.7 },
  { cx: 536.7, cy: 319.7 },
];

const POWER_BOX_COORDS: ReadonlyArray<{
  level: number;
  left: number;
  top: number;
  width: number;
  maxRows: number;
}> = [
  { level: 0, left: 53, top: 126.5, width: 242, maxRows: 11 },
  { level: 1, left: 328, top: 126.5, width: 230, maxRows: 11 },
  { level: 2, left: 64, top: 289.8, width: 230, maxRows: 9 },
  { level: 3, left: 328, top: 289.8, width: 230, maxRows: 9 },
  { level: 4, left: 64, top: 426.6, width: 230, maxRows: 8 },
  { level: 5, left: 328, top: 426.6, width: 230, maxRows: 8 },
  { level: 6, left: 64, top: 550.1, width: 230, maxRows: 7 },
  { level: 7, left: 328, top: 550.1, width: 230, maxRows: 7 },
  { level: 8, left: 64, top: 660.2, width: 230, maxRows: 7 },
  { level: 9, left: 328, top: 660.2, width: 230, maxRows: 7 },
];

function parsePowerLevel(entry: ContentEntry): number {
  try {
    const props = JSON.parse(entry.propertiesJson) as { level?: unknown };
    if (typeof props.level === 'number' && props.level >= 0 && props.level <= 9) {
      return props.level;
    }
  } catch {
    // ignore malformed propertiesJson
  }
  const match = entry.summary.match(/\b([1-9])(?:st|nd|rd|th)[-\s]+level\b/i);
  if (match?.[1]) {
    return Number(match[1]);
  }
  return 0;
}

function getWeaponRange(properties: readonly string[]): string {
  for (const prop of properties) {
    const match = prop.match(/range\s*\(?(\d+\s*\/\s*\d+)\)?/i);
    if (match?.[1]) return `${match[1]} ft`;
  }
  return properties.some((p) => p.toLowerCase().includes('thrown')) ? '20/60 ft' : '5 ft';
}

export function generateCharacterPdfHtml(params: CharacterPdfParams): string {
  const {
    name,
    levelTotal,
    details: d,
    ac,
    maxHp,
    maxForcePoints,
    maxTechPoints,
    knownPowers,
    feats,
  } = params;

  const classSpec = CLASS_SPECS[d.classKey] ?? CLASS_SPECS.guardian;
  const speciesTraits = getSpeciesTraits(d.speciesId);
  const bgBenefits = d.customBackground
    ? {
        name: d.customBackground.name || 'Custom Background',
        skills: d.customBackground.skills,
        toolProficiency: d.customBackground.tools.join(', ') || 'None',
        featureTitle: d.customBackground.featureTitle || 'Custom Feature',
        featureDescription: d.customBackground.featureDescription || '',
      }
    : getBackgroundBenefits(d.backgroundId);

  const pb = proficiencyBonus(levelTotal);
  const initMod = abilityModifier(d.scores.dex);
  const nextXp = xpForNextLevel(levelTotal);
  const passivePerc =
    10 +
    skillModifier(
      d.scores,
      levelTotal,
      'perception',
      (d.skillProficiencies.perception ?? 'none') as ProficiencyLevel,
    );

  const powerStats = calculatePowercasting([{ classKey: d.classKey, level: levelTotal }], d.scores);
  const weapons = d.inventory.filter((i: InventoryItemData) => i.kind === 'weapon');
  const armorsAndShields = d.inventory.filter(
    (i: InventoryItemData) => i.kind === 'armor' || i.kind === 'shield',
  );
  const totalWeight = d.inventory.reduce((sum, i) => sum + i.weight * i.quantity, 0);
  const creditsWeight = d.credits / 50;
  const totalWeightOnCharacter = totalWeight + creditsWeight;

  const strScore = d.scores.str;
  const encumberedLimit = strScore * 5;
  const heavilyEncumberedLimit = strScore * 10;
  const maxCarryingLimit = strScore * 15;
  const pushDragLiftLimit = strScore * 30;

  const hasMediumArmorMaster = feats.some((f) =>
    f.name.toLowerCase().includes('medium armor master'),
  );

  const classFeatures = (CLASS_LEVEL_FEATURES[d.classKey] ?? []).filter(
    (f) => f.level <= levelTotal,
  );

  const speedBase = d.baseSpeed;
  const speedHour = (speedBase / 10).toFixed(1).replace(/\.0$/, '');
  const speedDay = (Number(speedHour) * 8).toFixed(0);
  const specialMoveParts: string[] = [];
  if (speciesTraits.swimSpeed) specialMoveParts.push(`Swim ${speciesTraits.swimSpeed} ft`);
  if (speciesTraits.climbSpeed) specialMoveParts.push(`Climb ${speciesTraits.climbSpeed} ft`);

  // Page 1: Abilities & Saving Throws overlay
  const abilitiesOverlayHtml = ABILITY_COORDS.map((ab) => {
    const score = d.scores[ab.key];
    const mod = abilityModifier(score);
    const saveProf = d.savingThrowProficiencies.includes(ab.key);
    const saveMod = savingThrowModifier(d.scores, levelTotal, ab.key, saveProf);

    return `
      <div class="f ab-mod" style="left:58.5pt;top:${ab.modTop}pt;width:41pt;">${formatSigned(mod)}</div>
      <div class="f ab-score" style="left:63pt;top:${ab.scoreTop}pt;width:31pt;">${score}</div>
      ${
        saveProf
          ? `<div class="dot-fill" style="left:${112.5 - 2.6}pt;top:${ab.saveCy - 2.6}pt;"></div>`
          : ''
      }
      <div class="f check-num" style="left:119.5pt;top:${ab.saveCy - 5.5}pt;width:16pt;">${formatSigned(saveMod)}</div>
    `;
  }).join('');

  // Page 1: 18 Skills overlay
  const skillsOverlayHtml = SKILL_COORDS.map((sk) => {
    const level = (d.skillProficiencies[sk.key] ?? 'none') as ProficiencyLevel;
    const skMod = skillModifier(d.scores, levelTotal, sk.key, level);
    const isProf = level === 'proficient' || level === 'expertise';
    const isExp = level === 'expertise';
    return `
      ${isProf ? `<div class="dot-fill" style="left:${106.6 - 2.6}pt;top:${sk.cy - 2.6}pt;"></div>` : ''}
      ${isExp ? `<div class="diamond-fill" style="left:${117.4 - 2.4}pt;top:${sk.cy - 2.4}pt;"></div>` : ''}
      <div class="f check-num" style="left:122pt;top:${sk.cy - 5.5}pt;width:15pt;">${formatSigned(skMod)}</div>
    `;
  }).join('');

  // Page 1: Armor & Shield rows (up to 4 rows at y = 182, 195.2, 208.5, 221.7)
  const armorOverlayHtml = armorsAndShields
    .slice(0, 4)
    .map((a, idx) => {
      const rowTop = 182.2 + idx * 13.25;
      const maxDex =
        a.armorCategory === 'medium'
          ? hasMediumArmorMaster
            ? '+3'
            : '+2'
          : a.armorCategory === 'heavy'
            ? '0'
            : 'All';
      return `
        <div class="f row-sm" style="left:243pt;top:${rowTop}pt;width:82pt;">${escapeHtml(a.name)}${a.equipped ? ' ✓' : ''}</div>
        <div class="f row-sm c" style="left:326pt;top:${rowTop}pt;width:11pt;">${a.enhancementBonus ? formatSigned(a.enhancementBonus) : ''}</div>
        <div class="f row-sm c" style="left:337.5pt;top:${rowTop}pt;width:10pt;">${a.baseAc ?? (a.shieldAcBonus ? `+${a.shieldAcBonus}` : '')}</div>
        <div class="f row-sm c" style="left:347.5pt;top:${rowTop}pt;width:10pt;">${maxDex}</div>
        <div class="f row-sm c" style="left:357.5pt;top:${rowTop}pt;width:13pt;">${a.weight}</div>
      `;
    })
    .join('');

  // Page 1: Hit Dice checkboxes
  const hitDiceMarksHtml = HIT_DICE_BOX_CENTERS.slice(0, Math.min(20, d.hitDiceSpent))
    .map(
      (pt) =>
        `<div class="f hd-mark" style="left:${pt.cx - 3.5}pt;top:${pt.cy - 4.5}pt;width:7pt;">✕</div>`,
    )
    .join('');

  // Page 1: Weapons & Ammunitions (up to 5 two-row slots)
  const weaponsOverlayHtml = weapons
    .slice(0, 5)
    .map((w, idx) => {
      const stats = calculateWeaponCombatStats({
        weapon: w,
        scores: d.scores,
        profBonus: pb,
        weaponProficiencies: d.weaponProficiencies,
      });
      const baseTop = 398.2 + idx * 31.73;
      const propTop = baseTop + 13.3;
      return `
        <div class="f row-md" style="left:231pt;top:${baseTop}pt;width:98pt;font-weight:700;">${escapeHtml(w.name)}${w.equipped ? ' (EQ)' : ''}</div>
        <div class="f row-md c" style="left:331pt;top:${baseTop}pt;width:45pt;font-weight:800;">${formatSigned(stats.toHit)}</div>
        <div class="f row-md c" style="left:378pt;top:${baseTop}pt;width:88pt;">${escapeHtml(stats.damageFormula)} ${escapeHtml(stats.damageType)}</div>
        <div class="f row-md c" style="left:468pt;top:${baseTop}pt;width:58pt;">${escapeHtml(getWeaponRange(w.properties))}</div>
        <div class="f row-md c" style="left:529pt;top:${baseTop}pt;width:27pt;">${w.weight} lb</div>
        <div class="f row-xs" style="left:231pt;top:${propTop}pt;width:324pt;">${escapeHtml(w.properties.join(', '))}</div>
      `;
    })
    .join('');

  // Page 1: Combat Features (up to 9 rows at y = 623 + idx * 13.22)
  const combatFeatureLines: string[] = [
    ...classFeatures.map((f) => `Lv ${f.level} ${f.title}: ${f.description}`),
    ...feats.map((f) => `${f.name}: ${f.summary}`),
    ...speciesTraits.traits.map((t) => `${t.name}: ${t.description}`),
  ];
  const combatFeaturesOverlayHtml = combatFeatureLines
    .slice(0, 9)
    .map((line, idx) => {
      const top = 623.2 + idx * 13.22;
      return `<div class="f row-sm" style="left:238pt;top:${top}pt;width:272pt;">${escapeHtml(line)}</div>`;
    })
    .join('');

  const advResImmLines = [
    d.resistances.length > 0 ? `Resistances: ${d.resistances.join(', ')}` : '',
    d.immunities.length > 0 ? `Immunities: ${d.immunities.join(', ')}` : '',
    d.vulnerabilities.length > 0 ? `Vulnerabilities: ${d.vulnerabilities.join(', ')}` : '',
    ...speciesTraits.traits.slice(0, 3).map((t) => `${t.name}: ${t.description}`),
  ].filter(Boolean);

  // Page 2: Proficiencies, Languages, Features, Character Data, Backstory
  const proficienciesText = [
    `Armor: ${d.armorProficiencies.join(', ') || 'None'}`,
    `Weapons: ${d.weaponProficiencies.join(', ') || 'None'}`,
    `Tools: ${d.toolProficiencies.join(', ') || 'None'}`,
  ].join('\n');

  const page2FeaturesLines = [
    ...speciesTraits.traits.map((t) => `• ${t.name} (${speciesTraits.name}): ${t.description}`),
    ...classFeatures.map((f) => `• Lv ${f.level} ${f.title}: ${f.description}`),
    ...feats.map((f) => `• Feat — ${f.name}: ${f.summary}`),
  ].join('\n');

  // Page 3: Equipment rows (up to 47 rows starting at top = 26pt, step = 13.36pt)
  const equipmentOverlayHtml = d.inventory
    .slice(0, 47)
    .map((item, idx) => {
      const rowTop = 26.2 + idx * 13.36;
      return `
        <div class="f row-sm" style="left:51pt;top:${rowTop}pt;width:168pt;">${item.quantity > 1 ? `${item.quantity}× ` : ''}${escapeHtml(item.name)} (${(item.weight * item.quantity).toFixed(1)} lb)</div>
        <div class="f row-sm c" style="left:221pt;top:${rowTop}pt;width:24pt;font-weight:800;">${item.equipped ? '✓' : ''}</div>
        <div class="f row-sm c" style="left:247pt;top:${rowTop}pt;width:24pt;font-weight:800;">${!item.equipped ? '✓' : ''}</div>
      `;
    })
    .join('');

  // Page 4: Powers grouped by level (0..9)
  const powersByLevel = new Map<number, ContentEntry[]>();
  for (let lvl = 0; lvl <= 9; lvl++) {
    powersByLevel.set(lvl, []);
  }
  for (const p of knownPowers) {
    const lvl = parsePowerLevel(p);
    powersByLevel.get(lvl)?.push(p);
  }

  const powersOverlayHtml = POWER_BOX_COORDS.map((box) => {
    const list = powersByLevel.get(box.level) ?? [];
    return list
      .slice(0, box.maxRows)
      .map((entry, idx) => {
        const rowTop = box.top + idx * 13.34;
        const kindTag = entry.contentType === 'force_power' ? 'Force' : 'Tech';
        return `<div class="f row-sm" style="left:${box.left}pt;top:${rowTop}pt;width:${box.width}pt;"><strong>${escapeHtml(entry.name)}</strong> <span style="font-size:6.5pt;color:#334155;">(${kindTag}) — ${escapeHtml(entry.summary)}</span></div>`;
      })
      .join('');
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(name)} — SW5e Character Sheet</title>
  <style>
    @page {
      size: 612pt 792pt;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .sheet-page {
      position: relative;
      width: 612pt;
      height: 792pt;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      background: #ffffff;
    }
    .sheet-page:last-of-type {
      page-break-after: auto;
      break-after: auto;
    }
    .sheet-bg {
      position: absolute;
      left: 0;
      top: 0;
      width: 612pt;
      height: 792pt;
      display: block;
      pointer-events: none;
      user-select: none;
    }
    .f {
      position: absolute;
      color: #0f172a;
      line-height: 1.15;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .f.multiline {
      white-space: pre-wrap;
      line-height: 13.35pt;
      font-size: 7.6pt;
    }
    .c { text-align: center; }
    .ab-mod { font-size: 13.5pt; font-weight: 900; text-align: center; }
    .ab-score { font-size: 9pt; font-weight: 800; text-align: center; }
    .check-num { font-size: 7.6pt; font-weight: 800; text-align: center; }
    .row-md { font-size: 7.8pt; }
    .row-sm { font-size: 7.2pt; }
    .row-xs { font-size: 6.4pt; color: #334155; }
    .dot-fill {
      position: absolute;
      width: 5.2pt;
      height: 5.2pt;
      border-radius: 50%;
      background: #0f172a;
    }
    .diamond-fill {
      position: absolute;
      width: 4.8pt;
      height: 4.8pt;
      background: #0f172a;
      transform: rotate(45deg);
    }
    .hd-mark {
      font-size: 7pt;
      font-weight: 900;
      text-align: center;
      color: #0f172a;
    }
    .portrait-overlay {
      position: absolute;
      object-fit: cover;
      border: 1pt solid #1e293b;
      border-radius: 3pt;
      background: #ffffff;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1: OFFICIAL SW5E SHEET PAGE 1 ==================== -->
  <div class="sheet-page">
    <img class="sheet-bg" src="${OFFICIAL_SHEET_PAGES[0]}" alt="SW5e Character Sheet Page 1" />
    <span class="sr-only">PASSIVE WISDOM (PERCEPTION) DEATH SAVES WEAPONS &amp; AMMUNITIONS COMBAT FEATURES</span>

    <!-- Header Fields -->
    <div class="f" style="left:55pt;top:74.5pt;width:180pt;font-size:13pt;font-weight:900;">${escapeHtml(name)}</div>
    <div class="f" style="left:266.5pt;top:40pt;width:180pt;font-size:8.8pt;font-weight:800;">${escapeHtml(classSpec.name)} ${levelTotal}${d.archetypeName ? ` (${escapeHtml(d.archetypeName)})` : ''}</div>
    <div class="f" style="left:451.5pt;top:40pt;width:96pt;font-size:8.8pt;font-weight:700;">${escapeHtml(d.alignment)}</div>
    <div class="f" style="left:266.5pt;top:58.2pt;width:180pt;font-size:8.8pt;font-weight:700;">${escapeHtml(d.speciesName)}</div>
    <div class="f" style="left:451.5pt;top:58.2pt;width:96pt;font-size:8.8pt;font-weight:700;">${escapeHtml(bgBenefits.name)}</div>
    <div class="f" style="left:266.5pt;top:76.8pt;width:92pt;font-size:8.5pt;font-weight:700;">${d.xp}</div>
    <div class="f" style="left:364pt;top:76.8pt;width:82pt;font-size:8.5pt;font-weight:700;">${nextXp !== null ? nextXp : 'MAX'}</div>

    <!-- Abilities, Saving Throws, Skills -->
    ${abilitiesOverlayHtml}
    ${skillsOverlayHtml}

    <!-- Passive Perception, Inspiration, Senses & Movement -->
    <div class="f c" style="left:58.5pt;top:616pt;width:34pt;font-size:11pt;font-weight:900;">${passivePerc}</div>
    <div class="f c" style="left:58.5pt;top:642.5pt;width:34pt;font-size:11pt;font-weight:900;">${d.heroicInspiration ? '★' : ''}</div>
    <div class="f c" style="left:60pt;top:681pt;width:143pt;font-size:8.2pt;font-weight:700;">${speciesTraits.darkvision ? `Darkvision ${speciesTraits.darkvision} ft` : 'Normal Vision'}</div>
    <div class="f c" style="left:64pt;top:719pt;width:34pt;font-size:8.8pt;font-weight:800;">${speedBase} ft</div>
    <div class="f c" style="left:113.6pt;top:719pt;width:34pt;font-size:8.2pt;font-weight:700;">${speedHour} mi</div>
    <div class="f c" style="left:163.9pt;top:719pt;width:34pt;font-size:8.2pt;font-weight:700;">${speedDay} mi</div>
    <div class="f c" style="left:60pt;top:743pt;width:143pt;font-size:7.4pt;font-weight:700;">${escapeHtml(specialMoveParts.join(' • '))}</div>

    <!-- Proficiency Bonus, Armor Class, Armor Table, Advantages/Resistances -->
    <div class="f c" style="left:228pt;top:120pt;width:30pt;font-size:12pt;font-weight:900;">+${pb}</div>
    ${hasMediumArmorMaster ? `<div class="dot-fill" style="left:${355.2 - 2.6}pt;top:${152.7 - 2.6}pt;"></div>` : ''}
    <div class="f c" style="left:228.5pt;top:156.5pt;width:32pt;font-size:13pt;font-weight:900;">${ac}</div>
    ${armorOverlayHtml}
    <div class="f multiline" style="left:231pt;top:257pt;width:150pt;height:103pt;">${escapeHtml(advResImmLines.join('\n'))}</div>

    <!-- Initiative, Hit Points, Hit Dice, Death Saves -->
    <div class="f c" style="left:401pt;top:119.5pt;width:29pt;font-size:12pt;font-weight:900;">${formatSigned(initMod)}</div>
    <div class="f c" style="left:502pt;top:166.5pt;width:45pt;font-size:9.5pt;font-weight:800;">${maxHp}</div>
    <div class="f c" style="left:415pt;top:183pt;width:130pt;font-size:17pt;font-weight:900;">${d.hpCurrent}</div>
    <div class="f c" style="left:415pt;top:237pt;width:130pt;font-size:14pt;font-weight:800;">${d.hpTemp > 0 ? d.hpTemp : ''}</div>
    <div class="f c" style="left:500pt;top:289pt;width:45pt;font-size:9pt;font-weight:800;">${levelTotal}d${classSpec.hitDie}</div>
    ${hitDiceMarksHtml}

    <!-- Weapons & Combat Features -->
    ${weaponsOverlayHtml}
    ${combatFeaturesOverlayHtml}
  </div>

  <!-- ==================== PAGE 2: OFFICIAL SW5E SHEET PAGE 2 ==================== -->
  <div class="sheet-page">
    <img class="sheet-bg" src="${OFFICIAL_SHEET_PAGES[1]}" alt="SW5e Character Sheet Page 2" />
    <span class="sr-only">CHARACTER DATA PROFICIENCIES LANGUAGES BACKSTORY FEATURES</span>

    <!-- Left Column: Proficiencies, Languages, Features -->
    <div class="f multiline" style="left:52pt;top:26.5pt;width:156pt;height:118pt;">${escapeHtml(proficienciesText)}</div>
    <div class="f multiline" style="left:52pt;top:167.5pt;width:156pt;height:52pt;">${escapeHtml(d.languages.join(', ') || 'Galactic Basic')}</div>
    <div class="f multiline" style="left:52pt;top:240pt;width:156pt;height:505pt;">${escapeHtml(page2FeaturesLines)}</div>

    <!-- Right Column: Character Data & Backstory -->
    <div class="f" style="left:275pt;top:27pt;width:282pt;font-size:8.2pt;">${escapeHtml(d.structuredNotes.other || '')}</div>
    <div class="f" style="left:248pt;top:81pt;width:135pt;font-size:8.2pt;font-weight:700;">${escapeHtml(d.characteristics.age || '')}</div>
    <div class="f" style="left:420pt;top:81pt;width:138pt;font-size:8.2pt;font-weight:700;">${escapeHtml(d.characteristics.gender || '')}</div>
    <div class="f" style="left:254pt;top:94.3pt;width:129pt;font-size:8.2pt;font-weight:700;">${escapeHtml(d.characteristics.height || '')}</div>
    <div class="f" style="left:418pt;top:94.3pt;width:140pt;font-size:8.2pt;font-weight:700;">${escapeHtml(d.characteristics.weight || '')}</div>
    <div class="f" style="left:246pt;top:107.7pt;width:137pt;font-size:8.2pt;font-weight:700;">${escapeHtml(speciesTraits.size)}</div>
    <div class="f" style="left:408pt;top:107.7pt;width:150pt;font-size:8.2pt;font-weight:700;">${escapeHtml(d.characteristics.hair || '')}</div>
    <div class="f" style="left:248pt;top:121pt;width:135pt;font-size:8.2pt;font-weight:700;">${escapeHtml(d.characteristics.eyes || '')}</div>
    <div class="f" style="left:408pt;top:121pt;width:150pt;font-size:8.2pt;font-weight:700;">${escapeHtml(d.characteristics.skin || '')}</div>

    ${
      d.avatarUri
        ? `<img src="${escapeHtml(d.avatarUri)}" alt="Portrait" class="portrait-overlay" style="left:502pt;top:26pt;width:56pt;height:54pt;" />`
        : ''
    }

    <div class="f multiline" style="left:228pt;top:186.5pt;width:332pt;height:26pt;">${escapeHtml(d.characteristics.personalityTraits || '')}</div>
    <div class="f multiline" style="left:228pt;top:226.5pt;width:332pt;height:26pt;">${escapeHtml(d.characteristics.ideals || '')}</div>
    <div class="f multiline" style="left:228pt;top:266.5pt;width:332pt;height:26pt;">${escapeHtml(d.characteristics.bonds || '')}</div>
    <div class="f multiline" style="left:228pt;top:306.5pt;width:332pt;height:26pt;">${escapeHtml(d.characteristics.flaws || '')}</div>
    <div class="f multiline" style="left:228pt;top:348pt;width:332pt;height:156pt;">${escapeHtml(`${bgBenefits.name} — ${bgBenefits.featureTitle}: ${bgBenefits.featureDescription}`)}</div>

    <div class="f multiline" style="left:228pt;top:534.5pt;width:332pt;height:212pt;">${escapeHtml(
      [
        d.structuredNotes.backstory || d.notes,
        d.structuredNotes.organizations ? `Organizations: ${d.structuredNotes.organizations}` : '',
        d.structuredNotes.allies ? `Allies: ${d.structuredNotes.allies}` : '',
        d.structuredNotes.enemies ? `Enemies: ${d.structuredNotes.enemies}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
    )}</div>
  </div>

  <!-- ==================== PAGE 3: OFFICIAL SW5E SHEET PAGE 3 ==================== -->
  <div class="sheet-page">
    <img class="sheet-bg" src="${OFFICIAL_SHEET_PAGES[2]}" alt="SW5e Character Sheet Page 3" />
    <span class="sr-only">EQUIPMENT CREDITS CARRYING CAPACITY</span>

    ${equipmentOverlayHtml}
    <div class="f c" style="left:221pt;top:667pt;width:76pt;font-size:8.2pt;font-weight:800;">${totalWeight.toFixed(1)} lb</div>
    <div class="f c" style="left:221pt;top:681.5pt;width:76pt;font-size:8.2pt;font-weight:800;">${totalWeightOnCharacter.toFixed(1)} lb</div>

    <!-- Credits & Storage & Carrying Capacity -->
    <div class="f c" style="left:322pt;top:58pt;width:232pt;font-size:15pt;font-weight:900;">${d.credits} CR</div>
    <div class="f multiline" style="left:318pt;top:396pt;width:240pt;height:250pt;">${escapeHtml(d.structuredNotes.allies || '')}</div>

    <div class="f c" style="left:325pt;top:706pt;width:44pt;font-size:9.5pt;font-weight:900;">${encumberedLimit} lb</div>
    <div class="f c" style="left:384.5pt;top:706pt;width:44pt;font-size:9.5pt;font-weight:900;">${heavilyEncumberedLimit} lb</div>
    <div class="f c" style="left:444pt;top:706pt;width:44pt;font-size:9.5pt;font-weight:900;">${maxCarryingLimit} lb</div>
    <div class="f c" style="left:506.5pt;top:706pt;width:44pt;font-size:9.5pt;font-weight:900;">${pushDragLiftLimit} lb</div>
  </div>

  <!-- ==================== PAGE 4: OFFICIAL SW5E SHEET PAGE 4 ==================== -->
  <div class="sheet-page">
    <img class="sheet-bg" src="${OFFICIAL_SHEET_PAGES[3]}" alt="SW5e Character Sheet Page 4" />
    <span class="sr-only">AT-WILL TECH SAVE DC: FORCE SAVE DC:</span>

    <!-- Tech & Force Points + Save DCs / Attack Modifiers -->
    <div class="f c" style="left:53pt;top:33pt;width:102pt;font-size:13pt;font-weight:900;">${maxTechPoints || ''}</div>
    <div class="f c" style="left:53pt;top:72pt;width:102pt;font-size:12pt;font-weight:800;">${maxTechPoints > 0 ? d.techPointsSpent : ''}</div>

    <div class="f c" style="left:457pt;top:33pt;width:102pt;font-size:13pt;font-weight:900;">${maxForcePoints || ''}</div>
    <div class="f c" style="left:457pt;top:72pt;width:102pt;font-size:12pt;font-weight:800;">${maxForcePoints > 0 ? d.forcePointsSpent : ''}</div>

    <div class="f c" style="left:278pt;top:29.5pt;width:45pt;font-size:9pt;font-weight:800;">${maxTechPoints > 0 ? formatSigned(powerStats.tech.attackBonus) : ''}</div>
    <div class="f c" style="left:405pt;top:29.5pt;width:45pt;font-size:9pt;font-weight:800;">${maxTechPoints > 0 ? powerStats.tech.saveDc : ''}</div>

    <div class="f c" style="left:278pt;top:64.5pt;width:45pt;font-size:9pt;font-weight:800;">${maxForcePoints > 0 ? formatSigned(powerStats.force.lightAttackBonus) : ''}</div>
    <div class="f c" style="left:405pt;top:64.0pt;width:45pt;font-size:9pt;font-weight:800;">${maxForcePoints > 0 ? powerStats.force.lightSaveDc : ''}</div>

    <div class="f c" style="left:278pt;top:82.0pt;width:45pt;font-size:9pt;font-weight:800;">${maxForcePoints > 0 ? formatSigned(powerStats.force.darkAttackBonus) : ''}</div>
    <div class="f c" style="left:405pt;top:81.5pt;width:45pt;font-size:9pt;font-weight:800;">${maxForcePoints > 0 ? powerStats.force.darkSaveDc : ''}</div>

    <div class="f c" style="left:278pt;top:99.5pt;width:45pt;font-size:9pt;font-weight:800;">${maxForcePoints > 0 ? formatSigned(powerStats.force.universalAttackBonus) : ''}</div>
    <div class="f c" style="left:405pt;top:98.8pt;width:45pt;font-size:9pt;font-weight:800;">${maxForcePoints > 0 ? powerStats.force.universalSaveDc : ''}</div>

    <!-- Known Powers by Level (AT-WILL .. 9th LEVEL) -->
    ${powersOverlayHtml}
  </div>

</body>
</html>`;
}
