import {
  SW5E_WEAPONS,
  calculateWeaponCombatStats,
  findWeaponDefinition,
  isCharacterProficientWithWeapon,
} from './weapons';

describe('SW5e Canonical Weapons Catalog & Mechanics (PHB Ch. 5)', () => {
  describe('Weapon Catalog Integrity', () => {
    it('defines exactly 69 canonical SW5e weapons across 6 categories', () => {
      expect(SW5E_WEAPONS).toHaveLength(69);

      const simpleBlasters = SW5E_WEAPONS.filter((w) => w.category === 'simple_blaster');
      const martialBlasters = SW5E_WEAPONS.filter((w) => w.category === 'martial_blaster');
      const simpleLight = SW5E_WEAPONS.filter((w) => w.category === 'simple_lightweapon');
      const martialLight = SW5E_WEAPONS.filter((w) => w.category === 'martial_lightweapon');
      const simpleVibro = SW5E_WEAPONS.filter((w) => w.category === 'simple_vibroweapon');
      const martialVibro = SW5E_WEAPONS.filter((w) => w.category === 'martial_vibroweapon');

      expect(simpleBlasters).toHaveLength(14);
      expect(martialBlasters).toHaveLength(20);
      expect(simpleLight).toHaveLength(4);
      expect(martialLight).toHaveLength(9);
      expect(simpleVibro).toHaveLength(7);
      expect(martialVibro).toHaveLength(15);
    });

    it('each weapon has valid cost, weight, damage dice, and damage type', () => {
      for (const w of SW5E_WEAPONS) {
        expect(w.slug).toBeTruthy();
        expect(w.name).toBeTruthy();
        expect(w.cost).toBeGreaterThanOrEqual(0);
        expect(w.weight).toBeGreaterThanOrEqual(0);
        if (w.damageDice !== '—') {
          expect(w.damageDice).toMatch(/^\d+d\d+$/);
          expect(['energy', 'kinetic', 'ion']).toContain(w.damageType);
        } else {
          expect(w.damageDice).toBe('—');
        }
        expect(Array.isArray(w.properties)).toBe(true);
      }
    });
  });

  describe('findWeaponDefinition', () => {
    it('finds weapons by exact name or slug', () => {
      const carbine = findWeaponDefinition('Blaster Carbine');
      expect(carbine).toBeDefined();
      expect(carbine?.category).toBe('simple_blaster');
      expect(carbine?.damageDice).toBe('1d6');
      expect(carbine?.damageType).toBe('energy');

      const bySlug = findWeaponDefinition('blaster-carbine');
      expect(bySlug).toEqual(carbine);
    });

    it('accurately distinguishes Vibroblade vs Vibrosword', () => {
      const blade = findWeaponDefinition('Vibroblade');
      expect(blade?.category).toBe('martial_vibroweapon');
      expect(blade?.damageDice).toBe('1d8');
      expect(blade?.versatileDice).toBe('1d10');
      expect(blade?.twoHanded).toBeFalsy();

      const sword = findWeaponDefinition('Vibrosword');
      expect(sword?.category).toBe('martial_vibroweapon');
      expect(sword?.damageDice).toBe('2d6');
      expect(sword?.twoHanded).toBe(true);
      expect(sword?.properties).toContain('dexterity 11');
    });

    it('accurately distinguishes Simple Lightsaber vs Martial Lightsaber', () => {
      const simpleLs = findWeaponDefinition('Simple Lightsaber');
      expect(simpleLs?.category).toBe('simple_lightweapon');
      expect(simpleLs?.damageDice).toBe('1d6');
      expect(simpleLs?.versatileDice).toBe('1d8');

      const martialLs = findWeaponDefinition('Martial Lightsaber');
      expect(martialLs?.category).toBe('martial_lightweapon');
      expect(martialLs?.damageDice).toBe('1d8');
      expect(martialLs?.versatileDice).toBe('1d10');

      // Generic "Lightsaber" resolves to the simple lightsaber (PHB Simple Lightweapons: Lightsaber 1d6)
      const generic = findWeaponDefinition('Lightsaber');
      expect(generic?.damageDice).toBe('1d6');
      expect(generic?.versatileDice).toBe('1d8');
    });

    it('identifies Blaster Pistol as Martial Blaster and Light Pistol as Simple Blaster', () => {
      const pistol = findWeaponDefinition('Blaster Pistol');
      expect(pistol?.category).toBe('martial_blaster');
      expect(pistol?.damageDice).toBe('1d6');

      const lightPistol = findWeaponDefinition('Light Pistol');
      expect(lightPistol?.category).toBe('simple_blaster');
      expect(lightPistol?.damageDice).toBe('1d4');
    });
  });

  describe('isCharacterProficientWithWeapon', () => {
    it('matches universal weapon groups', () => {
      expect(
        isCharacterProficientWithWeapon(['All Blasters'], {
          name: 'Blaster Pistol',
          category: 'martial_blaster',
        }),
      ).toBe(true);

      expect(
        isCharacterProficientWithWeapon(['All Vibroweapons'], {
          name: 'Vibrosword',
          category: 'martial_vibroweapon',
        }),
      ).toBe(true);

      expect(
        isCharacterProficientWithWeapon(['All Lightweapons'], {
          name: 'Martial Lightsaber',
          category: 'martial_lightweapon',
        }),
      ).toBe(true);
    });

    it('matches specific categories', () => {
      const consularProfs = ['Simple Lightweapons', 'Simple Vibroweapons'];
      expect(
        isCharacterProficientWithWeapon(consularProfs, {
          name: 'Shotosaber',
          category: 'simple_lightweapon',
        }),
      ).toBe(true);
      expect(
        isCharacterProficientWithWeapon(consularProfs, {
          name: 'Vibrodagger',
          category: 'simple_vibroweapon',
        }),
      ).toBe(true);
      expect(
        isCharacterProficientWithWeapon(consularProfs, {
          name: 'Martial Lightsaber',
          category: 'martial_lightweapon',
        }),
      ).toBe(false);
      expect(
        isCharacterProficientWithWeapon(consularProfs, {
          name: 'Blaster Carbine',
          category: 'simple_blaster',
        }),
      ).toBe(false);
    });

    it('matches specific weapon names', () => {
      const customProfs = ['Vibrosword', 'Blaster Pistol'];
      expect(isCharacterProficientWithWeapon(customProfs, { name: 'Vibrosword' })).toBe(true);
      expect(isCharacterProficientWithWeapon(customProfs, { name: 'Blaster Pistol' })).toBe(true);
      expect(isCharacterProficientWithWeapon(customProfs, { name: 'Heavy Repeating Blaster' })).toBe(
        false,
      );
    });
  });

  describe('calculateWeaponCombatStats', () => {
    it('uses DEX for ranged blasters even if STR is higher', () => {
      const stats = calculateWeaponCombatStats({
        scores: { str: 16, dex: 14 }, // STR mod +3, DEX mod +2
        profBonus: 2,
        weaponProficiencies: ['Simple Blasters'],
        weapon: {
          name: 'Blaster Carbine',
          damageDice: '1d6',
          damageType: 'energy',
          ranged: true,
        },
      });

      expect(stats.abilityUsed).toBe('dex');
      expect(stats.isProficient).toBe(true);
      expect(stats.toHit).toBe(4); // DEX mod (+2) + prof (+2)
      expect(stats.damageModifier).toBe(2); // DEX mod (+2)
      expect(stats.damageFormula).toBe('1d6+2');
      expect(stats.heavyBonus).toBe(0);
    });

    it('uses higher ability (DEX) for finesse melee weapon', () => {
      const stats = calculateWeaponCombatStats({
        scores: { str: 10, dex: 16 }, // STR 0, DEX +3
        profBonus: 2,
        weaponProficiencies: ['All Vibroweapons'],
        weapon: {
          name: 'Vibrorapier',
          finesse: true,
          damageDice: '1d8',
          damageType: 'kinetic',
        },
      });

      expect(stats.abilityUsed).toBe('dex');
      expect(stats.toHit).toBe(5); // +3 DEX + 2 prof
      expect(stats.damageModifier).toBe(3);
      expect(stats.damageFormula).toBe('1d8+3');
    });

    it('applies SW5e Heavy rule (+half STR mod rounded up, min 1) on STR attacks', () => {
      const stats = calculateWeaponCombatStats({
        scores: { str: 16, dex: 10 }, // STR mod +3 (half rounded up is +2)
        profBonus: 2,
        weaponProficiencies: ['Martial Vibroweapons'],
        weapon: {
          name: 'Vibroaxe', // Heavy weapon
          damageDice: '1d10',
          damageType: 'kinetic',
        },
      });

      expect(stats.abilityUsed).toBe('str');
      expect(stats.heavyBonus).toBe(2); // ceil(3 / 2) = 2
      expect(stats.damageModifier).toBe(5); // 3 (STR) + 2 (Heavy)
      expect(stats.toHit).toBe(5); // 3 (STR) + 2 (prof)
      expect(stats.damageFormula).toBe('1d10+5');
    });

    it('does not add proficiency bonus to toHit if character is not proficient', () => {
      const stats = calculateWeaponCombatStats({
        scores: { str: 14, dex: 10 }, // STR mod +2
        profBonus: 3,
        weaponProficiencies: ['Simple Vibroweapons'],
        weapon: {
          name: 'Vibrosword', // Martial weapon, not proficient
          damageDice: '2d6',
          damageType: 'kinetic',
        },
      });

      expect(stats.isProficient).toBe(false);
      expect(stats.toHit).toBe(2); // Only STR mod (+2), no prof bonus (+3)
    });

    it('factors enhancementBonus into toHit and damageFormula', () => {
      const stats = calculateWeaponCombatStats({
        scores: { str: 14, dex: 10 },
        profBonus: 2,
        weaponProficiencies: ['Martial Lightweapons'],
        weapon: {
          name: 'Martial Lightsaber',
          damageDice: '1d8',
          damageType: 'energy',
          enhancementBonus: 1, // +1 weapon
        },
      });

      expect(stats.toHit).toBe(5); // 2 STR + 2 prof + 1 enh
      expect(stats.damageModifier).toBe(3); // 2 STR + 1 enh
      expect(stats.damageFormula).toBe('1d8+3');
    });
  });
});
