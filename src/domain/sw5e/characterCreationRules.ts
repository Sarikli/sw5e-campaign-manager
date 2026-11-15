/**
 * Canonical SW5e Character Creation Rules, Species Traits, Background Benefits,
 * and Level 1-20 Class Features Progression.
 * Pure TypeScript domain module (zero React / React Native / Expo imports).
 * Derived from the official SW5e Player's Handbook (PHB Chapters 1-4).
 */
import type { AbilityKey, ClassKey, SkillKey } from './constants';

export interface SpeciesTraitEntry {
  name: string;
  description: string;
}

export interface SpeciesTraits {
  slug: string;
  name: string;
  size: 'Medium' | 'Small';
  speed: number;
  climbSpeed?: number;
  swimSpeed?: number;
  darkvision?: number;
  abilityBonuses: Partial<Record<AbilityKey, number>>;
  inherentSkills: SkillKey[];
  languages: string[];
  traits: SpeciesTraitEntry[];
  /** True for Human or species with flexible +2/+1 or skill of choice */
  hasFlexibleSkillChoice?: boolean;
  hasFlexibleAsi?: boolean;
}

export interface BackgroundBenefits {
  slug: string;
  name: string;
  skills: SkillKey[];
  toolProficiency: string;
  featureTitle: string;
  featureDescription: string;
  defaultFeatName: string;
  defaultFeatId: string;
}

export interface ClassLevelFeatureEntry {
  level: number;
  title: string;
  description: string;
  hasChoice?: boolean;
  choiceCount?: number;
  archetypeChoice?: boolean;
}

/**
 * Verified canonical species traits for all 30 SW5e Core Species (PHB Chapter 2).
 */
