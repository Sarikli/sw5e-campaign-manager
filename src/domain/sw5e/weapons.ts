/**
 * SW5e Canonical Weapons Catalog & Mechanics (PHB Chapter 5, pp. 175–178)
 *
 * Covers all 69 official SW5e weapons across the 6 core categories:
 * - Simple Blasters (14)
 * - Martial Blasters (20)
 * - Simple Lightweapons (4)
 * - Martial Lightweapons (9)
 * - Simple Vibroweapons (7)
 * - Martial Vibroweapons (15)
 *
 * Implements pure domain mechanics: proficiency check, attack roll, damage roll,
 * and SW5e-specific rules (Heavy bonus, Finesse, Ranged DEX, Versatile).
 */

export type WeaponCategory =
  | 'simple_blaster'
  | 'martial_blaster'
  | 'simple_lightweapon'
  | 'martial_lightweapon'
  | 'simple_vibroweapon'
  | 'martial_vibroweapon';

export type WeaponDamageType = 'energy' | 'kinetic' | 'ion';

export interface WeaponDefinition {
  slug: string;
  name: string;
  category: WeaponCategory;
  cost: number;
  weight: number;
  damageDice: string;
  damageType?: WeaponDamageType;
  properties: string[];
  finesse: boolean;
  ranged: boolean;
  versatileDice?: string;
  doubleDice?: string;
  heavy?: boolean;
  twoHanded?: boolean;
  light?: boolean;
  luminous?: boolean;
}

