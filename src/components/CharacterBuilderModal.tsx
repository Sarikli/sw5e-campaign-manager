import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  abilityModifier,
  computeMaxHp,
  formatSigned,
} from '../domain/calculations/characterStats';
import {
  defaultSavesForClass,
  type Character,
  type CharacterDetails,
  type InventoryItemData,
} from '../domain/models';
import {
  ABILITIES,
  ABILITY_NAMES,
  CLASS_SPECS,
  SKILLS,
  SKILL_KEYS,
  type AbilityKey,
  type ClassKey,
  type ProficiencyLevel,
  type SkillKey,
} from '../domain/sw5e/constants';
import type { ContentEntry } from '../domain/sw5e/contentSchema';
import {
  BACKGROUND_BENEFITS_MAP,
  CLASS_LEVEL_FEATURES,
  CLASS_STARTING_EQUIPMENT,
  GALACTIC_LANGUAGES,
  POINT_BUY_BUDGET,
  STANDARD_ARRAY,
  SW5E_TOOL_PROFICIENCIES,
  calculatePointBuySpent,
  getMaxKnownPowers,
  getBackgroundStartingEquipment,
  getSpeciesTraits,
  getBackgroundBenefits,
} from '../domain/sw5e/sourcebooks';
import {
  getBackgroundPersonality,
  getClassRoleplayGuide,
} from '../domain/sw5e/backgroundPersonality';
import { findWeaponDefinition } from '../domain/sw5e/weapons';
import { spacing } from '../theme';
import { FormattedRuleText } from './FormattedRuleText';

type BuilderStep = 'class' | 'background' | 'species' | 'abilities' | 'equipment' | 'whats_next';

const STEPS: { key: BuilderStep; label: string }[] = [
  { key: 'class', label: '1. CLASS' },
  { key: 'background', label: '2. BACKGROUND' },
  { key: 'species', label: '3. SPECIES' },
  { key: 'abilities', label: '4. ABILITIES' },
  { key: 'equipment', label: '5. EQUIPMENT' },
  { key: 'whats_next', label: "WHAT'S NEXT" },
];

interface Props {
  visible: boolean;
  initialCharacter?: Character | null;
  speciesEntries: ContentEntry[];
  archetypeEntries: ContentEntry[];
  backgroundEntries: ContentEntry[];
  featEntries: ContentEntry[];
  powerEntries: ContentEntry[];
  catalogItems: ContentEntry[];
  onClose: () => void;
  onSaveCharacter: (payload: {
    name: string;
    levelTotal: number;
    details: Partial<CharacterDetails>;
    openSheetAfter: boolean;
  }) => Promise<void>;
}