export const SPECIES_TRAITS_MAP: Record<string, SpeciesTraits> = {
  human: {
    slug: 'human',
    name: 'Human',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { str: 2, con: 1, cha: 1 },
    inherentSkills: [],
    languages: ['Galactic Basic'],
    hasFlexibleSkillChoice: true,
    hasFlexibleAsi: true,
    traits: [
      {
        name: 'Ability Score Increase',
        description: 'One ability score of your choice increases by 2, and two other ability scores of your choice each increase by 1.',
      },
      {
        name: 'Defiant',
        description: 'You have advantage on one attack roll, ability check, or saving throw. Once you use this trait, you cannot use it again until you finish a short or long rest.',
      },
      {
        name: 'Proficiency',
        description: 'You gain proficiency in one skill of your choice.',
      },
    ],
  },
  bith: {
    slug: 'bith',
    name: 'Bith',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { int: 2, dex: 1 },
    inherentSkills: ['investigation', 'perception'],
    languages: ['Galactic Basic', 'Bith'],
    traits: [
      {
        name: 'Detail Oriented',
        description: 'You are practiced at scouring for details. You have advantage on Intelligence (Investigation) checks within 5 feet.',
      },
      {
        name: 'Keen Hearing and Smell',
        description: 'You have advantage on Wisdom (Perception) checks that involve hearing or smell.',
      },
      {
        name: 'Programmer',
        description: 'Whenever you make an Intelligence (Technology) check related to computers, you have expertise in the Technology skill.',
      },
    ],
  },
  bothan: {
    slug: 'bothan',
    name: 'Bothan',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { int: 2, dex: 1 },
    inherentSkills: ['deception', 'stealth'],
    languages: ['Galactic Basic', 'Bothese'],
    traits: [
      {
        name: 'Naturally Stealthy',
        description: 'You can attempt to hide even when you are obscured only by a creature that is your size or larger than you.',
      },
      {
        name: 'Nimble Escape',
        description: 'You can take the Disengage or Hide action as a bonus action on each of your turns.',
      },
      {
        name: 'Shrewd',
        description: 'You have advantage on Wisdom (Insight) checks against Deception.',
      },
    ],
  },
  cathar: {
    slug: 'cathar',
    name: 'Cathar',
    size: 'Medium',
    speed: 30,
    climbSpeed: 20,
    darkvision: 60,
    abilityBonuses: { dex: 2, cha: 1 },
    inherentSkills: ['perception', 'stealth'],
    languages: ['Galactic Basic', 'Catharese'],
    traits: [
      {
        name: 'Cat’s Claws',
        description: 'Your claws deal 1d4 kinetic damage on unarmed strikes and give you a climbing speed of 20 feet.',
      },
      {
        name: 'Darkvision',
        description: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.',
      },
    ],
  },
  cerean: {
    slug: 'cerean',
    name: 'Cerean',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { int: 2, wis: 1 },
    inherentSkills: ['lore', 'insight'],
    languages: ['Galactic Basic', 'Cerean'],
    traits: [
      {
        name: 'Binary Brain',
        description: 'You have advantage on saving throws against effects that would charm you or make you fall asleep.',
      },
      {
        name: 'Dual Brain',
        description: 'You gain a +2 bonus to initiative checks and Wisdom (Perception) checks.',
      },
    ],
  },
  chiss: {
    slug: 'chiss',
    name: 'Chiss',
    size: 'Medium',
    speed: 30,
    darkvision: 60,
    abilityBonuses: { int: 2, cha: 1 },
    inherentSkills: ['perception', 'technology'],
    languages: ['Galactic Basic', 'Cheunh'],
    traits: [
      {
        name: 'Darkvision',
        description: 'You can see in dim light within 60 feet as if bright light, and darkness as dim light.',
      },
      {
        name: 'Tactician',
        description: 'You have advantage on Intelligence checks to assess military tactics and troop movements.',
      },
    ],
  },
  devaronian: {
    slug: 'devaronian',
    name: 'Devaronian',
    size: 'Medium',
    speed: 30,
    darkvision: 60,
    abilityBonuses: { con: 2, cha: 1 },
    inherentSkills: ['deception', 'persuasion'],
    languages: ['Galactic Basic', 'Devaronese'],
    traits: [
      {
        name: 'Darkvision',
        description: 'Accustomed to twilight, you can see in dim light within 60 feet as bright light.',
      },
      {
        name: 'Two Toxins',
        description: 'You have advantage on saving throws against poison and resistance against poison damage.',
      },
    ],
  },
  'droid-class-i': {
    slug: 'droid-class-i',
    name: 'Droid (Class I)',
    size: 'Medium',
    speed: 25,
    abilityBonuses: { int: 2, wis: 1 },
    inherentSkills: ['lore', 'technology'],
    languages: ['Galactic Basic', 'Binary (Droidspeak)'],
    traits: [
      {
        name: 'Droid Resilience',
        description: 'You have advantage on saving throws against poison, and you have resistance against poison damage. You are immune to disease.',
      },
      {
        name: 'Maintenance Mode',
        description: 'Droids don’t need to sleep. Instead, you enter an inactive state for 4 hours each day.',
      },
    ],
  },
  'droid-class-ii': {
    slug: 'droid-class-ii',
    name: 'Droid (Class II)',
    size: 'Small',
    speed: 25,
    abilityBonuses: { int: 2, dex: 1 },
    inherentSkills: ['technology', 'investigation'],
    languages: ['Galactic Basic', 'Binary (Droidspeak)'],
    traits: [
      {
        name: 'Droid Resilience',
        description: 'Immune to disease, resistant to poison damage and advantage on saving throws against poison.',
      },
      {
        name: 'Technical Savant',
        description: 'You have advantage on Intelligence (Technology) checks to repair astromech systems and starships.',
      },
    ],
  },
  'droid-class-iii': {
    slug: 'droid-class-iii',
    name: 'Droid (Class III)',
    size: 'Medium',
    speed: 25,
    abilityBonuses: { cha: 2, int: 1 },
    inherentSkills: ['persuasion', 'insight'],
    languages: ['Galactic Basic', 'Binary (Droidspeak)', 'Bothese', 'Huttese'],
    traits: [
      {
        name: 'Polyglot',
        description: 'You can speak, read, and write four additional languages of your choice.',
      },
      {
        name: 'Diplomatic Protocol',
        description: 'You have advantage on Charisma (Persuasion) checks when mediating disputes.',
      },
    ],
  },
  'droid-class-iv': {
    slug: 'droid-class-iv',
    name: 'Droid (Class IV)',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { con: 2, str: 1 },
    inherentSkills: ['athletics', 'perception'],
    languages: ['Galactic Basic', 'Binary (Droidspeak)'],
    traits: [
      {
        name: 'Combat Protocol',
        description: 'You are proficient with all simple and martial vibroweapons and blasters.',
      },
      {
        name: 'Reinforced Plating',
        description: 'While you are not wearing armor, your AC equals 13 + your Dexterity modifier.',
      },
    ],
  },
  'droid-class-v': {
    slug: 'droid-class-v',
    name: 'Droid (Class V)',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { str: 2, con: 1 },
    inherentSkills: ['athletics'],
    languages: ['Galactic Basic', 'Binary (Droidspeak)'],
    traits: [
      {
        name: 'Heavy Duty Loader',
        description: 'Your carrying capacity and the weight you can push, drag, or lift is doubled.',
      },
    ],
  },
  duros: {
    slug: 'duros',
    name: 'Duros',
    size: 'Medium',
    speed: 30,
    darkvision: 60,
    abilityBonuses: { dex: 2, int: 1 },
    inherentSkills: ['piloting', 'technology'],
    languages: ['Galactic Basic', 'Durese'],
    traits: [
      {
        name: 'Born Pilot',
        description: 'You have proficiency in Piloting and advantage on checks made to navigate through hyperspace.',
      },
      {
        name: 'Darkvision',
        description: 'Your large red eyes allow you to see in dim light within 60 feet as bright light.',
      },
    ],
  },
  ewok: {
    slug: 'ewok',
    name: 'Ewok',
    size: 'Small',
    speed: 25,
    abilityBonuses: { dex: 2, con: 1 },
    inherentSkills: ['stealth', 'survival'],
    languages: ['Ewokese', 'Galactic Basic (understand only)'],
    traits: [
      {
        name: 'Keen Smell',
        description: 'You have advantage on Wisdom (Perception) checks that rely on smell.',
      },
      {
        name: 'Naturally Stealthy',
        description: 'You can attempt to hide even when obscured by a creature that is larger than you.',
      },
    ],
  },
  gamorrean: {
    slug: 'gamorrean',
    name: 'Gamorrean',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { str: 2, con: 1 },
    inherentSkills: ['athletics', 'intimidation'],
    languages: ['Gamorrese', 'Galactic Basic (understand only)'],
    traits: [
      {
        name: 'Thick Hide',
        description: 'While you are not wearing armor, your AC equals 12 + your Dexterity modifier.',
      },
      {
        name: 'Brutal Blows',
        description: 'When you score a critical hit with a melee weapon attack, you can roll one additional weapon damage die.',
      },
    ],
  },
  gungan: {
    slug: 'gungan',
    name: 'Gungan',
    size: 'Medium',
    speed: 30,
    swimSpeed: 30,
    darkvision: 60,
    abilityBonuses: { dex: 2, str: 1 },
    inherentSkills: ['athletics'],
    languages: ['Galactic Basic', 'Gungan'],
    traits: [
      {
        name: 'Amphibious',
        description: 'You can breathe both air and water, and you possess a swimming speed of 30 feet.',
      },
      {
        name: 'Extendable Tongue',
        description: 'You can manipulate small objects or disarm within 10 feet using your tongue.',
      },
    ],
  },
  ithorian: {
    slug: 'ithorian',
    name: 'Ithorian',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { cha: 2, wis: 1 },
    inherentSkills: ['nature', 'survival'],
    languages: ['Galactic Basic', 'Ithorese'],
    traits: [
      {
        name: 'Sonic Bellow',
        description: 'As an action, you can unleash a harsh bellow in a 15-foot cone dealing 2d6 sonic damage.',
      },
      {
        name: 'Iron Will',
        description: 'You have advantage on saving throws against being charmed or frightened.',
      },
    ],
  },
  jawa: {
    slug: 'jawa',
    name: 'Jawa',
    size: 'Small',
    speed: 25,
    darkvision: 60,
    abilityBonuses: { dex: 2, int: 1 },
    inherentSkills: ['technology'],
    languages: ['Jawaese', 'Galactic Basic (understand only)'],
    traits: [
      {
        name: 'Darkvision',
        description: 'Accustomed to living under hooded cloaks, you can see in dim light within 60 feet as bright light.',
      },
      {
        name: 'Grovel, Cower, and Beg',
        description: 'As an action, you can cower to distract nearby foes, granting your allies advantage on attack rolls against them.',
      },
      {
        name: 'Scavenger',
        description: 'You have advantage on checks made to salvage, repair, or appraise technology and scrap.',
      },
    ],
  },
  'kel-dor': {
    slug: 'kel-dor',
    name: 'Kel Dor',
    size: 'Medium',
    speed: 30,
    darkvision: 60,
    abilityBonuses: { wis: 2, dex: 1 },
    inherentSkills: ['insight', 'perception'],
    languages: ['Galactic Basic', 'Kel Dor'],
    traits: [
      {
        name: 'Antiox Mask',
        description: 'You require an antiox breath mask to survive in oxygen-rich environments.',
      },
      {
        name: 'Darkvision',
        description: 'You can see in dim light within 60 feet as bright light, and darkness as dim light.',
      },
      {
        name: 'Force-Sensitive Heritage',
        description: 'You know the Guidance force power and can cast it at will.',
      },
    ],
  },
  'mon-calamari': {
    slug: 'mon-calamari',
    name: 'Mon Calamari',
    size: 'Medium',
    speed: 30,
    swimSpeed: 30,
    darkvision: 60,
    abilityBonuses: { cha: 2, wis: 1 },
    inherentSkills: ['perception', 'piloting'],
    languages: ['Galactic Basic', 'Mon Calamarian'],
    traits: [
      {
        name: 'Amphibious',
        description: 'You can breathe both air and water, and you possess a swimming speed of 30 feet.',
      },
      {
        name: 'Darkvision',
        description: 'You can see in dim light within 60 feet as bright light, and in darkness as dim light.',
      },
      {
        name: 'Mon Calamari Polyglot',
        description: 'You learn two additional languages of your choice.',
      },
    ],
  },
  nautolan: {
    slug: 'nautolan',
    name: 'Nautolan',
    size: 'Medium',
    speed: 35,
    swimSpeed: 30,
    darkvision: 60,
    abilityBonuses: { dex: 2, wis: 1 },
    inherentSkills: ['athletics', 'perception'],
    languages: ['Galactic Basic', 'Nautila'],
    traits: [
      {
        name: 'Amphibious',
        description: 'You can breathe both air and water, and have a swimming speed of 30 feet.',
      },
      {
        name: 'Pheromone Sensors',
        description: 'Your head tentacles allow you to sense emotional changes and pheromones, giving advantage on Insight checks within 10 feet.',
      },
    ],
  },
  rodian: {
    slug: 'rodian',
    name: 'Rodian',
    size: 'Medium',
    speed: 30,
    darkvision: 60,
    abilityBonuses: { dex: 2, con: 1 },
    inherentSkills: ['stealth', 'survival'],
    languages: ['Galactic Basic', 'Rodese'],
    traits: [
      {
        name: 'Darkvision',
        description: 'Your large multifaceted eyes grant you vision in dim light within 60 feet as bright light.',
      },
      {
        name: 'Hunter’s Instinct',
        description: 'You have advantage on Wisdom (Survival) checks made to track humanoids.',
      },
    ],
  },
  'sith-pureblood': {
    slug: 'sith-pureblood',
    name: 'Sith Pureblood',
    size: 'Medium',
    speed: 30,
    darkvision: 60,
    abilityBonuses: { cha: 2, str: 1 },
    inherentSkills: ['intimidation', 'lore'],
    languages: ['Galactic Basic', 'Sith'],
    traits: [
      {
        name: 'Darkvision',
        description: 'You can see in dim light within 60 feet as bright light, and darkness as dim light.',
      },
      {
        name: 'Force Resonance',
        description: 'You know the Shock force power and can cast it at will.',
      },
    ],
  },
  togruta: {
    slug: 'togruta',
    name: 'Togruta',
    size: 'Medium',
    speed: 30,
    darkvision: 60,
    abilityBonuses: { wis: 2, dex: 1 },
    inherentSkills: ['perception', 'stealth'],
    languages: ['Galactic Basic', 'Togruti'],
    traits: [
      {
        name: 'Montrals (Echolocation)',
        description: 'Your hollow horns grant you blindsight out to 30 feet, provided you can hear.',
      },
      {
        name: 'Pack Hunter',
        description: 'You have advantage on attack rolls against a creature if at least one of your allies is within 5 feet of it and not incapacitated.',
      },
    ],
  },
  trandoshan: {
    slug: 'trandoshan',
    name: 'Trandoshan',
    size: 'Medium',
    speed: 30,
    darkvision: 60,
    abilityBonuses: { str: 2, wis: 1 },
    inherentSkills: ['athletics', 'survival'],
    languages: ['Galactic Basic', 'Dosh'],
    traits: [
      {
        name: 'Natural Armor',
        description: 'Your tough scaly hide provides natural protection. While unarmored, your AC equals 12 + your Dexterity modifier.',
      },
      {
        name: 'Regrowth',
        description: 'You can regenerate severed limbs and tails over the course of 2d4 days.',
      },
      {
        name: 'Claws',
        description: 'Your claws deal 1d4 kinetic damage on unarmed strikes.',
      },
    ],
  },
  tusken: {
    slug: 'tusken',
    name: 'Tusken',
    size: 'Medium',
    speed: 30,
    abilityBonuses: { con: 2, str: 1 },
    inherentSkills: ['survival', 'stealth'],
    languages: ['Galactic Basic', 'Tusken'],
    traits: [
      {
        name: 'Desert Survivalist',
        description: 'You can go twice as long without water and have advantage on saving throws against extreme heat.',
      },
      {
        name: 'Tusken Raider',
        description: 'You have proficiency with the gaderffii stick (martial vibroweapon) and cycler rifle (simple blaster).',
      },
    ],
  },
  twilek: {
    slug: 'twilek',
    name: 'Twi’lek',
    size: 'Medium',
    speed: 30,
    darkvision: 60,
    abilityBonuses: { cha: 2, dex: 1 },
    inherentSkills: ['deception', 'performance'],
    languages: ['Galactic Basic', 'Ryl', 'Lekku (Sign)'],
    traits: [
      {
        name: 'Darkvision',
        description: 'You can see in dim light within 60 feet as bright light, and darkness as dim light.',
      },
      {
        name: 'Elegant Artists',
        description: 'You have proficiency in the Performance and Deception skills.',
      },
    ],
  },
  ugnaught: {
    slug: 'ugnaught',
    name: 'Ugnaught',
    size: 'Small',
    speed: 25,
    darkvision: 60,
    abilityBonuses: { con: 2, int: 1 },
    inherentSkills: ['technology'],
    languages: ['Galactic Basic', 'Ugnaught'],
    traits: [
      {
        name: 'Mechanical Savant',
        description: 'Whenever you make an Intelligence (Technology) check to modify or repair industrial machinery, you add double your proficiency bonus.',
      },
    ],
  },
  weequay: {
    slug: 'weequay',
    name: 'Weequay',
    size: 'Medium',
    speed: 30,
    darkvision: 60,
    abilityBonuses: { cha: 2, con: 1 },
    inherentSkills: ['athletics', 'survival'],
    languages: ['Galactic Basic', 'Weequay'],
    traits: [
      {
        name: 'Tough Hide',
        description: 'Your leathery hide grants resistance to rough climate conditions and natural AC of 11 + Dexterity modifier while unarmored.',
      },
    ],
  },
  wookiee: {
    slug: 'wookiee',
    name: 'Wookiee',
    size: 'Medium',
    speed: 30,
    climbSpeed: 30,
    darkvision: 60,
    abilityBonuses: { str: 2, con: 1 },
    inherentSkills: ['athletics', 'intimidation'],
    languages: ['Shyriiwook', 'Galactic Basic (understand only)'],
    traits: [
      {
        name: 'Powerful Build',
        description: 'Your carrying capacity and the weight you can push, drag, or lift is doubled.',
      },
      {
        name: 'Treeclimber',
        description: 'You have a climbing speed of 30 feet and advantage on Athletics checks involving climbing.',
      },
      {
        name: 'Natural Armor',
        description: 'Your thick fur provides natural armor of 11 + Dexterity modifier while unarmored.',
      },
    ],
  },
  zabrak: {
    slug: 'zabrak',
    name: 'Zabrak',
    size: 'Medium',
    speed: 30,
    darkvision: 60,
    abilityBonuses: { con: 2, str: 1 },
    inherentSkills: ['intimidation', 'persuasion'],
    languages: ['Galactic Basic', 'Zabraki'],
    traits: [
      {
        name: 'Second Heart',
        description: 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. Recharges on a Long Rest.',
      },
      {
        name: 'Unarmed Combatant',
        description: 'Your unarmed strikes deal 1d4 kinetic damage using your choice of Strength or Dexterity.',
      },
    ],
  },
};