export const SW5E_WEAPONS: readonly WeaponDefinition[] = [
  // ================= 1. SIMPLE BLASTERS (14) =================
  {
    slug: 'blaster-carbine',
    name: 'Blaster Carbine',
    category: 'simple_blaster',
    cost: 300,
    weight: 8,
    damageDice: '1d6',
    damageType: 'energy',
    properties: ['ammunition (range 60/240)', 'reload 16', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'bowcaster',
    name: 'Bowcaster',
    category: 'simple_blaster',
    cost: 400,
    weight: 16,
    damageDice: '1d10',
    damageType: 'energy',
    properties: ['ammunition (range 50/200)', 'burst 4', 'reload 4', 'strength 11', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'hold-out',
    name: 'Hold-out Blaster',
    category: 'simple_blaster',
    cost: 250,
    weight: 1,
    damageDice: '1d4',
    damageType: 'energy',
    properties: ['ammunition (range 30/120)', 'hidden', 'light', 'reload 6'],
    finesse: false,
    ranged: true,
    light: true,
  },
  {
    slug: 'ion-carbine',
    name: 'Ion Carbine',
    category: 'simple_blaster',
    cost: 300,
    weight: 8,
    damageDice: '1d3',
    damageType: 'ion',
    properties: ['ammunition (range 60/240)', 'reload 16', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'light-pistol',
    name: 'Light Pistol',
    category: 'simple_blaster',
    cost: 350,
    weight: 2,
    damageDice: '1d4',
    damageType: 'energy',
    properties: ['ammunition (range 40/160)', 'light', 'reload 12'],
    finesse: false,
    ranged: true,
    light: true,
  },
  {
    slug: 'light-repeater',
    name: 'Light Repeater',
    category: 'simple_blaster',
    cost: 900,
    weight: 12,
    damageDice: '1d6',
    damageType: 'energy',
    properties: ['ammunition (range 60/240)', 'auto', 'burst 8', 'reload 16', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'light-slugpistol',
    name: 'Light Slugpistol',
    category: 'simple_blaster',
    cost: 250,
    weight: 2,
    damageDice: '1d4',
    damageType: 'kinetic',
    properties: ['ammunition (range 40/160)', 'hidden', 'light', 'reload 8'],
    finesse: false,
    ranged: true,
    light: true,
  },
  {
    slug: 'needler',
    name: 'Needler',
    category: 'simple_blaster',
    cost: 275,
    weight: 3,
    damageDice: '1d4',
    damageType: 'kinetic',
    properties: ['ammunition (range 40/160)', 'rapid 10', 'reload 20', 'special'],
    finesse: false,
    ranged: true,
  },
  {
    slug: 'scattergun',
    name: 'Scattergun',
    category: 'simple_blaster',
    cost: 200,
    weight: 3,
    damageDice: '1d6',
    damageType: 'kinetic',
    properties: ['ammunition (range 20/80)', 'burst 4', 'reload 4'],
    finesse: false,
    ranged: true,
  },
  {
    slug: 'shotgun',
    name: 'Shotgun',
    category: 'simple_blaster',
    cost: 350,
    weight: 12,
    damageDice: '2d4',
    damageType: 'kinetic',
    properties: ['ammunition (range 30/120)', 'burst 2', 'reload 4', 'strength 11', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'slugpistol',
    name: 'Slugpistol',
    category: 'simple_blaster',
    cost: 100,
    weight: 3,
    damageDice: '1d6',
    damageType: 'kinetic',
    properties: ['ammunition (range 40/160)', 'rapid 8', 'reload 16', 'strength 11'],
    finesse: false,
    ranged: true,
  },
  {
    slug: 'tranquilizer-rifle',
    name: 'Tranquilizer Rifle',
    category: 'simple_blaster',
    cost: 200,
    weight: 10,
    damageDice: '1d4',
    damageType: 'kinetic',
    properties: ['ammunition (range 100/400)', 'reload 4', 'two-handed', 'special'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'wristblaster',
    name: 'Wristblaster',
    category: 'simple_blaster',
    cost: 250,
    weight: 1,
    damageDice: '1d4',
    damageType: 'energy',
    properties: ['ammunition (range 30/120)', 'disguised', 'fixed', 'light', 'reload 12'],
    finesse: false,
    ranged: true,
    light: true,
  },
  {
    slug: 'wrist-launcher',
    name: 'Wrist Launcher',
    category: 'simple_blaster',
    cost: 450,
    weight: 1,
    damageDice: '—',
    properties: ['ammunition (range 30/120)', 'fixed', 'reload 1', 'special'],
    finesse: false,
    ranged: true,
  },

  // ================= 2. MARTIAL BLASTERS (20) =================
  {
    slug: 'assault-cannon',
    name: 'Assault Cannon',
    category: 'martial_blaster',
    cost: 500,
    weight: 24,
    damageDice: '1d10',
    damageType: 'energy',
    properties: ['ammunition (range 80/320)', 'burst 4', 'reload 8', 'strength 11', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'blaster-cannon',
    name: 'Blaster Cannon',
    category: 'martial_blaster',
    cost: 1600,
    weight: 36,
    damageDice: '1d12',
    damageType: 'energy',
    properties: ['ammunition (range 100/400)', 'auto', 'burst 2', 'reload 4', 'strength 15', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'blaster-pistol',
    name: 'Blaster Pistol',
    category: 'martial_blaster',
    cost: 200,
    weight: 3,
    damageDice: '1d6',
    damageType: 'energy',
    properties: ['ammunition (range 40/160)', 'reload 16'],
    finesse: false,
    ranged: true,
  },
  {
    slug: 'blaster-rifle',
    name: 'Blaster Rifle',
    category: 'martial_blaster',
    cost: 400,
    weight: 11,
    damageDice: '1d8',
    damageType: 'energy',
    properties: ['ammunition (range 100/400)', 'burst 4', 'reload 12', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'carbine-rifle',
    name: 'Carbine Rifle',
    category: 'martial_blaster',
    cost: 800,
    weight: 10,
    damageDice: '1d8',
    damageType: 'energy',
    properties: ['ammunition (range 80/320)', 'auto', 'rapid 3', 'reload 12', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'chaingun',
    name: 'Chaingun',
    category: 'martial_blaster',
    cost: 1500,
    weight: 42,
    damageDice: '1d10',
    damageType: 'energy',
    properties: ['ammunition (range 60/240)', 'auto', 'rapid 6', 'reload 12', 'strength 15', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'cycler-rifle',
    name: 'Cycler Rifle',
    category: 'martial_blaster',
    cost: 450,
    weight: 10,
    damageDice: '1d8',
    damageType: 'kinetic',
    properties: ['ammunition (range 100/400)', 'rapid 2', 'reload 8', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'heavy-bowcaster',
    name: 'Heavy Bowcaster',
    category: 'martial_blaster',
    cost: 1100,
    weight: 26,
    damageDice: '1d12',
    damageType: 'energy',
    properties: ['ammunition (range 60/240)', 'burst 4', 'reload 8', 'strength 15', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'heavy-pistol',
    name: 'Heavy Pistol',
    category: 'martial_blaster',
    cost: 300,
    weight: 4,
    damageDice: '1d8',
    damageType: 'energy',
    properties: ['ammunition (range 40/160)', 'reload 12', 'strength 11'],
    finesse: false,
    ranged: true,
  },
  {
    slug: 'heavy-repeater',
    name: 'Heavy Repeater',
    category: 'martial_blaster',
    cost: 1200,
    weight: 16,
    damageDice: '2d4',
    damageType: 'energy',
    properties: ['ammunition (range 80/320)', 'auto', 'burst 4', 'rapid 2', 'reload 8', 'strength 15', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'heavy-shotgun',
    name: 'Heavy Shotgun',
    category: 'martial_blaster',
    cost: 400,
    weight: 16,
    damageDice: '2d4',
    damageType: 'kinetic',
    properties: ['ammunition (range 30/120)', 'burst 4', 'reload 12', 'strength 13', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'heavy-slugpistol',
    name: 'Heavy Slugpistol',
    category: 'martial_blaster',
    cost: 750,
    weight: 5,
    damageDice: '1d8',
    damageType: 'kinetic',
    properties: ['ammunition (range 40/160)', 'rapid 2', 'reload 8', 'strength 13'],
    finesse: false,
    ranged: true,
  },
  {
    slug: 'hunting-rifle',
    name: 'Hunting Rifle',
    category: 'martial_blaster',
    cost: 600,
    weight: 12,
    damageDice: '1d12',
    damageType: 'kinetic',
    properties: ['ammunition (range 150/600)', 'reload 2', 'strength 13', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'ion-pistol',
    name: 'Ion Pistol',
    category: 'martial_blaster',
    cost: 200,
    weight: 3,
    damageDice: '1d3',
    damageType: 'ion',
    properties: ['ammunition (range 40/160)', 'reload 16'],
    finesse: false,
    ranged: true,
  },
  {
    slug: 'ion-rifle',
    name: 'Ion Rifle',
    category: 'martial_blaster',
    cost: 400,
    weight: 11,
    damageDice: '1d4',
    damageType: 'ion',
    properties: ['ammunition (range 100/400)', 'reload 12', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'repeating-blaster',
    name: 'Repeating Blaster',
    category: 'martial_blaster',
    cost: 1200,
    weight: 18,
    damageDice: '2d4',
    damageType: 'energy',
    properties: ['ammunition (range 80/320)', 'auto', 'burst 4', 'rapid 4', 'reload 8', 'strength 13', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'revolver',
    name: 'Revolver',
    category: 'martial_blaster',
    cost: 750,
    weight: 4,
    damageDice: '1d8',
    damageType: 'kinetic',
    properties: ['ammunition (range 30/120)', 'rapid 6', 'reload 6', 'strength 11'],
    finesse: false,
    ranged: true,
  },
  {
    slug: 'slugthrower',
    name: 'Slugthrower',
    category: 'martial_blaster',
    cost: 350,
    weight: 14,
    damageDice: '1d8',
    damageType: 'kinetic',
    properties: ['ammunition (range 100/400)', 'burst 6', 'reload 12', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'sniper-rifle',
    name: 'Sniper Rifle',
    category: 'martial_blaster',
    cost: 750,
    weight: 12,
    damageDice: '1d12',
    damageType: 'energy',
    properties: ['ammunition (range 150/600)', 'reload 2', 'strength 13', 'two-handed'],
    finesse: false,
    ranged: true,
    twoHanded: true,
  },
  {
    slug: 'subrepeater',
    name: 'Subrepeater',
    category: 'martial_blaster',
    cost: 1200,
    weight: 4,
    damageDice: '1d6',
    damageType: 'energy',
    properties: ['ammunition (range 30/120)', 'auto', 'rapid 8', 'light', 'reload 16'],
    finesse: false,
    ranged: true,
    light: true,
  },

  // ================= 3. SIMPLE LIGHTWEAPONS (4) =================
  {
    slug: 'lightclub',
    name: 'Lightclub',
    category: 'simple_lightweapon',
    cost: 150,
    weight: 5,
    damageDice: '1d10',
    damageType: 'energy',
    properties: ['luminous', 'two-handed'],
    finesse: false,
    ranged: false,
    twoHanded: true,
    luminous: true,
  },
  {
    slug: 'lightdagger',
    name: 'Lightdagger',
    category: 'simple_lightweapon',
    cost: 100,
    weight: 1,
    damageDice: '1d4',
    damageType: 'energy',
    properties: ['finesse', 'hidden', 'light', 'luminous', 'thrown (range 20/60)'],
    finesse: true,
    ranged: false,
    light: true,
    luminous: true,
  },
  {
    slug: 'lightsaber',
    name: 'Lightsaber',
    category: 'simple_lightweapon',
    cost: 200,
    weight: 3,
    damageDice: '1d6',
    damageType: 'energy',
    properties: ['hidden', 'luminous', 'versatile (1d8)'],
    finesse: false,
    ranged: false,
    luminous: true,
    versatileDice: '1d8',
  },
  {
    slug: 'shotosaber',
    name: 'Shotosaber',
    category: 'simple_lightweapon',
    cost: 500,
    weight: 2,
    damageDice: '1d6',
    damageType: 'energy',
    properties: ['finesse', 'hidden', 'light', 'luminous'],
    finesse: true,
    ranged: false,
    light: true,
    luminous: true,
  },

  // ================= 4. MARTIAL LIGHTWEAPONS (9) =================
  {
    slug: 'doublesaber',
    name: 'Doublesaber',
    category: 'martial_lightweapon',
    cost: 1400,
    weight: 4,
    damageDice: '1d8',
    damageType: 'energy',
    properties: ['double (1d8 energy)', 'finesse', 'luminous', 'two-handed'],
    finesse: true,
    ranged: false,
    twoHanded: true,
    luminous: true,
    doubleDice: '1d8',
  },
  {
    slug: 'doubleshoto',
    name: 'Doubleshoto',
    category: 'martial_lightweapon',
    cost: 1250,
    weight: 4,
    damageDice: '1d6',
    damageType: 'energy',
    properties: ['double (1d6 energy)', 'finesse', 'light', 'luminous', 'two-handed'],
    finesse: true,
    ranged: false,
    light: true,
    twoHanded: true,
    luminous: true,
    doubleDice: '1d6',
  },
  {
    slug: 'greatsaber',
    name: 'Greatsaber',
    category: 'martial_lightweapon',
    cost: 1000,
    weight: 4,
    damageDice: '2d6',
    damageType: 'energy',
    properties: ['dexterity 11', 'heavy', 'luminous', 'two-handed'],
    finesse: false,
    ranged: false,
    heavy: true,
    twoHanded: true,
    luminous: true,
  },
  {
    slug: 'lightfoil',
    name: 'Lightfoil',
    category: 'martial_lightweapon',
    cost: 500,
    weight: 2,
    damageDice: '1d8',
    damageType: 'energy',
    properties: ['finesse', 'hidden', 'luminous'],
    finesse: true,
    ranged: false,
    luminous: true,
  },
  {
    slug: 'light-ring',
    name: 'Light Ring',
    category: 'martial_lightweapon',
    cost: 500,
    weight: 3,
    damageDice: '1d6',
    damageType: 'energy',
    properties: ['finesse', 'hidden', 'luminous', 'returning', 'thrown (range 30/90)'],
    finesse: true,
    ranged: false,
    luminous: true,
  },
  {
    slug: 'lightsaber-pike',
    name: 'Lightsaber Pike',
    category: 'martial_lightweapon',
    cost: 400,
    weight: 6,
    damageDice: '1d10',
    damageType: 'energy',
    properties: ['dexterity 11', 'luminous', 'reach', 'two-handed'],
    finesse: false,
    ranged: false,
    twoHanded: true,
    luminous: true,
  },
  {
    slug: 'martial-lightsaber',
    name: 'Martial Lightsaber',
    category: 'martial_lightweapon',
    cost: 300,
    weight: 2,
    damageDice: '1d8',
    damageType: 'energy',
    properties: ['hidden', 'luminous', 'versatile (1d10)'],
    finesse: false,
    ranged: false,
    luminous: true,
    versatileDice: '1d10',
  },
  {
    slug: 'saberspear',
    name: 'Saberspear',
    category: 'martial_lightweapon',
    cost: 450,
    weight: 2,
    damageDice: '2d4',
    damageType: 'energy',
    properties: ['luminous'],
    finesse: false,
    ranged: false,
    luminous: true,
  },
  {
    slug: 'saberwhip',
    name: 'Saberwhip',
    category: 'martial_lightweapon',
    cost: 300,
    weight: 2,
    damageDice: '1d4',
    damageType: 'energy',
    properties: ['finesse', 'hidden', 'luminous', 'reach'],
    finesse: true,
    ranged: false,
    luminous: true,
  },

  // ================= 5. SIMPLE VIBROWEAPONS (7) =================
  {
    slug: 'techaxe',
    name: 'Techaxe',
    category: 'simple_vibroweapon',
    cost: 75,
    weight: 2,
    damageDice: '1d6',
    damageType: 'kinetic',
    properties: ['light', 'thrown (range 20/60)'],
    finesse: false,
    ranged: false,
    light: true,
  },
  {
    slug: 'vibrodagger',
    name: 'Vibrodagger',
    category: 'simple_vibroweapon',
    cost: 50,
    weight: 1,
    damageDice: '1d4',
    damageType: 'kinetic',
    properties: ['finesse', 'light', 'thrown (range 20/60)'],
    finesse: true,
    ranged: false,
    light: true,
  },
  {
    slug: 'vibrodart',
    name: 'Vibrodart',
    category: 'simple_vibroweapon',
    cost: 5,
    weight: 0.25,
    damageDice: '1d4',
    damageType: 'kinetic',
    properties: ['finesse', 'special', 'thrown (range 20/60)'],
    finesse: true,
    ranged: false,
  },
  {
    slug: 'vibroknuckler',
    name: 'Vibroknuckler',
    category: 'simple_vibroweapon',
    cost: 60,
    weight: 2,
    damageDice: '1d6',
    damageType: 'kinetic',
    properties: ['hidden', 'light'],
    finesse: false,
    ranged: false,
    light: true,
  },
  {
    slug: 'vibromace',
    name: 'Vibromace',
    category: 'simple_vibroweapon',
    cost: 80,
    weight: 12,
    damageDice: '1d8',
    damageType: 'kinetic',
    properties: ['heavy', 'two-handed'],
    finesse: false,
    ranged: false,
    heavy: true,
    twoHanded: true,
  },
  {
    slug: 'vibrostaff',
    name: 'Vibrostaff',
    category: 'simple_vibroweapon',
    cost: 100,
    weight: 4,
    damageDice: '1d6',
    damageType: 'kinetic',
    properties: ['versatile (2d4)'],
    finesse: false,
    ranged: false,
    versatileDice: '2d4',
  },
  {
    slug: 'vibrospear',
    name: 'Vibrospear',
    category: 'simple_vibroweapon',
    cost: 120,
    weight: 3,
    damageDice: '1d6',
    damageType: 'kinetic',
    properties: ['thrown (range 20/60)', 'versatile (1d8)'],
    finesse: false,
    ranged: false,
    versatileDice: '1d8',
  },

  // ================= 6. MARTIAL VIBROWEAPONS (15) =================
  {
    slug: 'chakram',
    name: 'Chakram',
    category: 'martial_vibroweapon',
    cost: 250,
    weight: 3,
    damageDice: '1d6',
    damageType: 'kinetic',
    properties: ['finesse', 'returning', 'thrown (range 30/90)'],
    finesse: true,
    ranged: false,
  },
  {
    slug: 'doubleblade',
    name: 'Doubleblade',
    category: 'martial_vibroweapon',
    cost: 625,
    weight: 5,
    damageDice: '1d6',
    damageType: 'kinetic',
    properties: ['double (1d6 kinetic)', 'finesse', 'light', 'two-handed'],
    finesse: true,
    ranged: false,
    light: true,
    twoHanded: true,
    doubleDice: '1d6',
  },
  {
    slug: 'doublesword',
    name: 'Doublesword',
    category: 'martial_vibroweapon',
    cost: 700,
    weight: 5,
    damageDice: '1d8',
    damageType: 'kinetic',
    properties: ['double (1d8 kinetic)', 'finesse', 'two-handed'],
    finesse: true,
    ranged: false,
    twoHanded: true,
    doubleDice: '1d8',
  },
  {
    slug: 'hidden-blade',
    name: 'Hidden Blade',
    category: 'martial_vibroweapon',
    cost: 200,
    weight: 1,
    damageDice: '1d4',
    damageType: 'kinetic',
    properties: ['finesse', 'fixed', 'hidden', 'light'],
    finesse: true,
    ranged: false,
    light: true,
  },
  {
    slug: 'net',
    name: 'Net',
    category: 'martial_vibroweapon',
    cost: 100,
    weight: 3,
    damageDice: '—',
    properties: ['light', 'finesse', 'special', 'thrown (range 15)'],
    finesse: true,
    ranged: false,
    light: true,
  },
  {
    slug: 'techblade',
    name: 'Techblade',
    category: 'martial_vibroweapon',
    cost: 250,
    weight: 3,
    damageDice: '1d6',
    damageType: 'kinetic',
    properties: ['finesse', 'light'],
    finesse: true,
    ranged: false,
    light: true,
  },
  {
    slug: 'techstaff',
    name: 'Techstaff',
    category: 'martial_vibroweapon',
    cost: 600,
    weight: 8,
    damageDice: '2d4',
    damageType: 'kinetic',
    properties: ['double (2d4 kinetic)', 'two-handed'],
    finesse: false,
    ranged: false,
    twoHanded: true,
    doubleDice: '2d4',
  },
  {
    slug: 'vibroaxe',
    name: 'Vibroaxe',
    category: 'martial_vibroweapon',
    cost: 300,
    weight: 11,
    damageDice: '1d10',
    damageType: 'kinetic',
    properties: ['dexterity 11', 'heavy', 'two-handed', 'brutal 1'],
    finesse: false,
    ranged: false,
    heavy: true,
    twoHanded: true,
  },
  {
    slug: 'vibrobaton',
    name: 'Vibrobaton',
    category: 'martial_vibroweapon',
    cost: 225,
    weight: 4,
    damageDice: '2d4',
    damageType: 'kinetic',
    properties: [],
    finesse: false,
    ranged: false,
  },
  {
    slug: 'vibroblade',
    name: 'Vibroblade',
    category: 'martial_vibroweapon',
    cost: 150,
    weight: 2,
    damageDice: '1d8',
    damageType: 'kinetic',
    properties: ['versatile (1d10)'],
    finesse: false,
    ranged: false,
    versatileDice: '1d10',
  },
  {
    slug: 'vibrolance',
    name: 'Vibrolance',
    category: 'martial_vibroweapon',
    cost: 100,
    weight: 6,
    damageDice: '1d12',
    damageType: 'kinetic',
    properties: ['reach', 'special'],
    finesse: false,
    ranged: false,
  },
  {
    slug: 'vibropike',
    name: 'Vibropike',
    category: 'martial_vibroweapon',
    cost: 200,
    weight: 6,
    damageDice: '1d10',
    damageType: 'kinetic',
    properties: ['dexterity 11', 'reach', 'two-handed'],
    finesse: false,
    ranged: false,
    twoHanded: true,
  },
  {
    slug: 'vibrorapier',
    name: 'Vibrorapier',
    category: 'martial_vibroweapon',
    cost: 250,
    weight: 2,
    damageDice: '1d8',
    damageType: 'kinetic',
    properties: ['finesse'],
    finesse: true,
    ranged: false,
  },
  {
    slug: 'vibrosword',
    name: 'Vibrosword',
    category: 'martial_vibroweapon',
    cost: 500,
    weight: 6,
    damageDice: '2d6',
    damageType: 'kinetic',
    properties: ['dexterity 11', 'two-handed'],
    finesse: false,
    ranged: false,
    twoHanded: true,
  },
  {
    slug: 'vibrowhip',
    name: 'Vibrowhip',
    category: 'martial_vibroweapon',
    cost: 150,
    weight: 3,
    damageDice: '1d4',
    damageType: 'kinetic',
    properties: ['finesse', 'reach'],
    finesse: true,
    ranged: false,
  },
];

export const WEAPONS_BY_SLUG: Readonly<Record<string, WeaponDefinition>> = Object.freeze(
  SW5E_WEAPONS.reduce<Record<string, WeaponDefinition>>((acc, w) => {
    acc[w.slug] = w;
    return acc;
  }, {}),
);

/**
 * Finds a weapon definition by name, slug, or content ID.
 */
export function findWeaponDefinition(nameOrSlug: string): WeaponDefinition | undefined {
  const norm = nameOrSlug.toLowerCase().trim().replace(/^sw5e:(core:)?weapon:/, '');
  if (norm === 'simple lightsaber' || norm === 'simple-lightsaber') {
    return WEAPONS_BY_SLUG['lightsaber'];
  }
  if (norm === 'martial lightsaber' || norm === 'martial-lightsaber') {
    return WEAPONS_BY_SLUG['martial-lightsaber'];
  }
  if (WEAPONS_BY_SLUG[norm]) return WEAPONS_BY_SLUG[norm];
  return SW5E_WEAPONS.find(
    (w) => w.slug === norm || w.name.toLowerCase() === norm,
  );
}

/**
 * Checks if a character is proficient with a weapon according to SW5e rules.
 */
export function isCharacterProficientWithWeapon(
  proficiencies: readonly string[] | undefined,
  weapon: { name: string; category?: string; slug?: string },
): boolean {
  if (!proficiencies || proficiencies.length === 0) return false;
  const list = proficiencies.map((p) => p.toLowerCase().trim());
  const wName = weapon.name.toLowerCase().trim();
  const def = findWeaponDefinition(weapon.slug || weapon.name);
  const wCat = (weapon.category || def?.category || '').toLowerCase().trim();

  // 1. Direct name match (e.g. 'vibrorapier', 'techblade', 'lightsaber')
  if (list.includes(wName)) return true;
  if (def && list.includes(def.name.toLowerCase())) return true;
  if (def && list.includes(def.slug)) return true;

  // 2. Universal group proficiencies (e.g. 'All Blasters', 'All Vibroweapons', 'All Lightweapons')
  if (wCat.includes('blaster') && list.includes('all blasters')) return true;
  if (wCat.includes('vibroweapon') && list.includes('all vibroweapons')) return true;
  if (wCat.includes('lightweapon') && list.includes('all lightweapons')) return true;

  // 3. Category match
  if (wCat === 'simple_blaster' && (list.includes('simple blasters') || list.includes('all blasters'))) return true;
  if (wCat === 'martial_blaster' && (list.includes('martial blasters') || list.includes('all blasters'))) return true;

  if (wCat === 'simple_lightweapon' && (list.includes('simple lightweapons') || list.includes('all lightweapons'))) return true;
  if (wCat === 'martial_lightweapon' && (list.includes('martial lightweapons') || list.includes('all lightweapons'))) return true;

  if (wCat === 'simple_vibroweapon' && (list.includes('simple vibroweapons') || list.includes('all vibroweapons'))) return true;
  if (wCat === 'martial_vibroweapon' && (list.includes('martial vibroweapons') || list.includes('all vibroweapons'))) return true;

  return false;
}

export interface WeaponCombatStats {
  isProficient: boolean;
  toHit: number;
  damageDice: string;
  damageModifier: number;
  damageFormula: string;
  damageType: string;
  abilityUsed: 'str' | 'dex';
  isRanged: boolean;
  isFinesse: boolean;
  heavyBonus: number;
  versatileDice?: string;
  doubleDice?: string;
}

/**
 * Computes exact attack and damage roll stats for an equipped weapon in SW5e.
 * Enforces:
 * - DEX for ranged, STR for melee, max(STR, DEX) for finesse.
 * - Proficiency bonus only if proficient.
 * - SW5e Heavy property: +half STR mod (min +1) on STR hits.
 */
export function calculateWeaponCombatStats(params: {
  scores: { str: number; dex: number };
  profBonus: number;
  weaponProficiencies: readonly string[];
  weapon: {
    name: string;
    damageDice?: string;
    damageType?: string;
    finesse?: boolean;
    ranged?: boolean;
    enhancementBonus?: number;
    properties?: string[];
  };
}): WeaponCombatStats {
  const { scores, profBonus, weaponProficiencies, weapon } = params;
  const def = findWeaponDefinition(weapon.name);

  const isRanged = Boolean(weapon.ranged || def?.ranged || def?.category.includes('blaster'));
  const isFinesse = Boolean(
    weapon.finesse ||
      def?.finesse ||
      weapon.properties?.some((p) => p.toLowerCase().includes('finesse')),
  );
  const isHeavy = Boolean(
    def?.heavy || weapon.properties?.some((p) => p.toLowerCase().includes('heavy')),
  );

  const strMod = Math.floor((scores.str - 10) / 2);
  const dexMod = Math.floor((scores.dex - 10) / 2);

  let abilityUsed: 'str' | 'dex';
  let abilityMod: number;

  if (isRanged) {
    abilityUsed = 'dex';
    abilityMod = dexMod;
  } else if (isFinesse) {
    if (dexMod > strMod) {
      abilityUsed = 'dex';
      abilityMod = dexMod;
    } else {
      abilityUsed = 'str';
      abilityMod = strMod;
    }
  } else {
    abilityUsed = 'str';
    abilityMod = strMod;
  }

  const isProficient = isCharacterProficientWithWeapon(weaponProficiencies, {
    name: weapon.name,
    category: def?.category,
    slug: def?.slug,
  });

  const enhance = weapon.enhancementBonus ?? 0;
  const toHit = abilityMod + (isProficient ? profBonus : 0) + enhance;

  // SW5e Heavy rule: "When you hit with an attack roll using Strength with this weapon,
  // you deal additional damage equal to half your Strength modifier (rounded up, minimum of +1)."
  const heavyBonus = isHeavy && abilityUsed === 'str' ? Math.max(1, Math.ceil(strMod / 2)) : 0;

  const totalDmgMod = abilityMod + heavyBonus + enhance;
  const dice = weapon.damageDice || def?.damageDice || '1d8';
  const dmgModStr = totalDmgMod === 0 ? '' : totalDmgMod > 0 ? `+${totalDmgMod}` : `${totalDmgMod}`;
  const damageFormula = `${dice}${dmgModStr}`;

  return {
    isProficient,
    toHit,
    damageDice: dice,
    damageModifier: totalDmgMod,
    damageFormula,
    damageType: weapon.damageType || def?.damageType || 'kinetic',
    abilityUsed,
    isRanged,
    isFinesse,
    heavyBonus,
    versatileDice: def?.versatileDice,
    doubleDice: def?.doubleDice,
  };
}
