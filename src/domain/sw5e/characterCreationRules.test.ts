import {
  BACKGROUND_BENEFITS_MAP,
  FULL_CLASS_LEVEL_FEATURES,
  SPECIES_TRAITS_MAP,
  SW5E_TOOL_PROFICIENCIES,
  POINT_BUY_BUDGET,
  POINT_BUY_COST,
  STANDARD_ARRAY,
  calculatePointBuySpent,
  getMaxKnownPowers,
  getBackgroundBenefits,
  getSpeciesTraits,
} from './characterCreationRules';
import {
  BACKGROUND_PERSONALITY_MAP,
  CLASS_ROLEPLAY_GUIDES,
} from './backgroundPersonality';
import { generateCharacterPdfHtml } from '../export/characterPdfHtml';
import { characterDataSchema } from '../models/characterSheet';
import { CLASS_SPECS } from './constants';

describe('Character Creation Rules & Progression (SW5e)', () => {
  describe('Species Traits & Senses', () => {
    it('defines authentic traits for canonical species', () => {
      expect(SPECIES_TRAITS_MAP.human).toBeDefined();
      expect(SPECIES_TRAITS_MAP.wookiee).toBeDefined();
      expect(SPECIES_TRAITS_MAP.twilek).toBeDefined();
      expect(SPECIES_TRAITS_MAP.jawa).toBeDefined();
      expect(SPECIES_TRAITS_MAP.bothan).toBeDefined();

      expect(getSpeciesTraits('sw5e:core:species:human').name).toBe('Human');
      expect(getSpeciesTraits('sw5e:core:species:wookiee').name).toBe('Wookiee');
    });

    it('returns Wookiee traits with STR+2/CON+1, 60ft Darkvision and Shyriiwook', () => {
      const wookiee = getSpeciesTraits('wookiee');
      expect(wookiee.name).toBe('Wookiee');
      expect(wookiee.size).toBe('Medium');
      expect(wookiee.speed).toBe(30);
      expect(wookiee.abilityBonuses.str).toBe(2);
      expect(wookiee.abilityBonuses.con).toBe(1);
      expect(wookiee.languages).toContain('Shyriiwook');
      expect(wookiee.darkvision).toBe(60);
    });

    it('returns Jawa with Small size, 25ft speed, and 60ft Darkvision', () => {
      const jawa = getSpeciesTraits('jawa');
      expect(jawa.name).toBe('Jawa');
      expect(jawa.size).toBe('Small');
      expect(jawa.speed).toBe(25);
      expect(jawa.darkvision).toBe(60);
      expect(jawa.abilityBonuses.dex).toBe(2);
      expect(jawa.languages).toContain('Jawaese');
    });

    it('returns Bothan with inherent Deception and Stealth skills', () => {
      const bothan = getSpeciesTraits('bothan');
      expect(bothan.inherentSkills).toContain('deception');
      expect(bothan.inherentSkills).toContain('stealth');
      expect(bothan.abilityBonuses.int).toBe(2);
      expect(bothan.abilityBonuses.dex).toBe(1);
    });

    it('returns Mon Calamari with swim speed 30ft', () => {
      const moncal = getSpeciesTraits('mon-calamari');
      expect(moncal.swimSpeed).toBe(30);
      expect(moncal.inherentSkills).toContain('perception');
      expect(moncal.inherentSkills).toContain('piloting');
    });

    it('includes all 30 official SW5e PHB species with no negative ASI penalties', () => {
      const phbSpeciesSlugs = [
        'bith',
        'bothan',
        'cathar',
        'cerean',
        'chiss',
        'devaronian',
        'droid-class-i',
        'droid-class-ii',
        'droid-class-iii',
        'droid-class-iv',
        'droid-class-v',
        'duros',
        'ewok',
        'gamorrean',
        'gungan',
        'human',
        'ithorian',
        'jawa',
        'kel-dor',
        'mon-calamari',
        'nautolan',
        'rodian',
        'sith-pureblood',
        'togruta',
        'trandoshan',
        'tusken',
        'twilek',
        'weequay',
        'wookiee',
        'zabrak',
      ];

      for (const slug of phbSpeciesSlugs) {
        const species = SPECIES_TRAITS_MAP[slug];
        expect(species).toBeDefined();
        if (!species) {
          throw new Error(`Missing PHB species: ${slug}`);
        }
        for (const bonus of Object.values(species.abilityBonuses)) {
          expect(bonus).toBeGreaterThan(0);
        }
      }

      for (const species of Object.values(SPECIES_TRAITS_MAP)) {
        for (const bonus of Object.values(species.abilityBonuses)) {
          expect(bonus).toBeGreaterThan(0);
        }
      }

      const tusken = getSpeciesTraits('tusken');
      expect(tusken.name).toBe('Tusken');
      expect(tusken.abilityBonuses).toEqual({ con: 2, str: 1 });
      expect(tusken.languages).toContain('Tusken');

      const droidII = getSpeciesTraits('droid-class-ii');
      expect(droidII.size).toBe('Small');
      expect(droidII.speed).toBe(25);
      expect(droidII.abilityBonuses).toEqual({ int: 2, dex: 1 });

      const droidIV = getSpeciesTraits('droid-class-iv');
      expect(droidIV.darkvision).toBeUndefined();
      expect(droidIV.abilityBonuses).toEqual({ con: 2, str: 1 });

      const nautolan = getSpeciesTraits('nautolan');
      expect(nautolan.speed).toBe(35);
      expect(nautolan.abilityBonuses).toEqual({ dex: 2, wis: 1 });

      const gungan = getSpeciesTraits('gungan');
      expect(gungan.darkvision).toBe(60);
      expect(gungan.abilityBonuses).toEqual({ dex: 2, str: 1 });

      const togruta = getSpeciesTraits('togruta');
      expect(togruta.darkvision).toBe(60);
      expect(togruta.abilityBonuses).toEqual({ wis: 2, dex: 1 });
    });
  });

  describe('Background Benefits', () => {
    it('defines authentic background benefits', () => {
      expect(BACKGROUND_BENEFITS_MAP.jedi).toBeDefined();
      expect(BACKGROUND_BENEFITS_MAP.scoundrel).toBeDefined();
    });

    it('provides Jedi background with insight & lore skills and Temple Sanctuary', () => {
      const jedi = getBackgroundBenefits('jedi');
      expect(jedi.name).toBe('Jedi');
      expect(jedi.skills).toContain('insight');
      expect(jedi.skills).toContain('lore');
      expect(jedi.toolProficiency).toBe('Artificer’s Implements');
      expect(jedi.featureTitle).toBe('Temple Sanctuary');
    });

    it('provides Scoundrel background with deception & sleight_of_hand', () => {
      const scoundrel = getBackgroundBenefits('scoundrel');
      expect(scoundrel.skills).toContain('deception');
      expect(scoundrel.skills).toContain('sleight_of_hand');
      expect(scoundrel.toolProficiency).toBe('Disguise Kit');
    });

    it('provides Bounty Hunter with survival, investigation and Security Kit', () => {
      const bh = getBackgroundBenefits('bounty-hunter');
      expect(bh.skills).toContain('survival');
      expect(bh.skills).toContain('investigation');
      expect(bh.toolProficiency).toBe('Security Kit');
    });
  });

  describe('Class Specs & Proficiencies', () => {
    it('gives Fighter all armor, all shields, and martial weapons', () => {
      const fighter = CLASS_SPECS.fighter;
      expect(fighter.armorProficiencies).toContain('All Armor (Light, Medium, Heavy)');
      expect(fighter.armorProficiencies).toContain('All Shields (Light, Medium, Heavy)');
      expect(fighter.weaponProficiencies).toContain('All Vibroweapons');
      expect(fighter.weaponProficiencies).toContain('All Blasters');
      expect(fighter.weaponProficiencies).toContain('All Lightweapons');
      expect(fighter.skillChoiceCount).toBe(2);
    });

    it('gives Consular and Monk no armor proficiencies', () => {
      expect(CLASS_SPECS.consular.armorProficiencies).toEqual([]);
      expect(CLASS_SPECS.monk.armorProficiencies).toEqual([]);
    });

    it('gives Berserker light, medium armor and light, medium shields', () => {
      const berserker = CLASS_SPECS.berserker;
      expect(berserker.armorProficiencies).toContain('Light Armor');
      expect(berserker.armorProficiencies).toContain('Medium Armor');
      expect(berserker.armorProficiencies).toContain('Light Shields');
      expect(berserker.armorProficiencies).toContain('Medium Shields');
    });

    it('gives Operative 4 skill choices and expertise capabilities', () => {
      expect(CLASS_SPECS.operative.skillChoiceCount).toBe(4);
    });
  });

  describe('Full Class Level Progression (Levels 1-20)', () => {
    const classes = [
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
    ] as const;

    classes.forEach((classKey) => {
      it(`includes level 1-20 progression features for ${classKey}`, () => {
        const features = FULL_CLASS_LEVEL_FEATURES[classKey];
        expect(features.length).toBeGreaterThanOrEqual(15);

        const levels = features.map((f) => f.level);
        expect(levels).toContain(1);
        expect(levels).toContain(2);
        expect(levels).toContain(3); // Archetype level
        expect(levels).toContain(4); // ASI
        expect(levels).toContain(20); // Capstone
      });
    });
  });

  describe('Point Buy & Standard Array (SW5e Rules)', () => {
    it('defines 27 points budget and correct point buy costs', () => {
      expect(POINT_BUY_BUDGET).toBe(27);
      expect(POINT_BUY_COST[8]).toBe(0);
      expect(POINT_BUY_COST[9]).toBe(1);
      expect(POINT_BUY_COST[10]).toBe(2);
      expect(POINT_BUY_COST[11]).toBe(3);
      expect(POINT_BUY_COST[12]).toBe(4);
      expect(POINT_BUY_COST[13]).toBe(5);
      expect(POINT_BUY_COST[14]).toBe(7);
      expect(POINT_BUY_COST[15]).toBe(9);
    });

    it('calculates 0 points spent for baseline 8s', () => {
      const allEights = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
      expect(calculatePointBuySpent(allEights)).toBe(0);
    });

    it('calculates exactly 27 points spent for standard array (15, 14, 13, 12, 10, 8)', () => {
      expect(STANDARD_ARRAY).toEqual([15, 14, 13, 12, 10, 8]);
      const standardArrayScores = {
        str: STANDARD_ARRAY[0],
        dex: STANDARD_ARRAY[1],
        con: STANDARD_ARRAY[2],
        int: STANDARD_ARRAY[3],
        wis: STANDARD_ARRAY[4],
        cha: STANDARD_ARRAY[5],
      };
      // 9 + 7 + 5 + 4 + 2 + 0 = 27
      expect(calculatePointBuySpent(standardArrayScores)).toBe(27);
    });

    it('calculates 27 points spent for 15, 15, 15, 8, 8, 8', () => {
      const three15s = { str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 };
      // 9 + 9 + 9 + 0 + 0 + 0 = 27
      expect(calculatePointBuySpent(three15s)).toBe(27);
    });
  });

  describe('Known Powers Progression', () => {
    it('calculates known powers for Consular across levels (SW5e PHB Ch. 3)', () => {
      expect(getMaxKnownPowers('consular', 1)).toBe(9);
      expect(getMaxKnownPowers('consular', 2)).toBe(11);
      expect(getMaxKnownPowers('consular', 3)).toBe(13);
      expect(getMaxKnownPowers('consular', 4)).toBe(15);
      expect(getMaxKnownPowers('consular', 20)).toBe(40);
    });

    it('calculates Scout techcasting starting at level 2 (0 at level 1, 4 at level 2)', () => {
      expect(getMaxKnownPowers('scout', 1)).toBe(0);
      expect(getMaxKnownPowers('scout', 2)).toBe(4);
      expect(getMaxKnownPowers('scout', 3)).toBe(5);
      expect(getMaxKnownPowers('scout', 4)).toBe(6);
    });

    it('calculates Guardian & Sentinel force powers known at level 1', () => {
      expect(getMaxKnownPowers('guardian', 1)).toBe(4);
      expect(getMaxKnownPowers('sentinel', 1)).toBe(7);
      expect(getMaxKnownPowers('engineer', 1)).toBe(6);
    });

    it('returns 0 known powers for non-casters (berserker, operative, fighter)', () => {
      expect(getMaxKnownPowers('berserker', 1)).toBe(0);
      expect(getMaxKnownPowers('operative', 5)).toBe(0);
      expect(getMaxKnownPowers('fighter', 20)).toBe(0);
    });
  });

  describe('Backgrounds Feat & Tool Synchronization', () => {
    it('ensures every background defines a valid defaultFeatId and toolProficiency', () => {
      const backgroundKeys = Object.keys(BACKGROUND_BENEFITS_MAP);
      expect(backgroundKeys.length).toBeGreaterThanOrEqual(20);

      backgroundKeys.forEach((key) => {
        const bg = BACKGROUND_BENEFITS_MAP[key]!;
        expect(bg.defaultFeatId).toBeDefined();
        expect(bg.defaultFeatId.length).toBeGreaterThan(0);
        expect(bg.toolProficiency).toBeDefined();
        expect(bg.skills.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('returns defaultFeatId from getBackgroundBenefits', () => {
      const bountyHunter = getBackgroundBenefits('bounty-hunter');
      expect(bountyHunter.defaultFeatId).toBe('sw5e:core:feat:threatening');
      expect(bountyHunter.toolProficiency).toBe('Security Kit');

      const jedi = getBackgroundBenefits('jedi');
      expect(jedi.defaultFeatId).toBe('sw5e:core:feat:force-sensitive');
      expect(jedi.toolProficiency).toBe('Artificer’s Implements');
    });

    it('uses only canonical SW5e tool proficiencies across all 20 backgrounds', () => {
      Object.values(BACKGROUND_BENEFITS_MAP).forEach((bg) => {
        expect(SW5E_TOOL_PROFICIENCIES).toContain(bg.toolProficiency);
        expect(bg.toolProficiency).not.toMatch(/Thieves|Herbalism|Navigator|Tracker|Chemist’s Supplies/i);
      });
    });
  });

  describe('Personality Tables & Class Roleplay Guides (SW5e PHB)', () => {
    it('provides PHB personality traits, ideals, bonds, and flaws for all 20 backgrounds', () => {
      const bgKeys = Object.keys(BACKGROUND_BENEFITS_MAP);
      bgKeys.forEach((slug) => {
        const table = BACKGROUND_PERSONALITY_MAP[slug];
        expect(table).toBeDefined();
        expect(table!.personalityTraits.length).toBeGreaterThanOrEqual(6);
        expect(table!.ideals.length).toBeGreaterThanOrEqual(6);
        expect(table!.bonds.length).toBeGreaterThanOrEqual(6);
        expect(table!.flaws.length).toBeGreaterThanOrEqual(6);
      });
    });

    it('provides roleplay guides for all 10 SW5e classes', () => {
      const classKeys = Object.keys(CLASS_SPECS) as (keyof typeof CLASS_SPECS)[];
      classKeys.forEach((ck) => {
        const guide = CLASS_ROLEPLAY_GUIDES[ck];
        expect(guide).toBeDefined();
        expect(guide.suggestedTraits.length).toBeGreaterThanOrEqual(1);
        expect(guide.suggestedIdeals.length).toBeGreaterThanOrEqual(1);
        expect(guide.suggestedBonds.length).toBeGreaterThanOrEqual(1);
        expect(guide.suggestedFlaws.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Character PDF HTML Export', () => {
    it('renders complete escaped HTML with portrait, custom background, stats, and equipment', () => {
      const details = characterDataSchema.parse({
        avatarUri: 'data:image/png;base64,FAKEIMG',
        classKey: 'sentinel',
        speciesId: 'sw5e:core:species:twilek',
        speciesName: "Twi'lek",
        backgroundId: 'custom',
        backgroundName: 'Nar Shaddaa Runner',
        customBackground: {
          name: 'Nar Shaddaa Runner',
          skills: ['stealth', 'deception'],
          tools: ['Security Kit'],
          languages: ['Huttese'],
          featureTitle: 'Shadow Contacts',
          featureDescription: 'You know every fence in the lower levels.',
        },
        credits: 450,
        characteristics: {
          personalityTraits: 'Always watching the exits.',
          ideals: 'Freedom above all.',
          bonds: 'My crew.',
          flaws: 'Too reckless <script>alert(1)</script>',
        },
      });

      const html = generateCharacterPdfHtml({
        name: 'Vex <Korr>',
        levelTotal: 3,
        details,
        ac: 15,
        maxHp: 24,
        maxForcePoints: 6,
        maxTechPoints: 0,
        knownPowers: [],
        feats: [],
      });

      expect(html).toContain('Vex &lt;Korr&gt;');
      expect(html).toContain('data:image/png;base64,FAKEIMG');
      expect(html).toContain('Nar Shaddaa Runner');
      expect(html).toContain('Shadow Contacts');
      expect(html).toContain('450 CR');
      expect(html).toContain('PASSIVE WISDOM (PERCEPTION)');
      expect(html).toContain('DEATH SAVES');
      expect(html).toContain('WEAPONS &amp; AMMUNITIONS');
      expect(html).toContain('COMBAT FEATURES');
      expect(html).toContain('CHARACTER DATA');
      expect(html).toContain('CARRYING CAPACITY');
      expect(html).toContain('AT-WILL');
      expect(html).toContain('TECH SAVE DC:');
      expect(html).not.toContain('<script>alert(1)</script>');
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });
});