/**
 * Verified canonical benefits for all 20 SW5e Backgrounds (PHB Chapter 4).
 */
export const SW5E_TOOL_PROFICIENCIES: readonly string[] = [
  'Armormech’s Implements',
  'Armstech’s Implements',
  'Artificer’s Implements',
  'Artist’s Implements',
  'Astrotech’s Implements',
  'Biochemist’s Kit',
  'Biotech’s Implements',
  'Brewer’s Supplies',
  'Chef’s Kit',
  'Cybertech’s Implements',
  'Demolitionist’s Kit',
  'Disguise Kit',
  'Forgery Kit',
  'Gadgeteer’s Implements',
  'Gaming Set (Sabacc Deck)',
  'Gaming Set (Pazaak Deck)',
  'Gaming Set (Dejarik Set)',
  'Gaming Set (Chance Cubes)',
  'Mechanic’s Kit',
  'Musical Instrument',
  'Poisoner’s Kit',
  'Security Kit',
  'Slicer’s Kit',
  'Surveyor’s Implements',
  'Tinker’s Implements',
  'Toxicologist’s Kit',
] as const;

export const BACKGROUND_BENEFITS_MAP: Record<string, BackgroundBenefits> = {
  agent: {
    slug: 'agent',
    name: 'Agent',
    skills: ['deception', 'investigation'],
    toolProficiency: 'Disguise Kit',
    featureTitle: 'Safe Haven',
    featureDescription: 'You have access to a secret network of supporters and covert safe houses across the galaxy.',
    defaultFeatName: 'Silver-Tongued',
    defaultFeatId: 'sw5e:core:feat:silver-tongued',
  },
  'bounty-hunter': {
    slug: 'bounty-hunter',
    name: 'Bounty Hunter',
    skills: ['investigation', 'survival'],
    toolProficiency: 'Security Kit',
    featureTitle: 'Bounty Board Access',
    featureDescription: 'You can easily access Guild postings, underworld contracts, and bail bonds in any major port.',
    defaultFeatName: 'Threatening',
    defaultFeatId: 'sw5e:core:feat:threatening',
  },
  criminal: {
    slug: 'criminal',
    name: 'Criminal',
    skills: ['deception', 'stealth'],
    toolProficiency: 'Security Kit',
    featureTitle: 'Criminal Contact',
    featureDescription: 'You maintain a reliable contact who acts as your liaison to a network of underworld fences and smugglers.',
    defaultFeatName: 'Alert',
    defaultFeatId: 'sw5e:core:feat:alert',
  },
  entertainer: {
    slug: 'entertainer',
    name: 'Entertainer',
    skills: ['acrobatics', 'performance'],
    toolProficiency: 'Musical Instrument',
    featureTitle: 'By Popular Demand',
    featureDescription: 'You can always find a place to perform, securing free modest lodging and food in cantinas and theaters.',
    defaultFeatName: 'Charmer',
    defaultFeatId: 'sw5e:core:feat:charmer',
  },
  'force-adept': {
    slug: 'force-adept',
    name: 'Force Adept',
    skills: ['lore', 'insight'],
    toolProficiency: 'Artificer’s Implements',
    featureTitle: 'Mystic Sanctuary',
    featureDescription: 'Followers of the Force recognize your connection, offering shelter and knowledge in shrines and enclaves.',
    defaultFeatName: 'Force-Sensitive',
    defaultFeatId: 'sw5e:core:feat:force-sensitive',
  },
  gambler: {
    slug: 'gambler',
    name: 'Gambler',
    skills: ['deception', 'insight'],
    toolProficiency: 'Gaming Set (Sabacc Deck)',
    featureTitle: 'High Roller',
    featureDescription: 'You can always locate sabacc parlors, betting rings, and underground card tables in any civilized system.',
    defaultFeatName: 'Lucky',
    defaultFeatId: 'sw5e:core:feat:lucky',
  },
  investigator: {
    slug: 'investigator',
    name: 'Investigator',
    skills: ['investigation', 'perception'],
    toolProficiency: 'Disguise Kit',
    featureTitle: 'Official Inquiries',
    featureDescription: 'You can gain access to crime scenes, security archives, and precinct databases with proper badge presentation.',
    defaultFeatName: 'Observant',
    defaultFeatId: 'sw5e:core:feat:observant',
  },
  jedi: {
    slug: 'jedi',
    name: 'Jedi',
    skills: ['insight', 'lore'],
    toolProficiency: 'Artificer’s Implements',
    featureTitle: 'Temple Sanctuary',
    featureDescription: 'As a recognized initiate or knight of the Jedi Order, you can receive aid, healing, and records access at Jedi Enclaves.',
    defaultFeatName: 'Force-Sensitive',
    defaultFeatId: 'sw5e:core:feat:force-sensitive',
  },
  mandalorian: {
    slug: 'mandalorian',
    name: 'Mandalorian',
    skills: ['athletics', 'intimidation'],
    toolProficiency: 'Armormech’s Implements',
    featureTitle: 'Respect of the Resol’nare',
    featureDescription: 'Other Mandalorians recognize your beskar and sigil, granting you hospitality, repairs, and alliance among covert enclaves.',
    defaultFeatName: 'Weapon Expert',
    defaultFeatId: 'sw5e:core:feat:weapon-expert',
  },
  mercenary: {
    slug: 'mercenary',
    name: 'Mercenary',
    skills: ['athletics', 'intimidation'],
    toolProficiency: 'Gaming Set (Sabacc Deck)',
    featureTitle: 'Soldier of Fortune',
    featureDescription: 'You can find work with mercenary bands, private security firms, and local planetary defense militias.',
    defaultFeatName: 'Brawny',
    defaultFeatId: 'sw5e:core:feat:brawny',
  },
  noble: {
    slug: 'noble',
    name: 'Noble',
    skills: ['lore', 'persuasion'],
    toolProficiency: 'Gaming Set (Dejarik Set)',
    featureTitle: 'Position of Privilege',
    featureDescription: 'People are inclined to think the best of you, and you can secure audiences with planetary senators and aristocrats.',
    defaultFeatName: 'Inspiring Leader',
    defaultFeatId: 'sw5e:core:feat:inspiring-leader',
  },
  nomad: {
    slug: 'nomad',
    name: 'Nomad',
    skills: ['nature', 'survival'],
    toolProficiency: 'Surveyor’s Implements',
    featureTitle: 'Wayfarer',
    featureDescription: 'You can guide travelers safely through wild terrain and find food and freshwater for up to six individuals daily.',
    defaultFeatName: 'Mobile',
    defaultFeatId: 'sw5e:core:feat:mobile',
  },
  outlaw: {
    slug: 'outlaw',
    name: 'Outlaw',
    skills: ['intimidation', 'sleight_of_hand'],
    toolProficiency: 'Security Kit',
    featureTitle: 'Wanted Renown',
    featureDescription: 'Criminals recognize your reputation and give you wide berth or offer safe passage through lawless sectors.',
    defaultFeatName: 'Threatening',
    defaultFeatId: 'sw5e:core:feat:threatening',
  },
  pirate: {
    slug: 'pirate',
    name: 'Pirate',
    skills: ['athletics', 'piloting'],
    toolProficiency: 'Astrotech’s Implements',
    featureTitle: 'Bad Reputation',
    featureDescription: 'In dockside towns and shadowports, people fear your crew’s name and won’t report minor infractions to the authorities.',
    defaultFeatName: 'Brawny',
    defaultFeatId: 'sw5e:core:feat:brawny',
  },
  scientist: {
    slug: 'scientist',
    name: 'Scientist',
    skills: ['investigation', 'technology'],
    toolProficiency: 'Biochemist’s Kit',
    featureTitle: 'Peer Review & Lab Access',
    featureDescription: 'You have credentials accepted by scientific institutes, granting access to laboratories, databases, and research archives.',
    defaultFeatName: 'Techie',
    defaultFeatId: 'sw5e:core:feat:techie',
  },
  scoundrel: {
    slug: 'scoundrel',
    name: 'Scoundrel',
    skills: ['deception', 'sleight_of_hand'],
    toolProficiency: 'Disguise Kit',
    featureTitle: 'Faro Contact',
    featureDescription: 'You can quickly sniff out who runs the gray markets, illegal swoop tracks, and pawnshops on any space station.',
    defaultFeatName: 'Silver-Tongued',
    defaultFeatId: 'sw5e:core:feat:silver-tongued',
  },
  sith: {
    slug: 'sith',
    name: 'Sith',
    skills: ['intimidation', 'lore'],
    toolProficiency: 'Artificer’s Implements',
    featureTitle: 'Fear and Dominion',
    featureDescription: 'Citizens cowed by the Sith Empire or acolytes of the dark side obey your commands out of genuine terror.',
    defaultFeatName: 'Force-Sensitive',
    defaultFeatId: 'sw5e:core:feat:force-sensitive',
  },
  smuggler: {
    slug: 'smuggler',
    name: 'Smuggler',
    skills: ['deception', 'piloting'],
    toolProficiency: 'Forgery Kit',
    featureTitle: 'Secret Cargo Cache',
    featureDescription: 'You know hidden compartments, unmonitored docking bays, and bribery rates for customs inspectors across the hyperspace lanes.',
    defaultFeatName: 'Ace Pilot',
    defaultFeatId: 'sw5e:core:feat:ace-pilot',
  },
  soldier: {
    slug: 'soldier',
    name: 'Soldier',
    skills: ['athletics', 'intimidation'],
    toolProficiency: 'Gaming Set (Pazaak Deck)',
    featureTitle: 'Military Rank',
    featureDescription: 'You have a military rank from your career. Soldiers of the same faction defer to your authority and you gain base access.',
    defaultFeatName: 'Weapon Expert',
    defaultFeatId: 'sw5e:core:feat:weapon-expert',
  },
  spacer: {
    slug: 'spacer',
    name: 'Spacer',
    skills: ['piloting', 'technology'],
    toolProficiency: 'Mechanic’s Kit',
    featureTitle: 'Well-Traveled',
    featureDescription: 'You know the major trade corridors, ship architectures, and hyperlane beacons of every civilized sector.',
    defaultFeatName: 'Ace Pilot',
    defaultFeatId: 'sw5e:core:feat:ace-pilot',
  },
};