export function CharacterBuilderModal({
  visible,
  initialCharacter,
  speciesEntries,
  archetypeEntries,
  backgroundEntries,
  featEntries,
  powerEntries,
  catalogItems,
  onClose,
  onSaveCharacter,
}: Props) {
  const [step, setStep] = useState<BuilderStep>('class');
  const [name, setName] = useState('Unnamed Hero');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [levelTotal, setLevelTotal] = useState(1);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Step 1: Class state
  const [classConfirmed, setClassConfirmed] = useState(false);
  const [previewClassKey, setPreviewClassKey] = useState<ClassKey | null>(null);
  const [classKey, setClassKey] = useState<ClassKey>('guardian');
  const [classSearch, setClassSearch] = useState('');
  const [archetypeId, setArchetypeId] = useState<string | null>(null);
  const [archetypeName, setArchetypeName] = useState('');
  const [skillProficiencies, setSkillProficiencies] = useState<Record<string, ProficiencyLevel>>({});
  const [knownPowerIds, setKnownPowerIds] = useState<string[]>([]);

  // Step 2: Background state
  const [backgroundId, setBackgroundId] = useState('sw5e:core:background:jedi');
  const [backgroundName, setBackgroundName] = useState('Jedi');
  const [selectedTool, setSelectedTool] = useState('Artificer’s Implements');
  const [isCustomBg, setIsCustomBg] = useState(false);
  const [customBgName, setCustomBgName] = useState('Custom Background');
  const [customBgSkills, setCustomBgSkills] = useState<SkillKey[]>(['perception', 'survival']);
  const [customBgTools, setCustomBgTools] = useState<string[]>(['Mechanic’s Kit']);
  const [customBgLanguages, setCustomBgLanguages] = useState<string[]>(['Huttese']);
  const [customBgFeatureTitle, setCustomBgFeatureTitle] = useState('Safe Haven');
  const [customBgFeatureDesc, setCustomBgFeatureDesc] = useState(
    'You have access to a secret network of supporters and covert safe houses across the galaxy.',
  );
  const [openPersonalityPicker, setOpenPersonalityPicker] = useState<
    'traits' | 'ideals' | 'bonds' | 'flaws' | null
  >(null);
  const [featIds, setFeatIds] = useState<string[]>(['sw5e:core:feat:force-sensitive']);
  const [asiSource, setAsiSource] = useState<'species' | 'custom'>('species');
  const [asiMode, setAsiMode] = useState<'two' | 'three'>('two');
  const [asiPrimary, setAsiPrimary] = useState<AbilityKey>('str');
  const [asiSecondary, setAsiSecondary] = useState<AbilityKey>('wis');
  const [asiThird, setAsiThird] = useState<AbilityKey>('con');
  const [alignment, setAlignment] = useState('Light Side');
  const [faith, setFaith] = useState('');
  const [lifestyle, setLifestyle] = useState('Modest');
  const [hair, setHair] = useState('');
  const [skin, setSkin] = useState('');
  const [eyes, setEyes] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [personalityTraits, setPersonalityTraits] = useState('');
  const [ideals, setIdeals] = useState('');
  const [bonds, setBonds] = useState('');
  const [flaws, setFlaws] = useState('');
  const [backstory, setBackstory] = useState('');

  // Step 3: Species state
  const [speciesConfirmed, setSpeciesConfirmed] = useState(false);
  const [previewSpecies, setPreviewSpecies] = useState<ContentEntry | null>(null);
  const [speciesId, setSpeciesId] = useState('sw5e:core:species:human');
  const [speciesName, setSpeciesName] = useState('Human');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [speciesSize, setSpeciesSize] = useState('Medium');
  const [speciesSkillChoice, setSpeciesSkillChoice] = useState<SkillKey>('deception');
  const [languages, setLanguages] = useState<string[]>(['Galactic Basic']);

  // Step 4: Abilities state
  const [abilityMethod, setAbilityMethod] = useState<'standard_array' | 'point_buy' | 'manual'>(
    'standard_array',
  );
  const [manualSubMode, setManualSubMode] = useState<'rolled' | 'direct'>('rolled');
  const [standardAssignments, setStandardAssignments] = useState<Record<AbilityKey, number>>({
    str: 0,
    dex: 1,
    con: 2,
    int: 3,
    wis: 4,
    cha: 5,
  });
  const [rolledPool, setRolledPool] = useState<{ total: number; dice: number[] }[]>([]);
  const [rolledAssignments, setRolledAssignments] = useState<Record<AbilityKey, number>>({
    str: 0,
    dex: 1,
    con: 2,
    int: 3,
    wis: 4,
    cha: 5,
  });
  const [baseScores, setBaseScores] = useState<Record<AbilityKey, number>>({
    str: 15,
    dex: 14,
    con: 13,
    int: 12,
    wis: 10,
    cha: 8,
  });

  // Step 5: Equipment state
  const [classPkgOption, setClassPkgOption] = useState<'A' | 'B'>('A');
  const [bgPkgOption, setBgPkgOption] = useState<'A' | 'B'>('A');
  const [inventory, setInventory] = useState<InventoryItemData[]>([]);
  const [credits, setCredits] = useState(500);
  const [equipToast, setEquipToast] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  // Accordion toggles
  const [openAccordion, setOpenAccordion] = useState<string | null>('core-traits');

  useEffect(() => {
    if (!visible) return;
    setValidationWarning(null);
    if (initialCharacter) {
      const d = initialCharacter.details;
      setName(initialCharacter.name);
      setAvatarUri(d.avatarUri ?? null);
      setLevelTotal(initialCharacter.levelTotal);
      setClassKey(d.classKey);
      setClassConfirmed(true);
      setArchetypeId(d.archetypeId);
      setArchetypeName(d.archetypeName);
      setBackgroundId(d.backgroundId);
      setBackgroundName(d.backgroundName);
      if (d.customBackground) {
        setIsCustomBg(true);
        setCustomBgName(d.customBackground.name);
        setCustomBgSkills(d.customBackground.skills as SkillKey[]);
        setCustomBgTools(d.customBackground.tools);
        setCustomBgLanguages(d.customBackground.languages);
        setCustomBgFeatureTitle(d.customBackground.featureTitle);
        setCustomBgFeatureDesc(d.customBackground.featureDescription);
      } else {
        setIsCustomBg(false);
      }
      setSpeciesId(d.speciesId);
      setSpeciesName(d.speciesName);
      setSpeciesConfirmed(true);
      setBaseScores(d.scores);
      setSkillProficiencies(d.skillProficiencies);
      setKnownPowerIds(d.knownPowerIds);
      setFeatIds(d.featIds);
      setInventory(d.inventory);
      setCredits(d.credits);
      setAlignment(d.alignment);
      setLanguages(d.languages ?? ['Galactic Basic']);
      if (d.characteristics) {
        setFaith(d.characteristics.faith);
        setLifestyle(d.characteristics.lifestyle);
        setHair(d.characteristics.hair);
        setSkin(d.characteristics.skin);
        setEyes(d.characteristics.eyes);
        setHeight(d.characteristics.height);
        setWeight(d.characteristics.weight);
        setAge(d.characteristics.age);
        setGender(d.characteristics.gender);
        setPersonalityTraits(d.characteristics.personalityTraits);
        setIdeals(d.characteristics.ideals);
        setBonds(d.characteristics.bonds);
        setFlaws(d.characteristics.flaws);
      }
      if (d.structuredNotes) {
        setBackstory(d.structuredNotes.backstory);
      }
      setStep('class');
    } else {
      setStep('class');
      setName('Unnamed Hero');
      setAvatarUri(null);
      setLevelTotal(1);
      setClassKey('guardian');
      setClassConfirmed(false);
      setPreviewClassKey(null);
      setArchetypeId(null);
      setArchetypeName('');
      setSkillProficiencies({});
      setKnownPowerIds([]);
      setBackgroundId('sw5e:core:background:jedi');
      setBackgroundName('Jedi');
      setSelectedTool('Artificer’s Implements');
      setIsCustomBg(false);
      setCustomBgName('Custom Background');
      setCustomBgSkills(['perception', 'survival']);
      setCustomBgTools(['Mechanic’s Kit']);
      setCustomBgLanguages(['Huttese']);
      setCustomBgFeatureTitle('Safe Haven');
      setCustomBgFeatureDesc(
        'You have access to a secret network of supporters and covert safe houses across the galaxy.',
      );
      setOpenPersonalityPicker(null);
      setFeatIds(['sw5e:core:feat:force-sensitive']);
      setAsiSource('species');
      setAsiMode('two');
      setAsiPrimary('str');
      setAsiSecondary('wis');
      setAsiThird('con');
      setAlignment('Light Side');
      setFaith('');
      setLifestyle('Modest');
      setHair('');
      setSkin('');
      setEyes('');
      setHeight('');
      setWeight('');
      setAge('');
      setGender('');
      setPersonalityTraits('');
      setIdeals('');
      setBonds('');
      setFlaws('');
      setBackstory('');
      setSpeciesId('sw5e:core:species:human');
      setSpeciesName('Human');
      setSpeciesConfirmed(false);
      setPreviewSpecies(null);
      setSpeciesSize('Medium');
      setSpeciesSkillChoice('deception');
      setLanguages(['Galactic Basic']);
      setAbilityMethod('standard_array');
      setManualSubMode('rolled');
      setStandardAssignments({ str: 0, dex: 1, con: 2, int: 3, wis: 4, cha: 5 });
      setRolledPool([]);
      setRolledAssignments({ str: 0, dex: 1, con: 2, int: 3, wis: 4, cha: 5 });
      setBaseScores({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 });
      setClassPkgOption('A');
      setBgPkgOption('A');
      setInventory([]);
      setCredits(500);
    }
  }, [visible, initialCharacter]);

  // Resolve traits and benefits
  const currentSpeciesTraits = getSpeciesTraits(speciesId);
  const currentBgBenefits = getBackgroundBenefits(backgroundId);

  // Compute bonuses from ASI (Species canonical or Custom)
  const bonusMap: Record<AbilityKey, number> = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  };
  if (asiSource === 'species') {
    (Object.entries(currentSpeciesTraits.abilityBonuses) as [AbilityKey, number][]).forEach(
      ([ab, bonus]) => {
        bonusMap[ab] = (bonusMap[ab] ?? 0) + bonus;
      },
    );
  } else {
    if (asiMode === 'two') {
      bonusMap[asiPrimary] = (bonusMap[asiPrimary] ?? 0) + 2;
      if (asiSecondary !== asiPrimary) {
        bonusMap[asiSecondary] = (bonusMap[asiSecondary] ?? 0) + 1;
      }
    } else {
      bonusMap[asiPrimary] = (bonusMap[asiPrimary] ?? 0) + 1;
      bonusMap[asiSecondary] = (bonusMap[asiSecondary] ?? 0) + 1;
      bonusMap[asiThird] = (bonusMap[asiThird] ?? 0) + 1;
    }
  }

  const finalScores: Record<AbilityKey, number> = {
    str: Math.min(20, Math.max(1, baseScores.str + bonusMap.str)),
    dex: Math.min(20, Math.max(1, baseScores.dex + bonusMap.dex)),
    con: Math.min(20, Math.max(1, baseScores.con + bonusMap.con)),
    int: Math.min(20, Math.max(1, baseScores.int + bonusMap.int)),
    wis: Math.min(20, Math.max(1, baseScores.wis + bonusMap.wis)),
    cha: Math.min(20, Math.max(1, baseScores.cha + bonusMap.cha)),
  };

  const maxHp = computeMaxHp(classKey, levelTotal, abilityModifier(finalScores.con));

  const classArchs = archetypeEntries.filter((a) => {
    try {
      const p = JSON.parse(a.propertiesJson) as { classKey?: string };
      return p.classKey === classKey;
    } catch {
      return false;
    }
  });

  const currentBgPkg = getBackgroundStartingEquipment(backgroundId);

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mime = asset.mimeType || 'image/jpeg';
          setAvatarUri(`data:${mime};base64,${asset.base64}`);
        } else if (asset.uri) {
          setAvatarUri(asset.uri);
        }
      }
    } catch {
      // User cancelled or permissions denied
    }
  };

  const buildStartingEquipmentPackage = (): {
    items: InventoryItemData[];
    credits: number;
  } => {
    const classPkg = CLASS_STARTING_EQUIPMENT[classKey];
    const bgPkg = currentBgPkg;
    const nextInv: InventoryItemData[] = [];
    let nextCredits = 0;

    if (classPkgOption === 'A') {
      classPkg.packageAItems.forEach((item, idx) => {
        nextInv.push({
          id: `start-cls-${Date.now()}-${idx}`,
          contentId: null,
          name: item.name,
          kind: item.kind,
          quantity: item.quantity,
          equipped:
            item.equipped !== undefined
              ? Boolean(item.equipped)
              : item.kind === 'weapon' || item.kind === 'armor' || item.kind === 'shield',
          weight: item.weight,
          cost: item.cost,
          armorCategory: item.armorCategory,
          baseAc: item.baseAc,
          shieldAcBonus: item.shieldAcBonus,
          enhancementBonus: 0,
          damageDice: item.damageDice,
          damageType: item.damageType,
          finesse: item.finesse,
          ranged: item.ranged,
          properties: item.properties ? [...item.properties] : [],
        });
      });
      nextCredits += classPkg.packageACredits;
    } else {
      nextCredits += classPkg.packageBCredits;
    }

    if (bgPkgOption === 'A') {
      bgPkg.items.forEach((item, idx) => {
        nextInv.push({
          id: `start-bg-${Date.now()}-${idx}`,
          contentId: null,
          name: item.name,
          kind: item.kind,
          quantity: item.quantity,
          equipped:
            item.equipped !== undefined
              ? Boolean(item.equipped)
              : item.kind === 'weapon' || item.kind === 'armor' || item.kind === 'shield',
          weight: item.weight,
          cost: item.cost,
          enhancementBonus: 0,
          damageDice: item.damageDice,
          damageType: item.damageType,
          finesse: item.finesse,
          ranged: item.ranged,
          properties: item.properties ? [...item.properties] : [],
        });
      });
      nextCredits += bgPkg.credits;
    } else {
      nextCredits += bgPkg.credits + 150;
    }

    return { items: nextInv, credits: nextCredits };
  };

  const handleApplyStartingEquipment = () => {
    const pkg = buildStartingEquipmentPackage();
    const customItems = inventory.filter((i) => !i.id.startsWith('start-'));
    setInventory([...pkg.items, ...customItems]);
    setCredits(pkg.credits);
    setEquipToast(true);
    setTimeout(() => setEquipToast(false), 3200);
  };

  const handleAddCatalogItem = (entry: ContentEntry) => {
    let props: Record<string, unknown> = {};
    try {
      props = JSON.parse(entry.propertiesJson) as Record<string, unknown>;
    } catch {
      props = {};
    }
    const isShield =
      entry.contentType === 'armor' &&
      (props.Category === 'shield' ||
        props.isShield === true ||
        entry.name.toLowerCase().includes('shield'));

    const kind = isShield ? 'shield' : (entry.contentType as InventoryItemData['kind']);

    const weaponDef =
      kind === 'weapon' ? findWeaponDefinition(entry.slug || entry.name) : undefined;
    const rawProps = Array.isArray(props.properties)
      ? (props.properties as string[])
      : weaponDef?.properties ?? [];

    const shieldBonus = isShield
      ? typeof props.shieldAcBonus === 'number'
        ? props.shieldAcBonus
        : typeof props.acBonus === 'number'
          ? props.acBonus
          : entry.name.toLowerCase().includes('heavy')
            ? 3
            : entry.name.toLowerCase().includes('medium')
              ? 2
              : 1
      : undefined;

    const baseAc =
      kind === 'armor'
        ? typeof props.baseAc === 'number'
          ? props.baseAc
          : typeof props.ac === 'number'
            ? props.ac
            : undefined
        : undefined;

    const newItem: InventoryItemData = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      contentId: entry.id,
      name: entry.name,
      kind,
      quantity: 1,
      equipped: kind === 'weapon' || kind === 'armor' || kind === 'shield',
      weight: typeof props.weight === 'number' ? props.weight : weaponDef?.weight ?? 2,
      cost: typeof props.cost === 'number' ? props.cost : weaponDef?.cost ?? 50,
      armorCategory: props.armorCategory as 'light' | 'medium' | 'heavy' | undefined,
      baseAc,
      shieldAcBonus: shieldBonus,
      enhancementBonus: 0,
      damageDice:
        typeof props.damageDice === 'string' ? props.damageDice : weaponDef?.damageDice,
      damageType:
        typeof props.damageType === 'string' ? props.damageType : weaponDef?.damageType,
      finesse: Boolean(
        props.finesse ||
          weaponDef?.finesse ||
          rawProps.some((p) => p.toLowerCase().includes('finesse')),
      ),
      ranged: Boolean(
        props.ranged ||
          weaponDef?.ranged ||
          weaponDef?.category?.includes('blaster') ||
          rawProps.some((p) => p.toLowerCase().includes('ammunition') || p.toLowerCase().includes('range')),
      ),
      properties: rawProps,
    };
    setInventory((prev) => [...prev, newItem]);
  };

  const handleFinish = async (openSheetAfter: boolean) => {
    if (!classConfirmed) {
      setValidationWarning('Please select and confirm a Class before completing your character.');
      setStep('class');
      return;
    }
    if (!speciesConfirmed) {
      setValidationWarning('Please select and confirm a Species before completing your character.');
      setStep('species');
      return;
    }

    let finalInv = inventory;
    let finalCredits = credits;
    if (finalInv.length === 0) {
      const pkg = buildStartingEquipmentPackage();
      finalInv = pkg.items;
      finalCredits = pkg.credits;
    }

    const mergedSkills: Record<string, ProficiencyLevel> = {
      ...skillProficiencies,
    };
    const activeBgSkills = isCustomBg ? customBgSkills : currentBgBenefits.skills;
    activeBgSkills.forEach((sk) => {
      mergedSkills[sk] = mergedSkills[sk] ?? 'proficient';
    });
    currentSpeciesTraits.inherentSkills.forEach((sk) => {
      mergedSkills[sk] = mergedSkills[sk] ?? 'proficient';
    });
    if (currentSpeciesTraits.hasFlexibleSkillChoice) {
      mergedSkills[speciesSkillChoice] = mergedSkills[speciesSkillChoice] ?? 'proficient';
    }

    const mergedLanguages = Array.from(
      new Set([
        ...languages,
        ...(isCustomBg ? customBgLanguages : []),
        ...currentSpeciesTraits.languages,
        'Galactic Basic',
      ]),
    );

    const mergedTools = isCustomBg
      ? customBgTools
      : [selectedTool || currentBgBenefits.toolProficiency];

    await onSaveCharacter({
      name: name.trim() || 'Unnamed Hero',
      levelTotal,
      openSheetAfter,
      details: {
        avatarUri,
        speciesId,
        speciesName: currentSpeciesTraits.name,
        classKey,
        archetypeId: levelTotal >= 3 ? archetypeId : null,
        archetypeName: levelTotal >= 3 ? archetypeName : '',
        backgroundId: isCustomBg ? 'custom' : backgroundId,
        backgroundName: isCustomBg ? (customBgName.trim() || 'Custom Background') : backgroundName,
        customBackground: isCustomBg
          ? {
              name: customBgName.trim() || 'Custom Background',
              skills: customBgSkills,
              tools: customBgTools,
              languages: customBgLanguages,
              featureTitle: customBgFeatureTitle.trim() || 'Custom Feature',
              featureDescription: customBgFeatureDesc.trim(),
            }
          : null,
        alignment,
        scores: finalScores,
        abilityGenerationMethod: abilityMethod,
        backgroundAbilityBonuses: bonusMap,
        skillProficiencies: mergedSkills,
        savingThrowProficiencies: defaultSavesForClass(classKey),
        armorProficiencies: [...CLASS_SPECS[classKey].armorProficiencies],
        weaponProficiencies: [...CLASS_SPECS[classKey].weaponProficiencies],
        baseSpeed: currentSpeciesTraits.speed,
        hpCurrent: maxHp,
        hpTemp: 0,
        credits: finalCredits,
        knownPowerIds,
        featIds,
        inventory: finalInv,
        languages: mergedLanguages,
        toolProficiencies: mergedTools,
        characteristics: {
          gender,
          age,
          height,
          weight,
          eyes,
          hair,
          skin,
          faith,
          lifestyle,
          personalityTraits,
          ideals,
          bonds,
          flaws,
        },
        structuredNotes: {
          organizations: '',
          allies: '',
          enemies: '',
          backstory,
          other: '',
        },
        notes: backstory,
      },
    });
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const totalWeight = inventory.reduce((sum, i) => sum + i.weight * i.quantity, 0);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Top Builder Header Bar (matches 01:12 in video) */}
        <View style={styles.topHeader}>
          <Pressable onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Character Builder - SW5e</Text>
          <Pressable onPress={() => handleFinish(true)} style={styles.sheetQuickBtn}>
            <Text style={styles.sheetQuickBtnText}>SHEET ▸</Text>
          </Pressable>
        </View>

        {/* Horizontal Step Tabs Bar (matches 01:12 - 02:46 in video) */}
        <View style={styles.stepTabsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepTabsContent}>
            {STEPS.map((s) => {
              const active = s.key === step;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setStep(s.key)}
                  style={[styles.stepTab, active && styles.stepTabActive]}
                >
                  <Text style={[styles.stepTabText, active && styles.stepTabTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Builder Content Area (Light/Clean Card Layout matching 01:12 - 02:46 in video) */}
        <ScrollView contentContainerStyle={styles.bodyScroll}>
          {/* Character Name Banner at top of builder steps */}
          <View style={styles.charNameCard}>
            <View style={styles.avatarWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Upload Character Portrait"
                onPress={handlePickAvatar}
                style={styles.avatarPlaceholder}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarPlus}>+</Text>
                )}
              </Pressable>
              {avatarUri ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove Character Portrait"
                  onPress={() => setAvatarUri(null)}
                  style={styles.avatarRemoveBadge}
                >
                  <Text style={styles.avatarRemoveText}>✕</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.charNameRight}>
              <Text style={styles.charNameLabel}>Character Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter character name"
                placeholderTextColor="#64748B"
                style={styles.charNameInput}
              />
            </View>
          </View>

          {validationWarning ? (
            <View style={styles.validationToast}>
              <Text style={styles.validationToastText}>⚠️ {validationWarning}</Text>
            </View>
          ) : null}

          {/* ================= STEP 1: CLASS ================= */}
          {step === 'class' ? (
            !classConfirmed ? (
              <View style={styles.cardSection}>
                <Text style={styles.stepTitle}>Choose a Class</Text>
                <TextInput
                  value={classSearch}
                  onChangeText={setClassSearch}
                  placeholder="Search classes..."
                  placeholderTextColor="#64748B"
                  style={styles.searchInput}
                />
                <Text style={styles.rulesGroupHeader}>SW5e Core Rules</Text>
                <Text style={styles.rulesGroupSub}>
                  Character options from the Star Wars 5e Player’s Handbook.
                </Text>

                {(Object.keys(CLASS_SPECS) as ClassKey[])
                  .filter((k) =>
                    CLASS_SPECS[k].name.toLowerCase().includes(classSearch.trim().toLowerCase()),
                  )
                  .map((k) => {
                    const spec = CLASS_SPECS[k];
                    return (
                      <Pressable
                        key={k}
                        onPress={() => setPreviewClassKey(k)}
                        style={styles.selectRowCard}
                      >
                        <View style={styles.classBadgeBox}>
                          <Text style={styles.classBadgeGlyph}>
                            {spec.casterKind === 'force'
                              ? '✦'
                              : spec.casterKind === 'tech'
                                ? '⚙'
                                : '⚔'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.selectRowTitle}>{spec.name.toUpperCase()}</Text>
                          <Text style={styles.selectRowSub}>
                            Player’s Handbook • d{spec.hitDie} • {spec.casterKind.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.chevronRight}>›</Text>
                      </Pressable>
                    );
                  })}
              </View>
            ) : (
              /* Added Class View (matches 01:26 in video) */
              <View style={styles.cardSection}>
                <View style={styles.hpSummaryRow}>
                  <View>
                    <Text style={styles.hpSummaryBold}>Max Hit Points: {maxHp}</Text>
                    <Text style={styles.hpSummaryBold}>
                      Hit Dice: {levelTotal}d{CLASS_SPECS[classKey].hitDie}
                    </Text>
                  </View>
                  <View style={styles.manageHpBadge}>
                    <Text style={styles.manageHpBadgeText}>FIXED HP</Text>
                  </View>
                </View>

                <View style={styles.selectedClassHeaderRow}>
                  <View style={styles.classBadgeBox}>
                    <Text style={styles.classBadgeGlyph}>🛡</Text>
                  </View>
                  <Text style={styles.selectedClassName}>{CLASS_SPECS[classKey].name}</Text>
                  <Text style={styles.levelLabel}>Level</Text>
                  <View style={styles.levelCycleBox}>
                    <Pressable
                      onPress={() => setLevelTotal((l) => Math.max(1, l - 1))}
                      style={styles.levelStepBtn}
                    >
                      <Text style={styles.levelStepBtnText}>-</Text>
                    </Pressable>
                    <Text style={styles.levelValueText}>{levelTotal}</Text>
                    <Pressable
                      onPress={() => setLevelTotal((l) => Math.min(20, l + 1))}
                      style={styles.levelStepBtn}
                    >
                      <Text style={styles.levelStepBtnText}>+</Text>
                    </Pressable>
                  </View>
                  <Pressable onPress={() => setClassConfirmed(false)} style={styles.removeClassBtn}>
                    <Text style={styles.removeClassText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.subTabHeader}>CLASS FEATURES ⌃   POWERS ⌄</Text>

                {/* Core Class Traits & Skills Choice Accordion with Blue ! Badge */}
                <View style={styles.choiceAccordion}>
                  <Pressable
                    onPress={() =>
                      setOpenAccordion(openAccordion === 'core-traits' ? null : 'core-traits')
                    }
                    style={styles.choiceAccordionHeader}
                  >
                    <View style={styles.blueExclamation}>
                      <Text style={styles.blueExclamationText}>!</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.choiceAccordionTitle}>
                        Core {CLASS_SPECS[classKey].name} Traits (Skill Proficiencies)
                      </Text>
                      <Text style={styles.choiceAccordionSub}>
                        {(() => {
                          const choices = CLASS_SPECS[classKey].skillChoices;
                          const maxCount = CLASS_SPECS[classKey].skillChoiceCount;
                          const count = choices.filter(
                            (sk) =>
                              skillProficiencies[sk] === 'proficient' ||
                              skillProficiencies[sk] === 'expertise',
                          ).length;
                          return `${count} / ${maxCount} Chosen • 1st level`;
                        })()}
                      </Text>
                    </View>
                    <Text style={styles.chevronDown}>
                      {openAccordion === 'core-traits' ? '⌃' : '⌄'}
                    </Text>
                  </Pressable>
                  {openAccordion === 'core-traits' ? (
                    <View style={styles.choiceAccordionBody}>
                      {(() => {
                        const choices = CLASS_SPECS[classKey].skillChoices;
                        const maxCount = CLASS_SPECS[classKey].skillChoiceCount;
                        const selectedCount = choices.filter(
                          (sk) =>
                            skillProficiencies[sk] === 'proficient' ||
                            skillProficiencies[sk] === 'expertise',
                        ).length;

                        return (
                          <>
                            <Text style={styles.accordionHelper}>
                              Tap skills below to toggle proficiency for your{' '}
                              {CLASS_SPECS[classKey].name} ({selectedCount} / {maxCount} selected):
                            </Text>
                            <View style={styles.chipWrap}>
                              {choices.map((sk) => {
                                const active =
                                  skillProficiencies[sk] === 'proficient' ||
                                  skillProficiencies[sk] === 'expertise';
                                const disabled = !active && selectedCount >= maxCount;
                                return (
                                  <Pressable
                                    key={sk}
                                    onPress={() => {
                                      if (active) {
                                        setSkillProficiencies((prev) => {
                                          const next = { ...prev };
                                          delete next[sk];
                                          return next;
                                        });
                                      } else if (selectedCount < maxCount) {
                                        setSkillProficiencies((prev) => ({
                                          ...prev,
                                          [sk]: 'proficient',
                                        }));
                                      }
                                    }}
                                    style={[
                                      styles.choiceChip,
                                      active && styles.choiceChipActive,
                                      disabled && { opacity: 0.4 },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.choiceChipText,
                                        active && styles.choiceChipTextActive,
                                        disabled && { color: '#94A3B8' },
                                      ]}
                                    >
                                      {SKILLS[sk]?.name ?? sk}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </>
                        );
                      })()}
                    </View>
                  ) : null}
                </View>

                {/* Archetype Choice Accordion */}
                <View style={styles.choiceAccordion}>
                  <Pressable
                    onPress={() =>
                      setOpenAccordion(openAccordion === 'archetype' ? null : 'archetype')
                    }
                    style={styles.choiceAccordionHeader}
                  >
                    <View style={styles.blueExclamation}>
                      <Text style={styles.blueExclamationText}>!</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.choiceAccordionTitle}>
                        {CLASS_SPECS[classKey].name} Archetype
                      </Text>
                      <Text style={styles.choiceAccordionSub}>
                        {levelTotal < 3
                          ? 'Unlocks at 3rd level'
                          : archetypeName || '1 Choice • 3rd level'}
                      </Text>
                    </View>
                    <Text style={styles.chevronDown}>
                      {openAccordion === 'archetype' ? '⌃' : '⌄'}
                    </Text>
                  </Pressable>
                  {openAccordion === 'archetype' ? (
                    <View style={styles.choiceAccordionBody}>
                      {levelTotal < 3 ? (
                        <Text style={styles.accordionHelper}>
                          Archetypes officially unlock at 3rd level in SW5e. You can preview or plan your specialization below:
                        </Text>
                      ) : null}
                      {classArchs.map((arch) => {
                        const selected = archetypeId === arch.id;
                        return (
                          <Pressable
                            key={arch.id}
                            onPress={() => {
                              if (archetypeId === arch.id) {
                                setArchetypeId(null);
                                setArchetypeName('');
                              } else {
                                setArchetypeId(arch.id);
                                setArchetypeName(arch.name);
                              }
                            }}
                            style={[styles.optionCard, selected && styles.optionCardSelected]}
                          >
                            <Text style={styles.optionCardTitle}>{arch.name}</Text>
                            <Text style={styles.optionCardDesc}>{arch.summary}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>

                {/* Force / Tech Powers Selection Accordion if Caster */}
                {CLASS_SPECS[classKey].casterKind !== 'none' ? (() => {
                  const canCastAtLevel = levelTotal >= CLASS_SPECS[classKey].castingStartLevel;
                  const maxKnownPowers = canCastAtLevel ? getMaxKnownPowers(classKey, levelTotal) : 0;
                  const maxPowerLevelForClass =
                    CLASS_SPECS[classKey].potentialMaxPowerLevel === 9
                      ? Math.min(9, Math.ceil(levelTotal / 2))
                      : CLASS_SPECS[classKey].potentialMaxPowerLevel === 7
                        ? Math.min(7, Math.ceil((levelTotal * 7) / 20))
                        : CLASS_SPECS[classKey].potentialMaxPowerLevel === 5
                          ? Math.min(5, Math.ceil(levelTotal / 4))
                          : 0;

                  if (!canCastAtLevel) {
                    return (
                      <View style={styles.choiceAccordion}>
                        <View style={styles.choiceAccordionHeader}>
                          <View style={styles.blueExclamation}>
                            <Text style={styles.blueExclamationText}>⚙</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.choiceAccordionTitle}>
                              {CLASS_SPECS[classKey].name} Tech-Casting
                            </Text>
                            <Text style={styles.choiceAccordionSub}>
                              Unlocks at {CLASS_SPECS[classKey].castingStartLevel}nd level
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View style={styles.choiceAccordion}>
                      <Pressable
                        onPress={() => setOpenAccordion(openAccordion === 'powers' ? null : 'powers')}
                        style={styles.choiceAccordionHeader}
                      >
                        <View style={styles.blueExclamation}>
                          <Text style={styles.blueExclamationText}>!</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.choiceAccordionTitle}>
                            {CLASS_SPECS[classKey].casterKind === 'force'
                              ? 'Force-Casting Powers'
                              : 'Tech-Casting Powers'}
                          </Text>
                          <Text style={styles.choiceAccordionSub}>
                            {knownPowerIds.length} / {maxKnownPowers} Known Powers • Max Power Level {maxPowerLevelForClass}
                          </Text>
                        </View>
                        <Text style={styles.chevronDown}>
                          {openAccordion === 'powers' ? '⌃' : '⌄'}
                        </Text>
                      </Pressable>
                      {openAccordion === 'powers' ? (
                        <View style={styles.choiceAccordionBody}>
                          {powerEntries
                            .filter((p) => {
                              if (
                                CLASS_SPECS[classKey].casterKind === 'force'
                                  ? p.contentType !== 'force_power'
                                  : p.contentType !== 'tech_power'
                              ) {
                                return false;
                              }
                              try {
                                const prop = JSON.parse(p.propertiesJson) as { level?: number };
                                const pwLvl = typeof prop.level === 'number' ? prop.level : 0;
                                return pwLvl <= maxPowerLevelForClass;
                              } catch {
                                return true;
                              }
                            })
                            .map((pw) => {
                              const known = knownPowerIds.includes(pw.id);
                              return (
                                <Pressable
                                  key={pw.id}
                                  onPress={() => {
                                    if (known) {
                                      setKnownPowerIds((prev) =>
                                        prev.filter((id) => id !== pw.id),
                                      );
                                    } else if (knownPowerIds.length < maxKnownPowers) {
                                      setKnownPowerIds((prev) => [...prev, pw.id]);
                                    }
                                  }}
                                  style={[
                                    styles.optionCard,
                                    known && styles.optionCardSelected,
                                    !known && knownPowerIds.length >= maxKnownPowers && { opacity: 0.4 },
                                  ]}
                                >
                                  <Text style={styles.optionCardTitle}>
                                    {known ? '✓ ' : '+ '}
                                    {pw.name}
                                  </Text>
                                  <Text style={styles.optionCardDesc}>{pw.summary}</Text>
                                </Pressable>
                              );
                            })}
                        </View>
                      ) : null}
                    </View>
                  );
                })() : null}

                {/* Level-by-level features list */}
                {CLASS_LEVEL_FEATURES[classKey].map((f) => (
                  <View key={`${f.level}-${f.title}`} style={styles.staticFeatureBox}>
                    <Text style={styles.staticFeatureTitle}>{f.title}</Text>
                    <Text style={styles.staticFeatureLevel}>Level {f.level}</Text>
                    <FormattedRuleText text={f.description} variant="light" />
                  </View>
                ))}
              </View>
            )
          ) : null}

          {/* ================= STEP 2: BACKGROUND (matches 01:28 - 01:46) ================= */}
          {step === 'background' ? (
            <View style={styles.cardSection}>
              <Text style={styles.stepTitle}>Choose Origin: Background</Text>
              <Text style={styles.rulesGroupSub}>
                Select your character’s background, tool proficiency, starting feat, and ability score adjustments.
              </Text>

              <View style={styles.chipWrap}>
                <Pressable
                  onPress={() => {
                    setIsCustomBg(true);
                  }}
                  style={[
                    styles.choiceChip,
                    isCustomBg && { backgroundColor: '#7C3AED', borderColor: '#A78BFA' },
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceChipText,
                      isCustomBg && styles.choiceChipTextActive,
                    ]}
                  >
                    ✨ Custom Background (PHB)
                  </Text>
                </Pressable>
                {backgroundEntries.map((bg) => {
                  const selected = !isCustomBg && bg.id === backgroundId;
                  return (
                    <Pressable
                      key={bg.id}
                      onPress={() => {
                        const benefits = getBackgroundBenefits(bg.id);
                        setIsCustomBg(false);
                        setBackgroundId(bg.id);
                        setBackgroundName(bg.name);
                        setSelectedTool(benefits.toolProficiency);
                        setFeatIds([benefits.defaultFeatId]);
                      }}
                      style={[styles.choiceChip, selected && styles.choiceChipActive]}
                    >
                      <Text
                        style={[styles.choiceChipText, selected && styles.choiceChipTextActive]}
                      >
                        {bg.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {isCustomBg ? (
                <View style={styles.bgDetailCard}>
                  <Text style={styles.bgTitle}>✨ Custom Background Builder (SW5e PHB Ch. 4)</Text>
                  <Text style={styles.accordionHelper}>
                    Official Rule: Choose any 2 skill proficiencies, a total of 2 tool proficiencies or languages, 1 background feature, and 1 background feat.
                  </Text>

                  <Text style={styles.fieldLabel}>Custom Background Name</Text>
                  <TextInput
                    value={customBgName}
                    onChangeText={setCustomBgName}
                    placeholder="e.g. Coruscant Underworld Courier"
                    placeholderTextColor="#64748B"
                    style={styles.textInput}
                  />

                  <Text style={styles.fieldLabel}>
                    1. Choose 2 Skill Proficiencies ({customBgSkills.length} / 2)
                  </Text>
                  <View style={styles.chipWrap}>
                    {SKILL_KEYS.map((sk) => {
                      const active = customBgSkills.includes(sk);
                      const disabled = !active && customBgSkills.length >= 2;
                      return (
                        <Pressable
                          key={`cbg-sk-${sk}`}
                          onPress={() => {
                            if (active) {
                              setCustomBgSkills((prev) => prev.filter((s) => s !== sk));
                            } else if (customBgSkills.length < 2) {
                              setCustomBgSkills((prev) => [...prev, sk]);
                            }
                          }}
                          style={[
                            styles.choiceChip,
                            active && styles.choiceChipActive,
                            disabled && { opacity: 0.4 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceChipText,
                              active && styles.choiceChipTextActive,
                            ]}
                          >
                            {SKILLS[sk].name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.fieldLabel}>
                    2. Choose 2 Tools or Languages ({customBgTools.length + customBgLanguages.length} / 2)
                  </Text>
                  <Text style={[styles.accordionHelper, { marginBottom: 4 }]}>
                    Tools ({customBgTools.length} selected):
                  </Text>
                  <View style={styles.chipWrap}>
                    {SW5E_TOOL_PROFICIENCIES.map((tool) => {
                      const active = customBgTools.includes(tool);
                      const totalChosen = customBgTools.length + customBgLanguages.length;
                      const disabled = !active && totalChosen >= 2;
                      return (
                        <Pressable
                          key={`cbg-tl-${tool}`}
                          onPress={() => {
                            if (active) {
                              setCustomBgTools((prev) => prev.filter((t) => t !== tool));
                            } else if (totalChosen < 2) {
                              setCustomBgTools((prev) => [...prev, tool]);
                            }
                          }}
                          style={[
                            styles.choiceChip,
                            active && styles.choiceChipActive,
                            disabled && { opacity: 0.4 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceChipText,
                              active && styles.choiceChipTextActive,
                            ]}
                          >
                            {tool}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.accordionHelper, { marginTop: 6, marginBottom: 4 }]}>
                    Languages ({customBgLanguages.length} selected):
                  </Text>
                  <View style={styles.chipWrap}>
                    {GALACTIC_LANGUAGES.filter((l) => l.name !== 'Galactic Basic').map((lang) => {
                      const active = customBgLanguages.includes(lang.name);
                      const totalChosen = customBgTools.length + customBgLanguages.length;
                      const disabled = !active && totalChosen >= 2;
                      return (
                        <Pressable
                          key={`cbg-lg-${lang.name}`}
                          onPress={() => {
                            if (active) {
                              setCustomBgLanguages((prev) => prev.filter((l) => l !== lang.name));
                            } else if (totalChosen < 2) {
                              setCustomBgLanguages((prev) => [...prev, lang.name]);
                            }
                          }}
                          style={[
                            styles.choiceChip,
                            active && styles.choiceChipActive,
                            disabled && { opacity: 0.4 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceChipText,
                              active && styles.choiceChipTextActive,
                            ]}
                          >
                            {lang.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.fieldLabel}>3. Pick a PHB Background Feature (or customize below)</Text>
                  <View style={styles.chipWrap}>
                    {Object.values(BACKGROUND_BENEFITS_MAP).map((b) => {
                      const active = customBgFeatureTitle === b.featureTitle;
                      return (
                        <Pressable
                          key={`cbg-ft-${b.slug}`}
                          onPress={() => {
                            setCustomBgFeatureTitle(b.featureTitle);
                            setCustomBgFeatureDesc(b.featureDescription);
                          }}
                          style={[styles.choiceChip, active && styles.choiceChipActive]}
                        >
                          <Text
                            style={[
                              styles.choiceChipText,
                              active && styles.choiceChipTextActive,
                            ]}
                          >
                            {b.name}: {b.featureTitle}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.fieldLabel}>Feature Title</Text>
                  <TextInput
                    value={customBgFeatureTitle}
                    onChangeText={setCustomBgFeatureTitle}
                    placeholder="Feature Title"
                    placeholderTextColor="#64748B"
                    style={styles.textInput}
                  />
                  <Text style={styles.fieldLabel}>Feature Description</Text>
                  <TextInput
                    value={customBgFeatureDesc}
                    onChangeText={setCustomBgFeatureDesc}
                    placeholder="Describe your custom background feature..."
                    placeholderTextColor="#64748B"
                    multiline
                    style={[styles.textInput, { minHeight: 56 }]}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.bgDetailCard}>
                    <Text style={styles.bgTitle}>{currentBgBenefits.name} Background</Text>
                    <Text style={styles.bgMetaBold}>
                      Granted Skills: {currentBgBenefits.skills.map((s) => SKILLS[s]?.name ?? s).join(', ')}
                    </Text>
                    {currentBgBenefits.skills.some((s) => skillProficiencies[s] === 'proficient' || skillProficiencies[s] === 'expertise') ? (
                      <Text style={{ color: '#D97706', fontSize: 11, fontWeight: '700', marginTop: 3 }}>
                        ⚠ Overlap: You already selected one of these skills from your Class. Per SW5e PHB Ch. 4, you may swap the duplicate skill in Step 1 (Class) or use Custom Background!
                      </Text>
                    ) : null}
                    <Text style={styles.bgMetaBold}>
                      Tool: {selectedTool || currentBgBenefits.toolProficiency} • Default Feat: {currentBgBenefits.defaultFeatName}
                    </Text>
                    <Text style={[styles.bgMetaBold, { marginTop: 6 }]}>
                      Feature: {currentBgBenefits.featureTitle}
                    </Text>
                    <Text style={styles.accordionHelper}>{currentBgBenefits.featureDescription}</Text>
                  </View>

                  {/* Tool Proficiency Selector (All SW5e PHB Tools) */}
                  <Text style={styles.fieldLabel}>Tool Proficiency Choice (SW5e PHB Tools):</Text>
                  <View style={styles.chipWrap}>
                    {SW5E_TOOL_PROFICIENCIES.map((tool) => (
                      <Pressable
                        key={tool}
                        onPress={() => setSelectedTool(tool)}
                        style={[styles.choiceChip, selectedTool === tool && styles.choiceChipActive]}
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            selectedTool === tool && styles.choiceChipTextActive,
                          ]}
                        >
                          {tool}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {/* Granted Background Feat Accordion (matches 01:32 - 01:34) */}
              <View style={styles.choiceAccordion}>
                <View style={styles.choiceAccordionHeader}>
                  <View style={styles.blueExclamation}>
                    <Text style={styles.blueExclamationText}>!</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.choiceAccordionTitle}>Background Granted Feat</Text>
                    <Text style={styles.choiceAccordionSub}>Granted Feat • 1 Choice</Text>
                  </View>
                </View>
                <View style={styles.choiceAccordionBody}>
                  {featEntries.map((ft) => {
                    const active = featIds.includes(ft.id);
                    return (
                      <Pressable
                        key={ft.id}
                        onPress={() => setFeatIds([ft.id])}
                        style={[styles.optionCard, active && styles.optionCardSelected]}
                      >
                        <Text style={styles.optionCardTitle}>
                          {active ? '✓ ' : ''}
                          {ft.name}
                        </Text>
                        <Text style={styles.optionCardDesc}>{ft.description}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Background Ability Score Improvements (matches 01:40 - 01:42) */}
              <View style={styles.choiceAccordion}>
                <View style={styles.choiceAccordionHeader}>
                  <View style={styles.blueExclamation}>
                    <Text style={styles.blueExclamationText}>!</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.choiceAccordionTitle}>Ability Scores Adjustments</Text>
                    <Text style={styles.choiceAccordionSub}>
                      {asiSource === 'species'
                        ? `Official ${currentSpeciesTraits.name} ASI`
                        : `Custom (+2 / +1)`}
                    </Text>
                  </View>
                </View>
                <View style={styles.choiceAccordionBody}>
                  <View style={styles.modeRow}>
                    <Pressable
                      onPress={() => setAsiSource('species')}
                      style={[styles.choiceChip, asiSource === 'species' && styles.choiceChipActive]}
                    >
                      <Text style={[styles.choiceChipText, asiSource === 'species' && styles.choiceChipTextActive]}>
                        {currentSpeciesTraits.name} ASI (Official PHB)
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setAsiSource('custom')}
                      style={[styles.choiceChip, asiSource === 'custom' && styles.choiceChipActive]}
                    >
                      <Text style={[styles.choiceChipText, asiSource === 'custom' && styles.choiceChipTextActive]}>
                        Custom (+2 / +1)
                      </Text>
                    </Pressable>
                  </View>

                  {asiSource === 'species' ? (
                    <View style={{ paddingVertical: spacing.xs }}>
                      <Text style={styles.accordionHelper}>
                        Using official SW5e attribute increases from {currentSpeciesTraits.name}:
                      </Text>
                      <Text style={[styles.staticFeatureTitle, { color: '#00F0FF', marginTop: 4 }]}>
                        {Object.entries(currentSpeciesTraits.abilityBonuses)
                          .map(([ab, b]) => `${ab.toUpperCase()} ${b > 0 ? `+${b}` : b}`)
                          .join(' • ')}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={[styles.modeRow, { marginTop: 8 }]}>
                        <Pressable
                          onPress={() => {
                            setAsiMode('two');
                            if (asiSecondary === asiPrimary) {
                              const other = ABILITIES.find((a) => a !== asiPrimary) ?? 'dex';
                              setAsiSecondary(other);
                            }
                          }}
                          style={[styles.choiceChip, asiMode === 'two' && styles.choiceChipActive]}
                        >
                          <Text
                            style={[
                              styles.choiceChipText,
                              asiMode === 'two' && styles.choiceChipTextActive,
                            ]}
                          >
                            Increase two scores (+2 / +1)
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setAsiMode('three');
                            const remaining = ABILITIES.filter((a) => a !== asiPrimary);
                            setAsiSecondary(remaining[0] ?? 'dex');
                            setAsiThird(remaining[1] ?? 'con');
                          }}
                          style={[styles.choiceChip, asiMode === 'three' && styles.choiceChipActive]}
                        >
                          <Text
                            style={[
                              styles.choiceChipText,
                              asiMode === 'three' && styles.choiceChipTextActive,
                            ]}
                          >
                            Increase three scores (+1 / +1 / +1)
                          </Text>
                        </Pressable>
                      </View>

                  <Text style={styles.fieldLabel}>
                    {asiMode === 'two' ? '+2 Score Bonus:' : 'First +1 Score Bonus:'}
                  </Text>
                  <View style={styles.chipWrap}>
                    {ABILITIES.map((ab) => (
                      <Pressable
                        key={`p-${ab}`}
                        onPress={() => {
                          setAsiPrimary(ab);
                          if (asiSecondary === ab) {
                            const other = ABILITIES.find((a) => a !== ab && a !== asiThird) ?? 'dex';
                            setAsiSecondary(other);
                          }
                        }}
                        style={[styles.choiceChip, asiPrimary === ab && styles.choiceChipActive]}
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            asiPrimary === ab && styles.choiceChipTextActive,
                          ]}
                        >
                          {ab.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>
                    {asiMode === 'two' ? '+1 Score Bonus (Different Ability):' : 'Second +1 Score Bonus (Different Ability):'}
                  </Text>
                  <View style={styles.chipWrap}>
                    {ABILITIES.filter((ab) => ab !== asiPrimary).map((ab) => (
                      <Pressable
                        key={`s-${ab}`}
                        onPress={() => setAsiSecondary(ab)}
                        style={[styles.choiceChip, asiSecondary === ab && styles.choiceChipActive]}
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            asiSecondary === ab && styles.choiceChipTextActive,
                          ]}
                        >
                          {ab.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {asiMode === 'three' ? (
                    <>
                      <Text style={styles.fieldLabel}>Third +1 Score Bonus (Different Ability):</Text>
                      <View style={styles.chipWrap}>
                        {ABILITIES.filter((ab) => ab !== asiPrimary && ab !== asiSecondary).map((ab) => (
                          <Pressable
                            key={`t-${ab}`}
                            onPress={() => setAsiThird(ab)}
                            style={[styles.choiceChip, asiThird === ab && styles.choiceChipActive]}
                          >
                            <Text
                              style={[
                                styles.choiceChipText,
                                asiThird === ab && styles.choiceChipTextActive,
                              ]}
                            >
                              {ab.toUpperCase()}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  ) : null}
                </>
              )}
            </View>
          </View>

              {/* Character Details, Physical & Personal Characteristics (matches 01:44 - 01:46) */}
              <View style={styles.choiceAccordion}>
                <View style={styles.choiceAccordionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.choiceAccordionTitle}>
                      Character Details & Physical Characteristics
                    </Text>
                    <Text style={styles.choiceAccordionSub}>
                      Alignment • Faith • Lifestyle • Hair • Skin • Eyes • Height • Weight • Age • Gender
                    </Text>
                  </View>
                </View>
                <View style={styles.choiceAccordionBody}>
                  <Text style={styles.fieldLabel}>Alignment (SW5e PHB Ch. 4)</Text>
                  <View style={styles.chipWrap}>
                    {[
                      'Lawful Light',
                      'Neutral Light',
                      'Chaotic Light',
                      'Lawful Balanced',
                      'Balanced',
                      'Chaotic Balanced',
                      'Lawful Dark',
                      'Neutral Dark',
                      'Chaotic Dark',
                    ].map((al) => (
                      <Pressable
                        key={al}
                        onPress={() => setAlignment(al)}
                        style={[styles.choiceChip, alignment === al && styles.choiceChipActive]}
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            alignment === al && styles.choiceChipTextActive,
                          ]}
                        >
                          {al}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.twoColInputs}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Faith / Code</Text>
                      <TextInput
                        value={faith}
                        onChangeText={setFaith}
                        placeholder="Jedi Code / Creed..."
                        placeholderTextColor="#64748B"
                        style={styles.textInput}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Gender</Text>
                      <TextInput
                        value={gender}
                        onChangeText={setGender}
                        placeholder="Gender"
                        placeholderTextColor="#64748B"
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  <View style={styles.twoColInputs}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Age</Text>
                      <TextInput
                        value={age}
                        onChangeText={setAge}
                        placeholder="e.g. 26"
                        placeholderTextColor="#64748B"
                        style={styles.textInput}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Height & Weight</Text>
                      <TextInput
                        value={height}
                        onChangeText={setHeight}
                        placeholder="6'0, 180 lbs"
                        placeholderTextColor="#64748B"
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  <View style={styles.twoColInputs}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Hair & Eyes</Text>
                      <TextInput
                        value={hair}
                        onChangeText={setHair}
                        placeholder="Dark brown / Blue"
                        placeholderTextColor="#64748B"
                        style={styles.textInput}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Skin</Text>
                      <TextInput
                        value={skin}
                        onChangeText={setSkin}
                        placeholder="Tan / Blue / Fur"
                        placeholderTextColor="#64748B"
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  {(() => {
                    const bgPersonality = getBackgroundPersonality(backgroundId);
                    const classGuide = getClassRoleplayGuide(classKey);
                    const pickRandom = <T,>(arr: readonly T[]): T =>
                      arr[Math.floor(Math.random() * arr.length)]!;

                    const renderPresetField = (
                      key: 'traits' | 'ideals' | 'bonds' | 'flaws',
                      label: string,
                      value: string,
                      onChange: (val: string) => void,
                      bgOptions: readonly string[],
                      classOptions: readonly string[],
                    ) => {
                      const isOpen = openPersonalityPicker === key;
                      return (
                        <View key={key} style={{ marginTop: 8 }}>
                          <View style={styles.personalityHeaderRow}>
                            <Text style={styles.fieldLabel}>{label}</Text>
                            <Pressable
                              onPress={() =>
                                setOpenPersonalityPicker(isOpen ? null : key)
                              }
                              style={styles.presetToggleBtn}
                            >
                              <Text style={styles.presetToggleText}>
                                {isOpen ? 'Hide PHB List ▴' : '📋 PHB & Class Options ▾'}
                              </Text>
                            </Pressable>
                          </View>
                          <TextInput
                            value={value}
                            onChangeText={onChange}
                            placeholder={`Enter or select ${label.toLowerCase()}...`}
                            placeholderTextColor="#64748B"
                            multiline
                            style={styles.textInput}
                          />
                          {isOpen ? (
                            <View style={styles.presetListBox}>
                              <Text style={styles.presetGroupLabel}>
                                {isCustomBg ? 'PHB Suggestions' : `${currentBgBenefits.name} (PHB)`}:
                              </Text>
                              {bgOptions.map((opt, idx) => (
                                <Pressable
                                  key={`${key}-bg-${idx}`}
                                  onPress={() => {
                                    onChange(opt);
                                    setOpenPersonalityPicker(null);
                                  }}
                                  style={[
                                    styles.presetOptionRow,
                                    value === opt && styles.presetOptionRowActive,
                                  ]}
                                >
                                  <Text style={styles.presetOptionText}>• {opt}</Text>
                                </Pressable>
                              ))}
                              <Text style={[styles.presetGroupLabel, { marginTop: 6 }]}>
                                {CLASS_SPECS[classKey].name} Class Suggestions:
                              </Text>
                              {classOptions.map((opt, idx) => (
                                <Pressable
                                  key={`${key}-cls-${idx}`}
                                  onPress={() => {
                                    onChange(opt);
                                    setOpenPersonalityPicker(null);
                                  }}
                                  style={[
                                    styles.presetOptionRow,
                                    value === opt && styles.presetOptionRowActive,
                                  ]}
                                >
                                  <Text style={styles.presetOptionText}>⚔ {opt}</Text>
                                </Pressable>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      );
                    };

                    return (
                      <View style={{ marginTop: 6 }}>
                        <View style={styles.personalityTopBar}>
                          <Text style={[styles.fieldLabel, { marginTop: 0 }]}>
                            Personality Traits, Ideals, Bonds & Flaws
                          </Text>
                          <Pressable
                            onPress={() => {
                              setPersonalityTraits(pickRandom(bgPersonality.personalityTraits));
                              setIdeals(pickRandom(bgPersonality.ideals));
                              setBonds(pickRandom(bgPersonality.bonds));
                              setFlaws(pickRandom(bgPersonality.flaws));
                            }}
                            style={styles.rollPersonalityBtn}
                          >
                            <Text style={styles.rollPersonalityText}>🎲 Roll Random (PHB)</Text>
                          </Pressable>
                        </View>
                        {renderPresetField(
                          'traits',
                          'Personality Traits',
                          personalityTraits,
                          setPersonalityTraits,
                          bgPersonality.personalityTraits,
                          classGuide.suggestedTraits,
                        )}
                        {renderPresetField(
                          'ideals',
                          'Ideals',
                          ideals,
                          setIdeals,
                          bgPersonality.ideals,
                          classGuide.suggestedIdeals,
                        )}
                        {renderPresetField(
                          'bonds',
                          'Bonds',
                          bonds,
                          setBonds,
                          bgPersonality.bonds,
                          classGuide.suggestedBonds,
                        )}
                        {renderPresetField(
                          'flaws',
                          'Flaws',
                          flaws,
                          setFlaws,
                          bgPersonality.flaws,
                          classGuide.suggestedFlaws,
                        )}
                      </View>
                    );
                  })()}
                  <Text style={styles.fieldLabel}>Backstory & Notes</Text>
                  <TextInput
                    value={backstory}
                    onChangeText={setBackstory}
                    placeholder="Character backstory, organizations, allies, and enemies..."
                    placeholderTextColor="#64748B"
                    multiline
                    style={[styles.textInput, { minHeight: 68 }]}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {/* ================= STEP 3: SPECIES (matches 01:50 - 02:08) ================= */}
          {step === 'species' ? (
            !speciesConfirmed ? (
              <View style={styles.cardSection}>
                <Text style={styles.stepTitle}>Choose Origin: Species</Text>
                <TextInput
                  value={speciesSearch}
                  onChangeText={setSpeciesSearch}
                  placeholder="Search species..."
                  placeholderTextColor="#64748B"
                  style={styles.searchInput}
                />

                {speciesEntries
                  .filter((sp) =>
                    sp.name.toLowerCase().includes(speciesSearch.trim().toLowerCase()),
                  )
                  .map((sp) => (
                    <Pressable
                      key={sp.id}
                      onPress={() => setPreviewSpecies(sp)}
                      style={styles.selectRowCard}
                    >
                      <View style={styles.classBadgeBox}>
                        <Text style={styles.classBadgeGlyph}>🧬</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.selectRowTitle}>{sp.name.toUpperCase()}</Text>
                        <Text style={styles.selectRowSub}>Player’s Handbook • {sp.summary}</Text>
                      </View>
                      <Text style={styles.chevronRight}>›</Text>
                    </Pressable>
                  ))}
              </View>
            ) : (
              /* Species Details & Choices Page (matches 01:56 - 02:08 in video) */
              <View style={styles.cardSection}>
                <View style={styles.selectedClassHeaderRow}>
                  <Text style={styles.selectedClassName}>{speciesName} Details Page</Text>
                  <Pressable
                    onPress={() => setSpeciesConfirmed(false)}
                    style={styles.changeSpeciesBtn}
                  >
                    <Text style={styles.changeSpeciesText}>Change Species</Text>
                  </Pressable>
                </View>

                {/* Size & Speed Details */}
                <View style={styles.choiceAccordion}>
                  <View style={styles.choiceAccordionHeader}>
                    <View style={styles.blueExclamation}>
                      <Text style={styles.blueExclamationText}>⚡</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.choiceAccordionTitle}>Size & Mobility</Text>
                      <Text style={styles.choiceAccordionSub}>
                        {speciesSize} • Walk {currentSpeciesTraits.speed} ft
                        {currentSpeciesTraits.climbSpeed ? ` • Climb ${currentSpeciesTraits.climbSpeed} ft` : ''}
                        {currentSpeciesTraits.swimSpeed ? ` • Swim ${currentSpeciesTraits.swimSpeed} ft` : ''}
                        {currentSpeciesTraits.darkvision ? ` • Darkvision ${currentSpeciesTraits.darkvision} ft` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.choiceAccordionBody}>
                    <Text style={styles.accordionHelper}>
                      {currentSpeciesTraits.name} standard size is {currentSpeciesTraits.size}. Walking speed is {currentSpeciesTraits.speed} feet.
                      {currentSpeciesTraits.darkvision ? ` You have Darkvision out to ${currentSpeciesTraits.darkvision} feet.` : ''}
                    </Text>
                    <View style={styles.chipWrap}>
                      {['Medium', 'Small'].map((sz) => (
                        <Pressable
                          key={sz}
                          onPress={() => setSpeciesSize(sz)}
                          style={[styles.choiceChip, speciesSize === sz && styles.choiceChipActive]}
                        >
                          <Text
                            style={[
                              styles.choiceChipText,
                              speciesSize === sz && styles.choiceChipTextActive,
                            ]}
                          >
                            {sz}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Species Traits */}
                {currentSpeciesTraits.traits.length > 0 && (
                  <View style={styles.choiceAccordion}>
                    <View style={styles.choiceAccordionHeader}>
                      <View style={styles.blueExclamation}>
                        <Text style={styles.blueExclamationText}>🧬</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.choiceAccordionTitle}>Species Traits</Text>
                        <Text style={styles.choiceAccordionSub}>
                          {currentSpeciesTraits.traits.length} Traits • {currentSpeciesTraits.name}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.choiceAccordionBody}>
                      {currentSpeciesTraits.traits.map((tr, idx) => (
                        <View key={idx} style={{ marginBottom: 12 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 2 }}>
                            {tr.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#334155', lineHeight: 18 }}>
                            {tr.description}
                          </Text>
                        </View>
                      ))}
                      {currentSpeciesTraits.inherentSkills.length > 0 && (
                        <View style={{ marginTop: 6, padding: 8, backgroundColor: '#EFF6FF', borderRadius: 6 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E40AF' }}>
                            Inherent Skills: {currentSpeciesTraits.inherentSkills.map((s) => SKILLS[s]?.name || s).join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Skillful Choice (if species offers flexible skill) */}
                {currentSpeciesTraits.hasFlexibleSkillChoice && (
                  <View style={styles.choiceAccordion}>
                    <View style={styles.choiceAccordionHeader}>
                      <View style={styles.blueExclamation}>
                        <Text style={styles.blueExclamationText}>!</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.choiceAccordionTitle}>Skillful</Text>
                        <Text style={styles.choiceAccordionSub}>
                          Choose 1 bonus skill: {SKILLS[speciesSkillChoice]?.name || speciesSkillChoice}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.choiceAccordionBody}>
                      <View style={styles.chipWrap}>
                        {SKILL_KEYS.map((sk) => (
                          <Pressable
                            key={sk}
                            onPress={() => setSpeciesSkillChoice(sk)}
                            style={[
                              styles.choiceChip,
                              speciesSkillChoice === sk && styles.choiceChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.choiceChipText,
                                speciesSkillChoice === sk && styles.choiceChipTextActive,
                              ]}
                            >
                              {SKILLS[sk].name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                )}

                {/* Languages Choice + Standard Languages Table (matches 02:06 - 02:08 in video) */}
                <View style={styles.choiceAccordion}>
                  <View style={styles.choiceAccordionHeader}>
                    <View style={styles.blueExclamation}>
                      <Text style={styles.blueExclamationText}>!</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.choiceAccordionTitle}>Languages</Text>
                      <Text style={styles.choiceAccordionSub}>
                        Origin & Galactic Languages ({languages.join(', ')})
                      </Text>
                    </View>
                  </View>
                  <View style={styles.choiceAccordionBody}>
                    <View style={styles.chipWrap}>
                      {GALACTIC_LANGUAGES.map((lang) => {
                        const isNative =
                          currentSpeciesTraits.languages.includes(lang.name) ||
                          lang.name === 'Galactic Basic';
                        const known = languages.includes(lang.name) || isNative;
                        return (
                          <Pressable
                            key={lang.name}
                            onPress={() => {
                              if (isNative) return;
                              setLanguages((prev) =>
                                prev.includes(lang.name)
                                  ? prev.filter((l) => l !== lang.name)
                                  : [...prev, lang.name],
                              );
                            }}
                            style={[
                              styles.choiceChip,
                              known && styles.choiceChipActive,
                              isNative && { borderColor: '#10B981', borderWidth: 1.5 },
                            ]}
                          >
                            <Text
                              style={[
                                styles.choiceChipText,
                                known && styles.choiceChipTextActive,
                              ]}
                            >
                              {lang.name} {isNative ? '(Native)' : ''}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                      Standard Galactic Languages
                    </Text>
                    <View style={styles.langTable}>
                      <View style={styles.langTableHeader}>
                        <Text style={[styles.langCellBold, { width: 48 }]}>d15</Text>
                        <Text style={[styles.langCellBold, { flex: 1 }]}>Language</Text>
                        <Text style={[styles.langCellBold, { flex: 1 }]}>Origin</Text>
                      </View>
                      {GALACTIC_LANGUAGES.map((l, idx) => (
                        <View
                          key={l.name}
                          style={[
                            styles.langTableRow,
                            idx % 2 === 1 && { backgroundColor: '#E0F2FE' },
                          ]}
                        >
                          <Text style={[styles.langCell, { width: 48 }]}>{l.roll}</Text>
                          <Text style={[styles.langCell, { flex: 1, fontWeight: '700' }]}>
                            {l.name}
                          </Text>
                          <Text style={[styles.langCell, { flex: 1 }]}>{l.origin}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )
          ) : null}

          {/* ================= STEP 4: ABILITIES (matches 02:10 - 02:22) ================= */}
          {step === 'abilities' ? (
            <View style={styles.cardSection}>
              <Text style={styles.stepTitle}>Ability Scores</Text>

              {/* Generation Method Selector */}
              <View style={styles.modeRow}>
                {(
                  [
                    { k: 'standard_array', label: 'Standard Array' },
                    { k: 'manual', label: 'Rolled / Manual' },
                    { k: 'point_buy', label: 'Point Buy' },
                  ] as const
                ).map((m) => (
                  <Pressable
                    key={m.k}
                    onPress={() => {
                      setAbilityMethod(m.k);
                      if (m.k === 'standard_array') {
                        setBaseScores({
                          str: STANDARD_ARRAY[standardAssignments.str] ?? 15,
                          dex: STANDARD_ARRAY[standardAssignments.dex] ?? 14,
                          con: STANDARD_ARRAY[standardAssignments.con] ?? 13,
                          int: STANDARD_ARRAY[standardAssignments.int] ?? 12,
                          wis: STANDARD_ARRAY[standardAssignments.wis] ?? 10,
                          cha: STANDARD_ARRAY[standardAssignments.cha] ?? 8,
                        });
                      } else if (m.k === 'manual' && manualSubMode === 'rolled' && rolledPool.length === 6) {
                        setBaseScores({
                          str: rolledPool[rolledAssignments.str]?.total ?? 10,
                          dex: rolledPool[rolledAssignments.dex]?.total ?? 10,
                          con: rolledPool[rolledAssignments.con]?.total ?? 10,
                          int: rolledPool[rolledAssignments.int]?.total ?? 10,
                          wis: rolledPool[rolledAssignments.wis]?.total ?? 10,
                          cha: rolledPool[rolledAssignments.cha]?.total ?? 10,
                        });
                      }
                    }}
                    style={[styles.choiceChip, abilityMethod === m.k && styles.choiceChipActive]}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        abilityMethod === m.k && styles.choiceChipTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Point Buy Budget Display */}
              {abilityMethod === 'point_buy' ? (() => {
                const pointsSpent = calculatePointBuySpent(baseScores);
                const pointsRemaining = POINT_BUY_BUDGET - pointsSpent;
                return (
                  <View style={styles.pointBuyBar}>
                    <Text style={styles.pointBuyText}>
                      Points Remaining:{' '}
                      <Text
                        style={{
                          fontWeight: '800',
                          color: pointsRemaining >= 0 ? '#10B981' : '#EF4444',
                        }}
                      >
                        {pointsRemaining} / {POINT_BUY_BUDGET}
                      </Text>
                    </Text>
                    <Pressable
                      onPress={() =>
                        setBaseScores({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })
                      }
                      style={styles.pointBuyResetBtn}
                    >
                      <Text style={styles.pointBuyResetText}>RESET TO 8s</Text>
                    </Pressable>
                  </View>
                );
              })() : null}

              {/* Standard Array Pool Overview */}
              {abilityMethod === 'standard_array' ? (
                <View style={styles.poolCard}>
                  <Text style={styles.poolTitle}>
                    Standard Array Pool (Tap a value inside each Ability below to assign/swap):
                  </Text>
                  <View style={styles.chipWrap}>
                    {STANDARD_ARRAY.map((val, idx) => {
                      const assignedAb = ABILITIES.find((a) => standardAssignments[a] === idx);
                      return (
                        <View key={`sa-pool-${idx}`} style={styles.poolBadge}>
                          <Text style={styles.poolBadgeVal}>{val}</Text>
                          <Text style={styles.poolBadgeAb}>
                            {assignedAb ? assignedAb.toUpperCase() : '—'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* Manual / Rolled Sub-Mode & Pool */}
              {abilityMethod === 'manual' ? (
                <View style={{ marginTop: 8, marginBottom: 8 }}>
                  <View style={[styles.modeRow, { marginBottom: 8 }]}>
                    <Pressable
                      onPress={() => setManualSubMode('rolled')}
                      style={[
                        styles.choiceChip,
                        manualSubMode === 'rolled' && styles.choiceChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceChipText,
                          manualSubMode === 'rolled' && styles.choiceChipTextActive,
                        ]}
                      >
                        🎲 4d6 Drop Lowest Pool
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setManualSubMode('direct')}
                      style={[
                        styles.choiceChip,
                        manualSubMode === 'direct' && styles.choiceChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceChipText,
                          manualSubMode === 'direct' && styles.choiceChipTextActive,
                        ]}
                      >
                        ✏️ Direct Stepper (+/-)
                      </Text>
                    </Pressable>
                  </View>

                  {manualSubMode === 'rolled' ? (
                    <View style={styles.poolCard}>
                      <Pressable
                        onPress={() => {
                          const rollOne = () => {
                            const dice = Array.from(
                              { length: 4 },
                              () => Math.floor(Math.random() * 6) + 1,
                            ).sort((a, b) => a - b);
                            const total = (dice[1] ?? 0) + (dice[2] ?? 0) + (dice[3] ?? 0);
                            return { total, dice };
                          };
                          const pool = Array.from({ length: 6 }, rollOne).sort(
                            (a, b) => b.total - a.total,
                          );
                          const defaultAssign: Record<AbilityKey, number> = {
                            str: 0,
                            dex: 1,
                            con: 2,
                            int: 3,
                            wis: 4,
                            cha: 5,
                          };
                          setRolledPool(pool);
                          setRolledAssignments(defaultAssign);
                          setBaseScores({
                            str: pool[0]!.total,
                            dex: pool[1]!.total,
                            con: pool[2]!.total,
                            int: pool[3]!.total,
                            wis: pool[4]!.total,
                            cha: pool[5]!.total,
                          });
                        }}
                        style={styles.applyPresetBtn}
                      >
                        <Text style={styles.applyPresetBtnText}>
                          🎲 ROLL 6 SCORES (4d6 DROP LOWEST)
                        </Text>
                      </Pressable>

                      {rolledPool.length === 6 ? (
                        <>
                          <Text style={styles.poolTitle}>
                            Rolled Pool (Tap a score inside each Ability below to assign/swap):
                          </Text>
                          <View style={styles.chipWrap}>
                            {rolledPool.map((r, idx) => {
                              const assignedAb = ABILITIES.find((a) => rolledAssignments[a] === idx);
                              return (
                                <View key={`rp-${idx}`} style={styles.poolBadge}>
                                  <Text style={styles.poolBadgeVal}>{r.total}</Text>
                                  <Text style={styles.poolBadgeDice}>[{r.dice.join(',')}]</Text>
                                  <Text style={styles.poolBadgeAb}>
                                    {assignedAb ? assignedAb.toUpperCase() : '—'}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </>
                      ) : (
                        <Text style={styles.accordionHelper}>
                          Tap the button above to roll 6 ability scores, then assign each result to your chosen abilities.
                        </Text>
                      )}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* 2x3 Ability Score Controls with Individual Assignment & ASI Preview */}
              <View style={styles.abilitiesGrid}>
                {ABILITIES.map((ab) => {
                  const asiBonus = bonusMap[ab];
                  const assignStandardSlot = (slotIdx: number) => {
                    const prevHolder = ABILITIES.find((a) => standardAssignments[a] === slotIdx);
                    const currentSlot = standardAssignments[ab];
                    const next = { ...standardAssignments, [ab]: slotIdx };
                    if (prevHolder && prevHolder !== ab) {
                      next[prevHolder] = currentSlot;
                    }
                    setStandardAssignments(next);
                    setBaseScores({
                      str: STANDARD_ARRAY[next.str] ?? 15,
                      dex: STANDARD_ARRAY[next.dex] ?? 14,
                      con: STANDARD_ARRAY[next.con] ?? 13,
                      int: STANDARD_ARRAY[next.int] ?? 12,
                      wis: STANDARD_ARRAY[next.wis] ?? 10,
                      cha: STANDARD_ARRAY[next.cha] ?? 8,
                    });
                  };

                  const assignRolledSlot = (slotIdx: number) => {
                    if (rolledPool.length !== 6) return;
                    const prevHolder = ABILITIES.find((a) => rolledAssignments[a] === slotIdx);
                    const currentSlot = rolledAssignments[ab];
                    const next = { ...rolledAssignments, [ab]: slotIdx };
                    if (prevHolder && prevHolder !== ab) {
                      next[prevHolder] = currentSlot;
                    }
                    setRolledAssignments(next);
                    setBaseScores({
                      str: rolledPool[next.str]?.total ?? 10,
                      dex: rolledPool[next.dex]?.total ?? 10,
                      con: rolledPool[next.con]?.total ?? 10,
                      int: rolledPool[next.int]?.total ?? 10,
                      wis: rolledPool[next.wis]?.total ?? 10,
                      cha: rolledPool[next.cha]?.total ?? 10,
                    });
                  };

                  return (
                    <View key={ab} style={styles.abilityControlBox}>
                      <Text style={styles.abilityControlTitle}>
                        {ABILITY_NAMES[ab].toUpperCase()}
                      </Text>

                      {abilityMethod === 'standard_array' ? (
                        <View style={styles.slotPickerWrap}>
                          {STANDARD_ARRAY.map((val, idx) => {
                            const selected = standardAssignments[ab] === idx;
                            return (
                              <Pressable
                                key={`${ab}-sa-${idx}`}
                                onPress={() => assignStandardSlot(idx)}
                                style={[styles.slotChip, selected && styles.slotChipActive]}
                              >
                                <Text
                                  style={[
                                    styles.slotChipText,
                                    selected && styles.slotChipTextActive,
                                  ]}
                                >
                                  {val}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : abilityMethod === 'manual' &&
                        manualSubMode === 'rolled' &&
                        rolledPool.length === 6 ? (
                        <View style={styles.slotPickerWrap}>
                          {rolledPool.map((r, idx) => {
                            const selected = rolledAssignments[ab] === idx;
                            return (
                              <Pressable
                                key={`${ab}-rp-${idx}`}
                                onPress={() => assignRolledSlot(idx)}
                                style={[styles.slotChip, selected && styles.slotChipActive]}
                              >
                                <Text
                                  style={[
                                    styles.slotChipText,
                                    selected && styles.slotChipTextActive,
                                  ]}
                                >
                                  {r.total}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : (
                        <View style={styles.abilityStepper}>
                          <Pressable
                            onPress={() => {
                              if (abilityMethod === 'point_buy') {
                                setBaseScores((prev) => ({
                                  ...prev,
                                  [ab]: Math.max(8, prev[ab] - 1),
                                }));
                              } else {
                                setBaseScores((prev) => ({
                                  ...prev,
                                  [ab]: Math.max(3, prev[ab] - 1),
                                }));
                              }
                            }}
                            style={styles.abilityStepBtn}
                          >
                            <Text style={styles.abilityStepText}>-</Text>
                          </Pressable>
                          <Text style={styles.abilityBaseVal}>{baseScores[ab]}</Text>
                          <Pressable
                            onPress={() => {
                              if (abilityMethod === 'point_buy') {
                                const nextVal = baseScores[ab] + 1;
                                if (nextVal <= 15) {
                                  const nextSpent = calculatePointBuySpent({
                                    ...baseScores,
                                    [ab]: nextVal,
                                  });
                                  if (nextSpent <= POINT_BUY_BUDGET) {
                                    setBaseScores((prev) => ({ ...prev, [ab]: nextVal }));
                                  }
                                }
                              } else {
                                setBaseScores((prev) => ({
                                  ...prev,
                                  [ab]: Math.min(18, prev[ab] + 1),
                                }));
                              }
                            }}
                            style={styles.abilityStepBtn}
                          >
                            <Text style={styles.abilityStepText}>+</Text>
                          </Pressable>
                        </View>
                      )}

                      <Text style={styles.abilityTotalText}>
                        Base {baseScores[ab]}
                        {asiBonus !== 0 ? ` ${asiBonus > 0 ? `+${asiBonus}` : asiBonus}` : ''} ={' '}
                        {finalScores[ab]} ({formatSigned(abilityModifier(finalScores[ab]))})
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Score Calculations Breakdown Cards (matches 02:10 & 02:22 in video) */}
              <Text style={styles.stepTitle}>Score Calculations</Text>
              <Text style={styles.rulesGroupSub}>
                Calculations, including the base scores you set above and any modifiers, are found below.
              </Text>

              {ABILITIES.map((ab) => {
                const total = finalScores[ab];
                const mod = abilityModifier(total);
                return (
                  <View key={`calc-${ab}`} style={styles.calcTableCard}>
                    <View style={styles.calcHeaderBar}>
                      <Text style={styles.calcHeaderTitle}>
                        🎲 {ABILITY_NAMES[ab].toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.calcRow, styles.calcRowBlue]}>
                      <Text style={styles.calcRowLabelBold}>Total Score</Text>
                      <Text style={styles.calcRowValBold}>{total}</Text>
                    </View>
                    <View style={[styles.calcRow, styles.calcRowBlue]}>
                      <Text style={styles.calcRowLabelBold}>Modifier</Text>
                      <Text style={styles.calcRowValBold}>{formatSigned(mod)}</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcRowLabel}>Base Score</Text>
                      <Text style={styles.calcRowVal}>{baseScores[ab]}</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcRowLabel}>Bonus (Origin / Background)</Text>
                      <Text style={styles.calcRowVal}>{formatSigned(bonusMap[ab])}</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcRowLabel}>Set Score</Text>
                      <Text style={styles.calcRowVal}>0</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcRowLabel}>Stacking Bonus</Text>
                      <Text style={styles.calcRowVal}>+0</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* ================= STEP 5: EQUIPMENT (matches 02:24 - 02:42) ================= */}
          {step === 'equipment' ? (
            <View style={styles.cardSection}>
              <Text style={styles.stepTitle}>Choose Equipment</Text>

              {/* Starting Equipment Accordion */}
              <View style={styles.choiceAccordion}>
                <View style={styles.choiceAccordionHeader}>
                  <Text style={styles.choiceAccordionTitle}>Starting Equipment</Text>
                </View>
                <View style={styles.choiceAccordionBody}>
                  <Text style={styles.fieldLabel}>
                    {CLASS_SPECS[classKey].name} Starting Equipment
                  </Text>
                  <Pressable
                    onPress={() => setClassPkgOption('A')}
                    style={styles.checkboxRow}
                  >
                    <View style={[styles.checkbox, classPkgOption === 'A' && styles.checkboxChecked]}>
                      {classPkgOption === 'A' ? <Text style={styles.checkboxMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      {CLASS_STARTING_EQUIPMENT[classKey].packageALabel}
                    </Text>
                  </Pressable>
                  <Text style={styles.orDivider}>OR</Text>
                  <Pressable
                    onPress={() => setClassPkgOption('B')}
                    style={styles.checkboxRow}
                  >
                    <View style={[styles.checkbox, classPkgOption === 'B' && styles.checkboxChecked]}>
                      {classPkgOption === 'B' ? <Text style={styles.checkboxMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      (B) {CLASS_STARTING_EQUIPMENT[classKey].packageBCredits} CR
                    </Text>
                  </Pressable>

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                    {isCustomBg ? (customBgName || 'Custom Background') : backgroundName} Starting Equipment
                  </Text>
                  <Pressable onPress={() => setBgPkgOption('A')} style={styles.checkboxRow}>
                    <View style={[styles.checkbox, bgPkgOption === 'A' && styles.checkboxChecked]}>
                      {bgPkgOption === 'A' ? <Text style={styles.checkboxMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      (A) {currentBgPkg.label}
                    </Text>
                  </Pressable>
                  <Text style={styles.orDivider}>OR</Text>
                  <Pressable onPress={() => setBgPkgOption('B')} style={styles.checkboxRow}>
                    <View style={[styles.checkbox, bgPkgOption === 'B' && styles.checkboxChecked]}>
                      {bgPkgOption === 'B' ? <Text style={styles.checkboxMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.checkboxLabel}>(B) {currentBgPkg.credits + 150} CR (Credits Only)</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleApplyStartingEquipment}
                    style={styles.addStartingEquipBtn}
                  >
                    <Text style={styles.addStartingEquipBtnText}>ADD STARTING EQUIPMENT</Text>
                  </Pressable>
                </View>
              </View>

              {/* Green Toast Notification (matches 02:36 in video) */}
              {equipToast ? (
                <View style={styles.greenToast}>
                  <Text style={styles.greenToastTitle}>Equipment Chosen</Text>
                  <Text style={styles.greenToastSub}>Starting Equipment Added to Inventory</Text>
                </View>
              ) : null}

              {/* Current Inventory (matches 02:36 - 02:38) */}
              <View style={styles.choiceAccordion}>
                <View style={styles.choiceAccordionHeader}>
                  <Text style={styles.choiceAccordionTitle}>
                    Current Inventory ({inventory.length})
                  </Text>
                  <Text style={styles.choiceAccordionSub}>Total Weight: {totalWeight.toFixed(1)} lb</Text>
                </View>
                <View style={styles.choiceAccordionBody}>
                  {inventory.length === 0 ? (
                    <Text style={styles.accordionHelper}>
                      No items in inventory yet. Click "ADD STARTING EQUIPMENT" above or add items from the catalog below.
                    </Text>
                  ) : null}
                  {inventory.map((item) => {
                    const armorProfs = CLASS_SPECS[classKey].armorProficiencies.map((p) => p.toLowerCase());
                    const isArmorProf =
                      item.kind !== 'armor' ||
                      !item.armorCategory ||
                      armorProfs.some((p) => p.includes(item.armorCategory!));
                    const isShieldProf =
                      item.kind !== 'shield' ||
                      armorProfs.some((p) => p.includes('shield'));
                    const notProficient = item.equipped && (!isArmorProf || !isShieldProf);

                    return (
                      <View key={item.id} style={styles.invRowCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.invItemName}>{item.name}</Text>
                          <Text style={styles.invItemSub}>
                            {item.kind.toUpperCase()} • {(item.weight * item.quantity).toFixed(1)} lb
                            {item.baseAc ? ` • AC ${item.baseAc}` : ''}
                            {item.shieldAcBonus ? ` • +${item.shieldAcBonus} AC` : ''}
                            {item.damageDice ? ` • ${item.damageDice} ${item.damageType ?? ''}` : ''}
                          </Text>
                          {notProficient ? (
                            <Text style={{ color: '#DC2626', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                              ⚠ Not proficient with this {item.kind}
                            </Text>
                          ) : null}
                        </View>
                        {item.kind === 'weapon' || item.kind === 'armor' || item.kind === 'shield' ? (
                          <Pressable
                            onPress={() =>
                              setInventory((prev) =>
                                prev.map((i) => {
                                  if (i.id === item.id) {
                                    return { ...i, equipped: !i.equipped };
                                  }
                                  // Only one armor or one shield can be worn at a time
                                  if (!item.equipped && (item.kind === 'armor' || item.kind === 'shield') && i.kind === item.kind) {
                                    return { ...i, equipped: false };
                                  }
                                  return i;
                                }),
                              )
                            }
                            style={[
                              styles.wieldWearBtn,
                              item.equipped && styles.wieldWearBtnActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.wieldWearText,
                                item.equipped && styles.wieldWearTextActive,
                              ]}
                            >
                              {item.kind === 'weapon' ? 'WIELD' : 'WEAR'}
                            </Text>
                          </Pressable>
                        ) : null}
                        <View style={styles.qtyControlRow}>
                          <Pressable
                            onPress={() =>
                              setInventory((prev) =>
                                prev
                                  .map((i) =>
                                    i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
                                  )
                                  .filter((i) => i.quantity > 0),
                              )
                            }
                            style={styles.qtyMiniBtn}
                          >
                            <Text style={styles.qtyMiniBtnText}>-</Text>
                          </Pressable>
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                          <Pressable
                            onPress={() =>
                              setInventory((prev) =>
                                prev.map((i) =>
                                  i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
                                ),
                              )
                            }
                            style={styles.qtyMiniBtn}
                          >
                            <Text style={styles.qtyMiniBtnText}>+</Text>
                          </Pressable>
                          <Pressable
                            onPress={() =>
                              setInventory((prev) => prev.filter((i) => i.id !== item.id))
                            }
                            style={styles.invDeleteBtn}
                          >
                            <Text style={styles.invDeleteText}>✕</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Add Items Catalog Browser (matches 02:40) */}
              <View style={styles.choiceAccordion}>
                <View style={styles.choiceAccordionHeader}>
                  <Text style={styles.choiceAccordionTitle}>Add Items</Text>
                </View>
                <View style={styles.choiceAccordionBody}>
                  <TextInput
                    value={itemSearch}
                    onChangeText={setItemSearch}
                    placeholder="Filter weapons, armor, gear..."
                    placeholderTextColor="#64748B"
                    style={styles.searchInput}
                  />
                  {catalogItems
                    .filter((c) =>
                      c.name.toLowerCase().includes(itemSearch.trim().toLowerCase()),
                    )
                    .slice(0, 12)
                    .map((item) => (
                      <View key={item.id} style={styles.catalogAddRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.invItemName}>{item.name}</Text>
                          <Text style={styles.invItemSub}>
                            {item.contentType.toUpperCase()} • {item.summary}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => handleAddCatalogItem(item)}
                          style={styles.greenAddBtn}
                        >
                          <Text style={styles.greenAddBtnText}>ADD</Text>
                        </Pressable>
                      </View>
                    ))}
                </View>
              </View>

              {/* Currency Breakdown (matches 02:42) */}
              <View style={styles.choiceAccordion}>
                <View style={styles.choiceAccordionHeader}>
                  <Text style={styles.choiceAccordionTitle}>Currency</Text>
                  <Text style={styles.choiceAccordionSub}>Total in CR: {credits}</Text>
                </View>
                <View style={styles.choiceAccordionBody}>
                  <Text style={styles.totalCreditsDisplay}>💳 {credits} CR</Text>
                  <View style={styles.currencyInputRow}>
                    <Text style={styles.currencyLabel}>Galactic Credits (CR)</Text>
                    <TextInput
                      value={String(credits)}
                      onChangeText={(v) => setCredits(Math.max(0, parseInt(v, 10) || 0))}
                      keyboardType="numeric"
                      style={styles.currencyInput}
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* ================= STEP 6: WHAT'S NEXT (matches 02:44 - 02:46) ================= */}
          {step === 'whats_next' ? (
            <View style={styles.cardSection}>
              <Text style={styles.rulesGroupSub}>
                Once you have completed creating your character, you can view your statistics on the interactive digital character sheet or export it.
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => handleFinish(true)}
                style={styles.whatsNextPrimaryBtn}
              >
                <Text style={styles.whatsNextPrimaryBtnText}>👤 VIEW CHARACTER SHEET</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => handleFinish(false)}
                style={styles.whatsNextSecondaryBtn}
              >
                <Text style={styles.whatsNextSecondaryBtnText}>📄 SAVE & EXPORT CHARACTER</Text>
              </Pressable>

              <Pressable onPress={() => handleFinish(false)} style={styles.linkCenterBtn}>
                <Text style={styles.linkCenterText}>VIEW ALL MY CHARACTERS</Text>
              </Pressable>

              <View style={styles.comeTogetherBox}>
                <Text style={styles.stepTitle}>Come Together</Text>
                <Text style={styles.rulesGroupSub}>
                  Most SW5e characters don’t work alone. Each character plays a role within a strike team or starship crew working together for a common purpose across the galaxy.
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom < PREV | NEXT > Bar with Red d20 Icon (matches 01:12 - 02:46) */}
        <View style={styles.bottomNavBar}>
          <View style={styles.bottomRedHex}>
            <Text style={styles.bottomRedHexText}>⬡</Text>
          </View>
          <View style={styles.bottomPrevNextGroup}>
            {stepIndex > 0 ? (
              <Pressable
                onPress={() => setStep(STEPS[stepIndex - 1]!.key)}
                style={styles.prevNextBtn}
              >
                <Text style={styles.prevNextText}>‹ PREV</Text>
              </Pressable>
            ) : null}
            {stepIndex < STEPS.length - 1 ? (
              <Pressable
                onPress={() => setStep(STEPS[stepIndex + 1]!.key)}
                style={styles.prevNextBtn}
              >
                <Text style={styles.prevNextText}>NEXT ›</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => handleFinish(true)} style={styles.prevNextBtn}>
                <Text style={[styles.prevNextText, { color: '#38BDF8' }]}>FINISH ✓</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* CONFIRM ADD CLASS MODAL (matches 01:20 - 01:22 in video) */}
        {previewClassKey ? (
          <Modal visible transparent animationType="fade" onRequestClose={() => setPreviewClassKey(null)}>
            <View style={styles.confirmModalRoot}>
              <View style={styles.confirmHeader}>
                <Text style={styles.confirmHeaderTitle}>CONFIRM ADD CLASS</Text>
                <Pressable onPress={() => setPreviewClassKey(null)}>
                  <Text style={styles.confirmCloseX}>✕</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.confirmBody}>
                <View style={styles.confirmTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.confirmBigTitle}>{CLASS_SPECS[previewClassKey].name}</Text>
                    <Text style={styles.confirmBookSub}>Player’s Handbook</Text>
                    <Text style={styles.confirmMetaBold}>
                      Hit Point Die: D{CLASS_SPECS[previewClassKey].hitDie}
                    </Text>
                    <Text style={styles.confirmMetaBold}>
                      Saves:{' '}
                      {CLASS_SPECS[previewClassKey].savingThrows
                        .map((s) => ABILITY_NAMES[s])
                        .join(' & ')}
                    </Text>
                  </View>
                  <View style={styles.confirmBigEmblem}>
                    <Text style={styles.confirmBigEmblemGlyph}>🛡</Text>
                  </View>
                </View>

                {CLASS_LEVEL_FEATURES[previewClassKey].map((f) => (
                  <View key={`${f.level}-${f.title}`} style={styles.confirmFeatureCard}>
                    <Text style={styles.confirmFeatureTitle}>
                      {f.level}: {f.title}
                    </Text>
                    <Text style={styles.confirmFeatureLevel}>{f.level}th level</Text>
                    <FormattedRuleText text={f.description} variant="light" />
                  </View>
                ))}
              </ScrollView>
              <View style={styles.confirmBottomBtns}>
                <Pressable
                  onPress={() => setPreviewClassKey(null)}
                  style={styles.confirmCancelBtn}
                >
                  <Text style={styles.confirmCancelText}>CANCEL</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setClassKey(previewClassKey);
                    setClassConfirmed(true);
                    setSkillProficiencies({});
                    setArchetypeId(null);
                    setArchetypeName('');
                    if (previewClassKey && CLASS_SPECS[previewClassKey]?.casterKind === 'none') {
                      setKnownPowerIds([]);
                    }
                    setPreviewClassKey(null);
                  }}
                  style={styles.confirmGreenBtn}
                >
                  <Text style={styles.confirmGreenText}>ADD CLASS</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* CONFIRM SPECIES MODAL (matches 01:54 in video) */}
        {previewSpecies ? (
          <Modal visible transparent animationType="fade" onRequestClose={() => setPreviewSpecies(null)}>
            <View style={styles.confirmModalRoot}>
              <View style={styles.confirmHeader}>
                <Text style={styles.confirmHeaderTitle}>CONFIRM SPECIES</Text>
                <Pressable onPress={() => setPreviewSpecies(null)}>
                  <Text style={styles.confirmCloseX}>✕</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.confirmBody}>
                <Text style={styles.confirmBigTitle}>{previewSpecies.name}</Text>
                <Text style={styles.confirmBookSub}>{previewSpecies.sourceRef}</Text>
                <View style={styles.confirmFeatureCard}>
                  <Text style={styles.confirmFeatureTitle}>Species Traits</Text>
                  <Text style={styles.confirmFeatureDesc}>{previewSpecies.summary}</Text>
                </View>
                <View style={styles.confirmFeatureCard}>
                  <Text style={styles.confirmFeatureTitle}>Lore & Biology</Text>
                  <FormattedRuleText text={previewSpecies.description} variant="light" />
                </View>
              </ScrollView>
              <View style={styles.confirmBottomBtns}>
                <Pressable
                  onPress={() => setPreviewSpecies(null)}
                  style={styles.confirmCancelBtn}
                >
                  <Text style={styles.confirmCancelText}>CANCEL</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const tr = getSpeciesTraits(previewSpecies.id);
                    setSpeciesId(previewSpecies.id);
                    setSpeciesName(previewSpecies.name);
                    setSpeciesSize(tr.size);
                    if (tr.languages.length > 0) {
                      setLanguages(Array.from(new Set([...tr.languages, 'Galactic Basic'])));
                    }
                    setSpeciesConfirmed(true);
                    setPreviewSpecies(null);
                  }}
                  style={styles.confirmGreenBtn}
                >
                  <Text style={styles.confirmGreenText}>CONFIRM</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181C22',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  backBtn: {
    paddingHorizontal: 8,
  },
  backGlyph: {
    color: '#FFFFFF',
    fontSize: 26,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
  sheetQuickBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  sheetQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepTabsBar: {
    backgroundColor: '#22272E',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  stepTabsContent: {
    paddingHorizontal: spacing.sm,
  },
  stepTab: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  stepTabActive: {
    borderBottomColor: '#0284C7',
  },
  stepTabText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepTabTextActive: {
    color: '#FFFFFF',
  },
  bodyScroll: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 90,
  },
  charNameCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 6,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlus: {
    color: '#38BDF8',
    fontSize: 24,
    fontWeight: '900',
  },
  charNameRight: {
    flex: 1,
    gap: 4,
  },
  charNameLabel: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
  },
  charNameInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#111827',
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: spacing.md,
  },
  stepTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  rulesGroupHeader: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  rulesGroupSub: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
  },
  selectRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 10,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  classBadgeBox: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classBadgeGlyph: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  selectRowTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  selectRowSub: {
    color: '#6B7280',
    fontSize: 12,
  },
  chevronRight: {
    color: '#0284C7',
    fontSize: 26,
    fontWeight: '800',
  },
  hpSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10,
  },
  hpSummaryBold: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },
  manageHpBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  manageHpBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  selectedClassHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedClassName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  levelLabel: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },
  levelCycleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
  },
  levelStepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelStepBtnText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 15,
  },
  levelValueText: {
    color: '#111827',
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  removeClassBtn: {
    padding: 4,
  },
  removeClassText: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: '900',
  },
  subTabHeader: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  choiceAccordion: {
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  choiceAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    backgroundColor: '#F8FAFC',
  },
  blueExclamation: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueExclamationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  choiceAccordionTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  choiceAccordionSub: {
    color: '#6B7280',
    fontSize: 12,
  },
  chevronDown: {
    color: '#6B7280',
    fontSize: 16,
  },
  choiceAccordionBody: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  accordionHelper: {
    color: '#374151',
    fontSize: 13,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  choiceChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  choiceChipActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  choiceChipText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  choiceChipTextActive: {
    color: '#0369A1',
    fontWeight: '800',
  },
  optionCard: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    padding: 10,
    gap: 4,
  },
  optionCardSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  optionCardTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  optionCardDesc: {
    color: '#4B5563',
    fontSize: 12,
    lineHeight: 18,
  },
  staticFeatureBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 12,
    gap: 2,
  },
  staticFeatureTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  staticFeatureLevel: {
    color: '#6B7280',
    fontSize: 11,
  },
  staticFeatureDesc: {
    color: '#374151',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },
  bgDetailCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  bgTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  bgDesc: {
    color: '#374151',
    fontSize: 13,
    lineHeight: 19,
  },
  bgMetaBold: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldLabel: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  twoColInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#111827',
    fontSize: 13,
    backgroundColor: '#FFFFFF',
  },
  changeSpeciesBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E0F2FE',
    borderRadius: 4,
  },
  changeSpeciesText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '800',
  },
  langTable: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  langTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
  },
  langTableRow: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  langCellBold: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
  },
  langCell: {
    color: '#1F2937',
    fontSize: 12,
  },
  abilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  abilityControlBox: {
    width: '30%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    gap: 6,
  },
  abilityControlTitle: {
    color: '#111827',
    fontSize: 10,
    fontWeight: '900',
  },
  abilityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  abilityStepBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  abilityStepText: {
    color: '#111827',
    fontWeight: '900',
  },
  abilityBaseVal: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  abilityTotalText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '900',
  },
  calcTableCard: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  calcHeaderBar: {
    backgroundColor: '#22272E',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  calcHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  calcRowBlue: {
    backgroundColor: '#DBEAFE',
  },
  calcRowLabelBold: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  calcRowValBold: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },
  calcRowLabel: {
    color: '#374151',
    fontSize: 13,
  },
  calcRowVal: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  checkboxLabel: {
    color: '#1F2937',
    fontSize: 13,
    flex: 1,
  },
  orDivider: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 30,
  },
  addStartingEquipBtn: {
    alignSelf: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  addStartingEquipBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  greenToast: {
    backgroundColor: '#4ADE80',
    padding: 12,
    borderRadius: 6,
  },
  greenToastTitle: {
    color: '#064E3B',
    fontSize: 14,
    fontWeight: '900',
  },
  greenToastSub: {
    color: '#065F46',
    fontSize: 12,
  },
  invRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  invItemName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  invItemSub: {
    color: '#6B7280',
    fontSize: 11,
  },
  wieldWearBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  wieldWearBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  wieldWearText: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '800',
  },
  wieldWearTextActive: {
    color: '#FFFFFF',
  },
  qtyText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  catalogAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  greenAddBtn: {
    backgroundColor: '#65A30D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  greenAddBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  totalCreditsDisplay: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  currencyInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  currencyInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    width: 90,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
    color: '#111827',
    fontWeight: '800',
  },
  whatsNextPrimaryBtn: {
    backgroundColor: '#2596FF',
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  whatsNextPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  whatsNextSecondaryBtn: {
    backgroundColor: '#2596FF',
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  whatsNextSecondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  linkCenterBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkCenterText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '800',
  },
  comeTogetherBox: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 14,
    gap: 8,
  },
  bottomNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181C22',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  bottomRedHex: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRedHexText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  bottomPrevNextGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  prevNextBtn: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
  },
  prevNextText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  confirmModalRoot: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  confirmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#22272E',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  confirmHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  confirmCloseX: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  confirmBody: {
    padding: spacing.md,
    gap: 12,
  },
  confirmTopRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 6,
  },
  confirmBigTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
  },
  confirmBookSub: {
    color: '#4B5563',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  confirmMetaBold: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },
  confirmBigEmblem: {
    width: 84,
    height: 84,
    borderRadius: 8,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBigEmblemGlyph: {
    fontSize: 42,
    color: '#FFFFFF',
  },
  confirmFeatureCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    gap: 4,
  },
  confirmFeatureTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  confirmFeatureLevel: {
    color: '#6B7280',
    fontSize: 11,
  },
  confirmFeatureDesc: {
    color: '#374151',
    fontSize: 13,
    lineHeight: 19,
  },
  confirmBottomBtns: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#6B7280',
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmCancelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmGreenBtn: {
    flex: 1,
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmGreenText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  validationToast: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  validationToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  pointBuyBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pointBuyText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  pointBuyResetBtn: {
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  pointBuyResetText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  applyPresetBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  applyPresetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  avatarRemoveBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarRemoveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  personalityTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  personalityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rollPersonalityBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  rollPersonalityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  presetToggleBtn: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  presetToggleText: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '700',
  },
  presetListBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    gap: 4,
  },
  presetGroupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  presetOptionRow: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetOptionRowActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  presetOptionText: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 17,
  },
  poolCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  poolTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  poolBadge: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 52,
  },
  poolBadgeVal: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '800',
  },
  poolBadgeDice: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 1,
  },
  poolBadgeAb: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  slotPickerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 6,
  },
  slotChip: {
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  slotChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0369A1',
  },
  slotChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  slotChipTextActive: {
    color: '#FFFFFF',
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyMiniBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyMiniBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  invDeleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  invDeleteText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
});