/**
 * Full Level 1-20 Class Features for all 10 SW5e Classes (PHB Chapter 3).
 */
export const FULL_CLASS_LEVEL_FEATURES: Record<ClassKey, readonly ClassLevelFeatureEntry[]> = {
  berserker: [
    { level: 1, title: 'Berserker Rage', description: 'In battle, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action, gaining advantage on Strength checks/saving throws, bonus melee weapon damage (+2 to +4), and resistance to kinetic and energy damage.' },
    { level: 1, title: 'Unarmored Defense (Berserker)', description: 'While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit.' },
    { level: 2, title: 'Reckless Attack', description: 'When you make your first attack on your turn, you can throw aside all concern for defense to attack recklessly, gaining advantage on melee weapon attack rolls using Strength, but attacks against you have advantage until your next turn.' },
    { level: 2, title: 'Danger Sense', description: 'You gain an uncanny sense of when things nearby aren’t as they should be, giving you advantage on Dexterity saving throws against effects that you can see, such as traps and powers.' },
    { level: 3, title: 'Berserker Approach (Archetype)', description: 'Choose an approach that shapes the nature of your rage: Ballistic, Marauder, or Warchief. You gain features at 3rd, 6th, 10th, and 14th level.', hasChoice: true, choiceCount: 1, archetypeChoice: true },
    { level: 4, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 5, title: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    { level: 5, title: 'Fast Movement', description: 'Your speed increases by 10 feet while you aren’t wearing heavy armor.' },
    { level: 6, title: 'Mindless Rage', description: 'You can’t be charmed or frightened while raging. If you are charmed or frightened when you enter your rage, the effect is suspended for the duration of the rage.' },
    { level: 7, title: 'Feral Instinct', description: 'Your instincts are so honed that you have advantage on initiative rolls, and you can act normally on your first turn even if surprised.' },
    { level: 8, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 9, title: 'Brutal Critical (1 die)', description: 'You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee weapon attack.' },
    { level: 10, title: 'Intimidating Presence', description: 'You can use your action to frighten someone with your menacing presence, forcing a Wisdom saving throw or becoming frightened until the end of your next turn.' },
    { level: 11, title: 'Relentless Rage', description: 'Your rage can keep you fighting despite grievous wounds. If you drop to 0 hit points while raging, you can make a DC 10 Constitution saving throw to drop to 1 hit point instead.' },
    { level: 12, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 13, title: 'Brutal Critical (2 dice)', description: 'You roll two additional weapon damage dice on critical hits.' },
    { level: 14, title: 'Approach Feature', description: 'You unlock your capstone subclass ability from your chosen Berserker Approach.' },
    { level: 15, title: 'Persistent Rage', description: 'Your rage is so fierce that it ends early only if you fall unconscious or if you choose to end it.' },
    { level: 16, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 17, title: 'Brutal Critical (3 dice)', description: 'You roll three additional weapon damage dice on critical hits.' },
    { level: 18, title: 'Indomitable Might', description: 'If your total for a Strength check is less than your Strength score, you can use that score in place of the total.' },
    { level: 19, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 20, title: 'Primal Champion', description: 'You embody the power of the wilds. Your Strength and Constitution scores increase by 4. Your maximum for those scores is now 24.' },
  ],
  consular: [
    { level: 1, title: 'Forcecasting (Full Caster)', description: 'You gain 4 Force Points per Consular level + Force modifier. You learn Force powers scaling from At-Will up to 9th-level.' },
    { level: 1, title: 'Force Recovery', description: 'Once per day on a Short Rest, you can recover Force Points equal to half your Consular level + Force modifier.' },
    { level: 2, title: 'Force-Empowered Casting', description: 'Twist powers to suit your needs: Careful, Distant, Extended, Heightened, Quickened, or Twinned Power.', hasChoice: true, choiceCount: 2 },
    { level: 2, title: 'Force Shield', description: 'As a reaction when attacked, add your Forcecasting modifier to your AC until the start of your next turn.' },
    { level: 3, title: 'Force Affinity', description: 'Choose your attunement: Ashla (light healing boost), Bendu (bonus points), or Bogan (dark damage rerolls).' },
    { level: 3, title: 'Consular Tradition (Archetype)', description: 'Commit to a Tradition: Way of Lightning, Way of the Sage, Way of Suggestion, or Way of Telekinesis.', hasChoice: true, choiceCount: 1, archetypeChoice: true },
    { level: 4, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 6, title: 'Tradition Feature', description: 'You gain your 6th-level Consular Tradition feature.' },
    { level: 8, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 10, title: 'Tradition Feature & Empowered Casting', description: 'You gain your 10th-level Tradition feature and learn an additional Force-Empowered Casting option.' },
    { level: 12, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 14, title: 'Tradition Feature', description: 'You gain your 14th-level Consular Tradition feature.' },
    { level: 16, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 17, title: 'Empowered Casting Option', description: 'You learn an additional Force-Empowered Casting option.' },
    { level: 18, title: 'Tradition Feature', description: 'You gain your 18th-level Consular Tradition pinnacle feature.' },
    { level: 19, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 20, title: 'One with the Force', description: 'Your Wisdom or Charisma score increases by 4 (max 24), and you gain mastery over a signature 3rd-level Force power to cast freely once per short rest.' },
  ],
  engineer: [
    { level: 1, title: 'Techcasting (Full Caster)', description: 'You gain 2 Tech Points per level + INT modifier to cast tech powers from your wristpad up to 9th-level.' },
    { level: 1, title: 'Potent Aptitude (d6)', description: 'You can bolster allies or hinder enemies with a d6 Potent Aptitude die, usable INT mod times per long rest.' },
    { level: 2, title: 'Infuse Item', description: 'Imbue ordinary objects with specialized temporary engineering enhancements.' },
    { level: 2, title: 'Tool Expertise', description: 'Your proficiency bonus is doubled for any ability check you make that uses your tech toolkit or specialist’s kit.' },
    { level: 3, title: 'Engineering Discipline (Archetype)', description: 'Choose your engineering discipline: Armormech, Armastech, Gadgeteer, or Astrotech.', hasChoice: true, choiceCount: 1, archetypeChoice: true },
    { level: 4, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 5, title: 'Potent Aptitude (d8)', description: 'Your Potent Aptitude die increases to a d8.' },
    { level: 6, title: 'Discipline Feature', description: 'You gain your 6th-level Engineering Discipline feature.' },
    { level: 7, title: 'Flash of Genius', description: 'You can add your Intelligence modifier to an ability check or saving throw made by you or an ally within 30 feet as a reaction.' },
    { level: 8, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 9, title: 'Potent Aptitude (d10)', description: 'Your Potent Aptitude die increases to a d10.' },
    { level: 10, title: 'Discipline Feature', description: 'You gain your 10th-level Engineering Discipline feature.' },
    { level: 11, title: 'Overload Tech', description: 'You can expend tech points to cause an overload in targeted electronics, blinding or shocking enemies.' },
    { level: 12, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 13, title: 'Potent Aptitude (d12)', description: 'Your Potent Aptitude die increases to a d12.' },
    { level: 14, title: 'Discipline Feature', description: 'You gain your 14th-level Engineering Discipline feature.' },
    { level: 16, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 18, title: 'Discipline Feature', description: 'You gain your 18th-level Engineering Discipline feature.' },
    { level: 19, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 20, title: 'Tech Mastery', description: 'Your Intelligence score increases by 4 (max 24). You gain mastery over emergency field repairs and instantaneous reboot protocols.' },
  ],
  fighter: [
    { level: 1, title: 'Fighting Style', description: 'Adopt a specialized combat style: Brawler, Defense, Dueling, Great Weapon, Sharpshooter, or Two-Weapon Fighting.', hasChoice: true, choiceCount: 1 },
    { level: 1, title: 'Second Wind', description: 'You have a limited well of stamina that you can draw on to protect yourself. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level.' },
    { level: 2, title: 'Action Surge (1 use)', description: 'On your turn, you can take one additional action on top of your regular action and possible bonus action. Recharges on a Short or Long Rest.' },
    { level: 3, title: 'Fighter Specialty (Archetype)', description: 'Choose your specialty: Blaster Specialist, Heavy Armor Specialist, Tactical Specialist, or Shield Specialist.', hasChoice: true, choiceCount: 1, archetypeChoice: true },
    { level: 4, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 5, title: 'Extra Attack (1)', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    { level: 6, title: 'Bonus Ability Score Improvement', description: 'Fighter training grant: Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 7, title: 'Specialty Feature', description: 'You gain your 7th-level Fighter Specialty feature.' },
    { level: 8, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 9, title: 'Indomitable (1 use)', description: 'You can reroll a saving throw that you fail. You must use the new roll. Recharges on a Long Rest.' },
    { level: 10, title: 'Specialty Feature', description: 'You gain your 10th-level Fighter Specialty feature.' },
    { level: 11, title: 'Extra Attack (2)', description: 'You can attack three times, instead of once, whenever you take the Attack action on your turn.' },
    { level: 12, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 13, title: 'Indomitable (2 uses)', description: 'You can use Indomitable twice between long rests.' },
    { level: 14, title: 'Bonus Ability Score Improvement', description: 'Fighter training grant: Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 15, title: 'Specialty Feature', description: 'You gain your 15th-level Fighter Specialty feature.' },
    { level: 16, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 17, title: 'Action Surge (2 uses) & Indomitable (3 uses)', description: 'You gain a second use of Action Surge per short rest, and a third use of Indomitable per long rest.' },
    { level: 18, title: 'Specialty Feature', description: 'You gain your 18th-level Fighter Specialty feature.' },
    { level: 19, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 20, title: 'Extra Attack (3)', description: 'You can attack four times, instead of once, whenever you take the Attack action on your turn.' },
  ],
  guardian: [
    { level: 1, title: 'Forcecasting (Half Caster)', description: 'You gain 2 Force Points per Guardian level + WIS/CHA modifier (max 5th-level Force powers).' },
    { level: 1, title: 'Channel the Force (Cause Harm, Lend Aid)', description: 'Channel the Force to deal necrotic damage (Cause Harm) or restore hit points and cure toxins (Lend Aid).' },
    { level: 2, title: 'Force-Empowered Strikes', description: 'When you hit with a melee weapon, expend Force points to deal an extra 1d8 damage per point spent (max 2d8, scaling to 6d8).' },
    { level: 2, title: 'Fighting Style', description: 'Adopt a fighting style: Defense, Dueling, Great Weapon, or Twin-Blade.', hasChoice: true, choiceCount: 1 },
    { level: 3, title: 'Guardian Aura', description: 'Emit an aura of conviction, warding, or protection within 5 feet of you, granting vital combat benefits to allies.' },
    { level: 3, title: 'Guardian Focus (Archetype)', description: 'Commit to a lightsaber form: Soresu Form, Juyo/Vaapad Form, Makashi Form, or Shien/Djem So Form.', hasChoice: true, choiceCount: 1, archetypeChoice: true },
    { level: 4, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 5, title: 'Extra Attack', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
    { level: 6, title: 'Force Purity', description: 'The Force flowing through your veins grants complete immunity to poison and disease.' },
    { level: 7, title: 'Focus Feature', description: 'You gain your 7th-level Guardian Focus lightsaber form feature.' },
    { level: 8, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 9, title: 'Guardian Aura (15-foot radius)', description: 'The range of all your guardian auras expands to 15 feet.' },
    { level: 10, title: 'Guardian Aura (Two Auras)', description: 'You can now project two different guardian auras simultaneously.' },
    { level: 11, title: 'Improved Force-Empowered Strikes', description: 'All your melee weapon strikes deal an extra 1d8 damage automatically.' },
    { level: 12, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 14, title: 'Cleansing Touch', description: 'Expend a use of Channel the Force to end one force power affecting yourself or a willing creature you touch.' },
    { level: 15, title: 'Focus Feature', description: 'You gain your 15th-level Guardian Focus feature.' },
    { level: 16, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 17, title: 'Guardian Aura (30-foot radius)', description: 'The range of your auras expands to a massive 30-foot radius.' },
    { level: 18, title: 'Guardian Aura (Three Auras)', description: 'You can now project three guardian auras at the same time.' },
    { level: 19, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 20, title: 'Focus Pinnacle Feature', description: 'You master your chosen lightsaber form, becoming an invincible avatar of defensive or offensive mastery.' },
  ],
  monk: [
    { level: 1, title: 'Martial Arts (d4)', description: 'Use DEX instead of STR for monk weapons, roll d4 for unarmed strikes, and make an unarmed strike as a bonus action.' },
    { level: 1, title: 'Unarmored Defense (Monk)', description: 'While unarmored and not wielding a shield, your AC equals 10 + your Dexterity modifier + your Wisdom or Charisma modifier.' },
    { level: 2, title: 'Focus Points', description: 'Harness mystical focus to execute Flurry of Blows, Patient Defense, and Step of the Wind.' },
    { level: 2, title: 'Unarmored Movement (+10 ft)', description: 'Your walking speed increases by 10 feet while not wearing armor or wielding a shield.' },
    { level: 3, title: 'Monastic Order (Archetype)', description: 'Choose your order: Echani Order, Crimson Order, Matukai Order, or Jal Shey Order.', hasChoice: true, choiceCount: 1, archetypeChoice: true },
    { level: 3, title: 'Deflect Missiles', description: 'Use your reaction to deflect or catch blaster bolts and missiles when targeted by a ranged weapon attack.' },
    { level: 4, title: 'Slow Fall', description: 'Use your reaction to reduce falling damage by an amount equal to five times your monk level.' },
    { level: 4, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 5, title: 'Extra Attack & Stunning Strike', description: 'Attack twice on your turn, and spend 1 focus point to stun a creature on a hit with a melee weapon.' },
    { level: 6, title: 'Order Feature & Focused Strikes', description: 'Your unarmed strikes count as enhanced for overcoming resistance, and you gain your 6th-level Order feature.' },
    { level: 7, title: 'Evasion & Stillness of Mind', description: 'Take no damage on successful Dex saves against area effects, and spend an action to end charm or frightened effects.' },
    { level: 8, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 9, title: 'Unarmored Movement Improvement', description: 'You gain the ability to run across vertical surfaces and across liquids on your turn without falling.' },
    { level: 10, title: 'Purity of Body', description: 'Your mastery of internal focus makes you completely immune to poison and disease.' },
    { level: 11, title: 'Order Feature & Martial Arts (d8)', description: 'Your martial arts damage die increases to a d8, and you unlock your 11th-level Order feature.' },
    { level: 12, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 13, title: 'Tongue of Sun and Moon', description: 'You touch the minds of other sentients so that you understand all spoken languages.' },
    { level: 14, title: 'Diamond Soul', description: 'Your focus grants you proficiency in all saving throws. You can reroll a failed save by expending 1 focus point.' },
    { level: 15, title: 'Timeless Body', description: 'You suffer none of the frailty of old age and cannot be magically aged.' },
    { level: 16, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 17, title: 'Order Feature & Martial Arts (d10)', description: 'Your martial arts damage die becomes a d10, and you unlock your pinnacle Order feature.' },
    { level: 18, title: 'Empty Body', description: 'Spend 4 focus points to become invisible for 1 minute and gain resistance to all damage except force.' },
    { level: 19, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 20, title: 'Perfect Self', description: 'When you roll for initiative and have no focus points remaining, you immediately regain 4 focus points.' },
  ],
  operative: [
    { level: 1, title: 'Sneak Attack (1d6)', description: 'Once per turn, deal an extra 1d6 damage to one creature you hit with an attack using a finesse or ranged weapon if you have advantage or an ally is adjacent.' },
    { level: 1, title: 'Expertise (Two Skills/Tools)', description: 'Double your proficiency bonus for two of your skill proficiencies or one skill and thieves’ tools.' },
    { level: 2, title: 'Cunning Action', description: 'You can take a bonus action on each of your turns in combat to take the Dash, Disengage, or Hide action.' },
    { level: 3, title: 'Operative Practice (Archetype)', description: 'Choose your practice: Assassin, Gunslinger, Saboteur, or Scrapper.', hasChoice: true, choiceCount: 1, archetypeChoice: true },
    { level: 4, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 5, title: 'Uncanny Dodge & Sneak Attack (3d6)', description: 'When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack’s damage against you.' },
    { level: 6, title: 'Expertise (Two More Skills)', description: 'Choose two more of your skill proficiencies or tool proficiencies to gain expertise.' },
    { level: 7, title: 'Evasion & Sneak Attack (4d6)', description: 'When subjected to an effect that allows a Dexterity saving throw for half damage, you take no damage on success and half on failure.' },
    { level: 8, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 9, title: 'Practice Feature & Sneak Attack (5d6)', description: 'You gain your 9th-level Operative Practice feature.' },
    { level: 10, title: 'Bonus Ability Score Improvement', description: 'Operative training grant: Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 11, title: 'Reliable Talent', description: 'Whenever you make an ability check that lets you add your proficiency bonus, treat a d20 roll of 9 or lower as a 10.' },
    { level: 12, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 13, title: 'Practice Feature & Sneak Attack (7d6)', description: 'You gain your 13th-level Operative Practice feature.' },
    { level: 14, title: 'Blindsense (10 ft)', description: 'If you are able to hear, you are aware of the location of any hidden or invisible creature within 10 feet of you.' },
    { level: 15, title: 'Slippery Mind & Sneak Attack (8d6)', description: 'You acquire greater mental strength, gaining proficiency in Wisdom saving throws.' },
    { level: 16, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 17, title: 'Practice Feature & Sneak Attack (9d6)', description: 'You unlock your capstone Operative Practice feature.' },
    { level: 18, title: 'Elusive', description: 'No attack roll has advantage against you while you aren’t incapacitated.' },
    { level: 19, title: 'Ability Score Improvement & Sneak Attack (10d6)', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 20, title: 'Stroke of Luck', description: 'If your attack misses a target within range, you can turn the miss into a hit. Or turn a failed ability check into a 20.' },
  ],
  scholar: [
    { level: 1, title: 'Critical Analysis', description: 'As a bonus action, analyze a creature within 60 feet. For 1 minute, add your Intelligence modifier to attack and damage rolls against that creature.' },
    { level: 1, title: 'Sage Advice', description: 'Instruct allies in combat, spending superiority dice to guide their skill checks and tactical maneuvers.' },
    { level: 1, title: 'Superiority Dice (4d8)', description: 'Fuel academic and tactical maneuvers with 4d8 superiority dice that recharge on a Short or Long Rest.' },
    { level: 2, title: 'Discoveries (Two Discoveries)', description: 'Learn 2 scholar discoveries such as Academic Memory, Ambassador, or Clever Applications.', hasChoice: true, choiceCount: 2 },
    { level: 3, title: 'Academic Pursuit (Archetype)', description: 'Choose your academic pursuit: Physician, Politician, Tactician, or Detective.', hasChoice: true, choiceCount: 1, archetypeChoice: true },
    { level: 4, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 5, title: 'Superiority Dice (d10) & 3rd Discovery', description: 'Your superiority dice turn into d10s, and you learn a 3rd scholar discovery.' },
    { level: 6, title: 'Pursuit Feature', description: 'You gain your 6th-level Academic Pursuit feature.' },
    { level: 7, title: '4th Discovery & 6 Superiority Dice', description: 'You learn a 4th scholar discovery and gain a 6th superiority die.' },
    { level: 8, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 9, title: 'Pursuit Feature & 5th Discovery', description: 'You gain your 9th-level Academic Pursuit feature and learn a 5th discovery.' },
    { level: 10, title: 'Adaptive Analysis', description: 'When you take the Attack action against the target of your Critical Analysis, you can replace one attack with a Help action.' },
    { level: 11, title: '6th Discovery & 7 Superiority Dice', description: 'You learn a 6th discovery and your superiority dice count increases to 7.' },
    { level: 12, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 13, title: '7th Discovery', description: 'You learn a 7th scholar discovery.' },
    { level: 14, title: 'Practical Applications', description: 'When an ally rolls a superiority die granted by your Sage Advice, they add your Intelligence modifier to the roll.' },
    { level: 15, title: 'Superiority Dice (d12) & 8th Discovery', description: 'Your superiority dice become d12s, and you learn an 8th discovery.' },
    { level: 16, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 17, title: 'Pursuit Feature & 9th Discovery', description: 'You unlock your capstone Academic Pursuit feature and 9th discovery.' },
    { level: 18, title: 'Prepared for Anything', description: 'At the end of a long rest, you can replace one discovery you know with another discovery.' },
    { level: 19, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 20, title: 'Knowledge Unbound', description: 'Your Intelligence score increases by 4 (max 24), and you can use maneuvers without spending superiority dice (rolling a d4).' },
  ],
  scout: [
    { level: 1, title: 'Explorer', description: 'You are an adept navigator of rough terrain, moving stealthily through difficult terrain without penalty and foraging twice as much food.' },
    { level: 1, title: 'Target Assessment', description: 'Mark an adversary to gain bonuses on survival tracking, initiative checks, and perception awareness.' },
    { level: 2, title: 'Techcasting (Half Caster)', description: 'You gain 1 Tech Point per Scout level + INT modifier (max 5th-level tech powers).' },
    { level: 2, title: 'Ranger’s Quarry (d4)', description: 'Designate a creature as your quarry as a bonus action, dealing an extra 1d4 damage on hits.' },
    { level: 2, title: 'Fighting Style', description: 'Adopt an archery, defense, or two-weapon fighting style.', hasChoice: true, choiceCount: 1 },
    { level: 3, title: 'Scout Technique (Archetype)', description: 'Choose your technique: Deadeye, Hunter, Stalker, or Bulwark.', hasChoice: true, choiceCount: 1, archetypeChoice: true },
    { level: 4, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 5, title: 'Extra Attack & Quarry (d6)', description: 'Attack twice on your turn, and your Ranger’s Quarry die increases to a d6.' },
    { level: 6, title: 'Commando', description: 'Your speed increases by 5 feet, and you gain a climbing speed and swimming speed equal to your walking speed.' },
    { level: 7, title: 'Technique Feature', description: 'You gain your 7th-level Scout Technique feature.' },
    { level: 8, title: 'Ability Score Improvement & Land’s Stride', description: 'Increase ability scores or take a feat, and pass through nonenhanced terrain obstacles freely.' },
    { level: 9, title: 'Ranger’s Quarry (d8)', description: 'Your Ranger’s Quarry die increases to a d8.' },
    { level: 10, title: 'Hide in Plain Sight', description: 'Camouflage yourself to gain a +10 bonus to Dexterity (Stealth) checks as long as you remain still.' },
    { level: 11, title: 'Technique Feature', description: 'You gain your 11th-level Scout Technique feature.' },
    { level: 12, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 13, title: 'Ranger’s Quarry (d10)', description: 'Your Ranger’s Quarry die increases to a d10.' },
    { level: 14, title: 'Vanish', description: 'You can use the Hide action as a bonus action on your turn, and you can’t be tracked by nonenhanced means.' },
    { level: 15, title: 'Technique Feature', description: 'You gain your 15th-level Scout Technique feature.' },
    { level: 16, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 17, title: 'Ranger’s Quarry (d12)', description: 'Your Ranger’s Quarry die increases to a d12.' },
    { level: 18, title: 'Feral Senses', description: 'You gain blindsight to a range of 30 feet, negating disadvantage when fighting invisible foes.' },
    { level: 19, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 20, title: 'Master Scout', description: 'You add your Wisdom or Intelligence modifier to all attack rolls and damage rolls made against your quarry.' },
  ],
  sentinel: [
    { level: 1, title: 'Forcecasting (3/4 Caster)', description: 'You gain 3 Force Points per Sentinel level + WIS/CHA modifier (powers up to 7th-level).' },
    { level: 1, title: 'Led by the Force', description: 'Add half your proficiency bonus, rounded down, to any ability check that doesn’t already include your proficiency bonus.' },
    { level: 2, title: 'Force-Empowered Self', description: 'Expend 1 force point on hit to trigger Deflection (+AC), Double Strike (+damage), or Slow Time (+speed).' },
    { level: 2, title: 'Sentinel Ideals (Two Ideals)', description: 'Adopt 2 ideals from Ideal of the Agile, Artisan, Contender, Fighter, Hunter, Steadfast, Titan, Tranquil, or Vigorous.', hasChoice: true, choiceCount: 2 },
    { level: 2, title: 'Kinetic Combat (d4)', description: 'Your kinetic combat die is a d4.' },
    { level: 3, title: 'Sentinel Calling (Archetype)', description: 'Choose your calling: Path of Aggression, Path of Focus, Path of Shadows, or Path of the Force.', hasChoice: true, choiceCount: 1, archetypeChoice: true },
    { level: 4, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 5, title: 'Extra Attack & Kinetic Combat (d6)', description: 'Attack twice on your turn, and your Kinetic Combat die increases to a d6.' },
    { level: 6, title: '3rd Sentinel Ideal', description: 'You adopt a 3rd Sentinel Ideal.' },
    { level: 7, title: 'Calling Feature', description: 'You gain your 7th-level Sentinel Calling feature.' },
    { level: 8, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 9, title: 'Kinetic Combat (d8) & 3 Manifestations', description: 'Your Kinetic Combat die increases to a d8, and you can manifest ideals 3 times per long rest.' },
    { level: 10, title: 'Battle Readiness', description: 'When you take the Dodge, Disengage, or cast a power with your action, you can make one melee weapon attack as a bonus action.' },
    { level: 11, title: '4th Sentinel Ideal', description: 'You adopt a 4th Sentinel Ideal.' },
    { level: 12, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 13, title: 'Calling Feature & Kinetic Combat (d10)', description: 'You unlock your 13th-level Calling feature and your Kinetic Combat die becomes a d10.' },
    { level: 14, title: 'Enlightened Evasion', description: 'Spend 2 force points to add your Force modifier to saving throws against area damage effects, taking zero damage on success.' },
    { level: 15, title: '4 Manifestations', description: 'You can now manifest your sentinel ideals 4 times per long rest.' },
    { level: 16, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 17, title: 'Kinetic Combat (d12)', description: 'Your Kinetic Combat die increases to a d12.' },
    { level: 18, title: 'Calling Feature', description: 'You unlock your pinnacle Sentinel Calling feature.' },
    { level: 19, title: 'Ability Score Improvement', description: 'Increase one ability score by 2, or two scores by 1, or select a feat.', hasChoice: true, choiceCount: 1 },
    { level: 20, title: 'Center of the Force', description: 'Your Dexterity and Wisdom/Charisma scores increase by 2 (max 22). Once per turn, you can maximize a Kinetic Combat die roll.' },
  ],
};

/**
 * Resolves canonical species traits by ID or slug.
 */
export function getSpeciesTraits(idOrSlug: string): SpeciesTraits {
  const clean = idOrSlug.replace(/^.*:species:/, '').toLowerCase();
  return (
    SPECIES_TRAITS_MAP[clean] ?? {
      slug: clean,
      name: clean.charAt(0).toUpperCase() + clean.slice(1),
      size: 'Medium',
      speed: 30,
      abilityBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
      inherentSkills: [],
      languages: ['Galactic Basic'],
      hasFlexibleSkillChoice: true,
      traits: [
        {
          name: 'Galactic Adaptability',
          description: 'You are adapted to life among the star systems of the galaxy.',
        },
      ],
    }
  );
}

/**
 * Resolves canonical background benefits by ID or slug.
 */
export function getBackgroundBenefits(idOrSlug: string): BackgroundBenefits {
  const clean = idOrSlug.replace(/^.*:background:/, '').toLowerCase();
  return (
    BACKGROUND_BENEFITS_MAP[clean] ?? {
      slug: clean,
      name: clean.charAt(0).toUpperCase() + clean.slice(1),
      skills: ['insight', 'athletics'],
      toolProficiency: 'Specialist’s Kit',
      featureTitle: 'Galactic Background',
      featureDescription: 'Your past training and connections assist you in your galactic travels.',
      defaultFeatName: 'Force-Sensitive',
      defaultFeatId: 'sw5e:core:feat:force-sensitive',
    }
  );
}

/**
 * Official SW5e Point Buy point cost per ability score (PHB Chapter 1, p. 13).
 * Scores start at 8 (cost 0) up to 15 (cost 9). Total budget is 27 points.
 */
export const POINT_BUY_COST: Readonly<Record<number, number>> = Object.freeze({
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
});

export const POINT_BUY_BUDGET = 27;

/**
 * Standard Array values for ability score generation (PHB Chapter 1, p. 13).
 */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

/**
 * Calculates total point buy points spent for the given ability scores.
 */
export function calculatePointBuySpent(scores: Record<AbilityKey, number>): number {
  return (['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).reduce((sum, key) => {
    const val = Math.max(8, Math.min(15, scores[key] ?? 8));
    return sum + (POINT_BUY_COST[val] ?? 0);
  }, 0);
}

/**
 * Returns canonical max known powers for a class and level (PHB Chapter 3).
 * Returns 0 for non-casters or before casting starts (e.g. Scout level 1).
 */
export function getMaxKnownPowers(classKey: ClassKey, level: number): number {
  const lvl = Math.max(1, Math.min(20, Math.floor(level)));
  switch (classKey) {
    case 'consular':
      // SW5e PHB Ch. 3 (The Consular): L1: 9, L2: 11, L3: 13, ..., L20: 40
      return [0, 9, 11, 13, 15, 17, 19, 21, 23, 25, 26, 28, 29, 31, 32, 34, 35, 37, 38, 39, 40][lvl] ?? 9;
    case 'engineer':
      // SW5e PHB Ch. 3 (The Engineer): L1: 6, L2: 7, L3: 9, ..., L20: 32
      return [0, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 28, 29, 30, 31, 32][lvl] ?? 6;
    case 'sentinel':
      // SW5e PHB Ch. 3 (The Sentinel): L1: 7, L2: 8, L3: 10, ..., L20: 34
      return [0, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25, 26, 28, 29, 31, 32, 33, 34][lvl] ?? 7;
    case 'guardian':
      // SW5e PHB Ch. 3 (The Guardian): L1: 4, L2: 5, L3: 7, ..., L20: 29
      return [0, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29][lvl] ?? 4;
    case 'scout':
      // SW5e PHB Ch. 3 (The Scout): Techcasting starts at level 2 with 4 powers, ..., L20: 22
      return [0, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22][lvl] ?? 0;
    default:
      return 0;
  }
}
