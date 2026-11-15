import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CharacterBuilderModal } from '../../components/CharacterBuilderModal';
import { ContentDetailModal } from '../../components/ContentDetailModal';
import { FloatingDiceRoller } from '../../components/FloatingDiceRoller';
import { FormattedRuleText } from '../../components/FormattedRuleText';
import { LoadingState } from '../../components/StateViews';
import {
  abilityModifier,
  computeMaxHp,
  deriveCharacterStats,
  formatSigned,
  proficiencyBonus,
} from '../../domain/calculations/characterStats';
import type { CharacterDetails, InventoryItemData } from '../../domain/models/characterSheet';
import {
  ABILITIES,
  ABILITY_NAMES,
  CLASS_SPECS,
  CONDITIONS,
  POWER_POINT_COST,
  SKILLS,
  SKILL_KEYS,
  type ConditionKey,
  type ProficiencyLevel,
  type SkillKey,
} from '../../domain/sw5e/constants';
import type { ContentEntry } from '../../domain/sw5e/contentSchema';
import {
  CLASS_LEVEL_FEATURES,
  getBackgroundBenefits,
  getSpeciesTraits,
} from '../../domain/sw5e/sourcebooks';
import { calculateWeaponCombatStats } from '../../domain/sw5e/weapons';
import { generateCharacterPdfHtml } from '../../domain/export/characterPdfHtml';
import { useDiceStore } from '../../features/dice/diceStore';
import { printHtmlOnWeb } from '../../features/export/printHtmlOnWeb';
import { useRepositories } from '../../hooks/DatabaseProvider';
import { useAsync } from '../../hooks/useAsync';
import { spacing } from '../../theme';

type SheetSectionKey =
  | 'abilities'
  | 'skills'
  | 'actions'
  | 'inventory'
  | 'powers'
  | 'defenses'
  | 'features'
  | 'proficiencies'
  | 'background'
  | 'notes'
  | 'extras';

interface SectionSpec {
  key: SheetSectionKey;
  label: string;
  icon: string;
}

const SHEET_SECTIONS: readonly SectionSpec[] = [
  { key: 'abilities', label: 'Abilities, Saves, Senses', icon: '🎲' },
  { key: 'skills', label: 'Skills', icon: '✨' },
  { key: 'actions', label: 'Actions', icon: '⚔' },
  { key: 'inventory', label: 'Inventory', icon: '🧰' },
  { key: 'powers', label: 'Spells / Force & Tech Powers', icon: '🖐' },
  { key: 'defenses', label: 'Speed, Defenses', icon: '🛡' },
  { key: 'features', label: 'Features & Traits', icon: '👤' },
  { key: 'proficiencies', label: 'Proficiencies & Training', icon: '❗' },
  { key: 'background', label: 'Background', icon: '📜' },
  { key: 'notes', label: 'Notes', icon: '💬' },
  { key: 'extras', label: 'Extras: Creatures', icon: '🐾' },
];

const DAMAGE_TYPES = [
  'Kinetic',
  'Energy',
  'Ion',
  'Sonic',
  'Acid',
  'Cold',
  'Fire',
  'Force',
  'Lightning',
  'Necrotic',
  'Poison',
  'Psychic',
];

export default function CharacterSheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { characters, content } = useRepositories();
  const { rollCheck, rollWeaponDamage } = useDiceStore();

  const [section, setSection] = useState<SheetSectionKey>('abilities');
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);

  // Modals matching video flows
  const [hpModalOpen, setHpModalOpen] = useState(false);
  const [hpDeltaInput, setHpDeltaInput] = useState('5');
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [conditionsModalOpen, setConditionsModalOpen] = useState(false);
  const [managePowersOpen, setManagePowersOpen] = useState(false);
  const [managePowersTab, setManagePowersTab] = useState<'known' | 'prepared'>('known');
  const [powerSearch, setPowerSearch] = useState('');
  const [powerLevelFilter, setPowerLevelFilter] = useState<number | 'all'>('all');
  const [manageInventoryOpen, setManageInventoryOpen] = useState(false);
  const [invTab, setInvTab] = useState<'my' | 'party'>('my');
  const [manageDefensesOpen, setManageDefensesOpen] = useState(false);
  const [defenseTarget, setDefenseTarget] = useState<
    'resistances' | 'immunities' | 'vulnerabilities'
  >('resistances');
  const [manageFeatsOpen, setManageFeatsOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<ContentEntry | null>(null);

  const charQuery = useAsync(
    () => (id ? characters.get(id) : Promise.resolve(null)),
    [characters, id],
  );
  const powersCatalog = useAsync(async () => {
    const force = await content.searchEntries({ contentType: 'force_power', limit: 100 });
    const tech = await content.searchEntries({ contentType: 'tech_power', limit: 100 });
    return [...force, ...tech];
  }, [content]);
  const itemsCatalog = useAsync(async () => {
    const weapons = await content.searchEntries({ contentType: 'weapon', limit: 50 });
    const armor = await content.searchEntries({ contentType: 'armor', limit: 50 });
    const equip = await content.searchEntries({ contentType: 'equipment', limit: 50 });
    const cons = await content.searchEntries({ contentType: 'consumable', limit: 50 });
    const enh = await content.searchEntries({ contentType: 'enhanced_item', limit: 50 });
    return [...weapons, ...armor, ...equip, ...cons, ...enh];
  }, [content]);
  const speciesCatalog = useAsync(
    () => content.searchEntries({ contentType: 'species', limit: 50 }),
    [content],
  );
  const archetypeCatalog = useAsync(
    () => content.searchEntries({ contentType: 'archetype', limit: 50 }),
    [content],
  );
  const backgroundCatalog = useAsync(
    () => content.searchEntries({ contentType: 'background', limit: 50 }),
    [content],
  );
  const featCatalog = useAsync(
    () => content.searchEntries({ contentType: 'feat', limit: 50 }),
    [content],
  );
  const creaturesCatalog = useAsync(
    () => content.searchEntries({ contentType: 'creature', limit: 50 }),
    [content],
  );

  const saveDetails = useCallback(
    async (patch: Partial<CharacterDetails>, newLevel?: number, newName?: string) => {
      if (!charQuery.data) return;
      const merged: CharacterDetails = {
        ...charQuery.data.details,
        ...patch,
      };
      await characters.update(charQuery.data.id, {
        name: newName ?? charQuery.data.name,
        levelTotal: newLevel ?? charQuery.data.levelTotal,
        details: merged,
      });
      await charQuery.reload();
    },
    [charQuery, characters],
  );

  if (charQuery.loading) return <LoadingState />;
  const character = charQuery.data;
  if (!character) {
    return (
      <View style={styles.root}>
        <Text style={{ color: '#FFF', padding: 24 }}>Character not found.</Text>
      </View>
    );
  }

  const d = character.details;
  const level = character.levelTotal;
  const classSpec = CLASS_SPECS[d.classKey] ?? CLASS_SPECS.guardian;
  const profBonus = proficiencyBonus(level);
  const maxHp = d.hpMaxOverride ?? computeMaxHp(d.classKey, level, abilityModifier(d.scores.con));

  const equippedArmor = d.inventory.find(
    (i: InventoryItemData) => i.equipped && i.kind === 'armor',
  );
  const equippedShield = d.inventory.find(
    (i: InventoryItemData) => i.equipped && i.kind === 'shield',
  );

  const derived = deriveCharacterStats({
    scores: d.scores,
    classLevels: [{ classKey: d.classKey, level }],
    savingThrowProficiencies: d.savingThrowProficiencies,
    skillProficiencies: d.skillProficiencies,
    armor: equippedArmor?.armorCategory
      ? {
          category: equippedArmor.armorCategory,
          baseAc: equippedArmor.baseAc ?? 12,
          enhancementBonus: equippedArmor.enhancementBonus,
          strengthRequirement: equippedArmor.strengthRequirement,
        }
      : null,
    shield: equippedShield?.shieldAcBonus
      ? { acBonus: equippedShield.shieldAcBonus, enhancementBonus: equippedShield.enhancementBonus }
      : null,
    baseSpeed: d.baseSpeed,
    slowedLevel: d.slowedLevel,
    hpMaxOverride: d.hpMaxOverride,
  });

  const ac = derived.armorClass;
  const initMod = derived.initiative;
  const passivePerc = derived.passivePerception;
  const passiveInv = 10 + derived.skills.investigation;
  const effectiveSpeed = derived.speed;

  const forcePointsMax = derived.powercasting.force.maxPoints;
  const techPointsMax = derived.powercasting.tech.maxPoints;
  const forceRemaining = Math.max(0, forcePointsMax - d.forcePointsSpent);
  const techRemaining = Math.max(0, techPointsMax - d.techPointsSpent);

  const equippedWeapons = d.inventory.filter(
    (i: InventoryItemData) => i.equipped && i.kind === 'weapon',
  );
  const totalWeight = d.inventory.reduce(
    (sum: number, i: InventoryItemData) => sum + i.weight * i.quantity,
    0,
  );
  const activeSecSpec = SHEET_SECTIONS.find((s) => s.key === section) ?? SHEET_SECTIONS[0]!;

  const castingMod =
    classSpec.casterKind === 'tech'
      ? abilityModifier(d.scores.int)
      : Math.max(abilityModifier(d.scores.wis), abilityModifier(d.scores.cha));
  const powerAttackBonus =
    classSpec.casterKind === 'tech'
      ? derived.powercasting.tech.attackBonus
      : derived.powercasting.force.universalAttackBonus;
  const powerSaveDc =
    classSpec.casterKind === 'tech'
      ? derived.powercasting.tech.saveDc
      : derived.powercasting.force.universalSaveDc;

  const knownPowersList = (powersCatalog.data ?? []).filter((p) =>
    d.knownPowerIds.includes(p.id),
  );
  const featsList = (featCatalog.data ?? []).filter((f) =>
    d.featIds.includes(f.id),
  );

  const handleExportPdf = async () => {
    try {
      const html = generateCharacterPdfHtml({
        name: character.name,
        levelTotal: level,
        details: d,
        ac,
        maxHp,
        maxForcePoints: forcePointsMax,
        maxTechPoints: techPointsMax,
        knownPowers: knownPowersList,
        feats: featsList,
      });

      if (Platform.OS === 'web') {
        await printHtmlOnWeb(html, `${character.name} - SW5e Character Sheet`);
      } else {
        const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            UTI: '.pdf',
            mimeType: 'application/pdf',
            dialogTitle: `${character.name} - SW5e Sheet.pdf`,
          });
        } else {
          await Print.printAsync({ html });
        }
      }
    } catch {
      Alert.alert('PDF Export Error', 'Unable to export character sheet to PDF.');
    }
  };

  return (
    <View style={styles.root}>
      {/* Top Bar: < Character Name / Species Class Level (matches 02:50 - 03:45) */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <View style={styles.topTitleCol}>
          <Text style={styles.charTitle} numberOfLines={1}>
            {character.name}
          </Text>
          <Text style={styles.charSubtitle}>
            {d.speciesName} {classSpec.name} {level}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {level > 1 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease Level"
              onPress={async () => {
                const newLvl = level - 1;
                const newMaxHp = computeMaxHp(d.classKey, newLvl, abilityModifier(d.scores.con));
                await saveDetails({ hpCurrent: Math.min(d.hpCurrent, newMaxHp) }, newLvl);
              }}
              style={styles.levelDownBtn}
            >
              <Text style={styles.levelDownBtnText}>▼</Text>
            </Pressable>
          )}
          {level < 20 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Level Up Character"
              onPress={async () => {
                const newLvl = level + 1;
                const newMaxHp = computeMaxHp(d.classKey, newLvl, abilityModifier(d.scores.con));
                await saveDetails({ hpCurrent: Math.max(d.hpCurrent, newMaxHp) }, newLvl);
              }}
              style={styles.levelUpBtn}
            >
              <Text style={styles.levelUpBtnText}>▲ LVL {level + 1}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Top Combat & Portrait Strip (exact match for 02:56 - 02:58 & 03:14 in video) */}
      <View style={styles.heroBanner}>
        {/* Left: Armor Class + Initiative + Campfire Rest + Gear Builder */}
        <View style={styles.heroSideCol}>
          <View style={styles.acInitRow}>
            <View style={styles.shieldAcBox}>
              <Text style={styles.shieldTopLabel}>ARMOR</Text>
              <Text style={styles.shieldAcNumber}>{ac}</Text>
              <Text style={styles.shieldBottomLabel}>CLASS</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => rollCheck('INITIATIVE: CHECK', initMod)}
              style={styles.initBox}
            >
              <Text style={styles.initValue}>{formatSigned(initMod)}</Text>
              <Text style={styles.initLabel}>INITIATIVE</Text>
            </Pressable>
          </View>
          <View style={styles.quickActionIconsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rest Menu"
              onPress={() => setRestModalOpen(true)}
              style={styles.squareActionBtn}
            >
              <Text style={styles.squareActionGlyph}>🔥</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Character Builder"
              onPress={() => setBuilderOpen(true)}
              style={styles.squareActionBtn}
            >
              <Text style={styles.squareActionGlyph}>⚙</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Export Character Sheet PDF"
              onPress={handleExportPdf}
              style={styles.squareActionBtn}
            >
              <Text style={styles.squareActionGlyph}>📄</Text>
            </Pressable>
          </View>
        </View>

        {/* Center: Avatar Portrait + HEROIC INSPIRATION Toggle */}
        <Pressable
          accessibilityRole="button"
          onPress={() => saveDetails({ heroicInspiration: !d.heroicInspiration })}
          style={styles.portraitContainer}
        >
          <View
            style={[
              styles.portraitFrame,
              d.heroicInspiration && { borderColor: '#F59E0B', borderWidth: 2 },
            ]}
          >
            {d.avatarUri ? (
              <Image
                source={{ uri: d.avatarUri }}
                style={{ width: '100%', height: '100%', borderRadius: 10 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.portraitAvatarGlyph}>
                {classSpec.casterKind === 'force'
                  ? '⚔'
                  : classSpec.casterKind === 'tech'
                    ? '⚙'
                    : '🛡'}
              </Text>
            )}
          </View>
          <View
            style={[
              styles.inspirationPill,
              d.heroicInspiration && { backgroundColor: '#F59E0B' },
            ]}
          >
            <Text style={styles.inspirationText}>
              {d.heroicInspiration ? '★ INSPIRED' : 'HEROIC INSPIRATION'}
            </Text>
          </View>
        </Pressable>

        {/* Right: Hit Points + Conditions Button */}
        <View style={styles.heroSideCol}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setHpModalOpen(true)}
            style={styles.hpBox}
          >
            <Text style={styles.hpLabel}>HIT POINTS</Text>
            <Text style={styles.hpVal}>
              {d.hpCurrent}/{maxHp}
              {d.hpTemp > 0 ? `+${d.hpTemp}` : ''}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setConditionsModalOpen(true)}
            style={styles.conditionsBtn}
          >
            <Text style={styles.conditionsBtnText}>
              CONDITIONS{d.activeConditions.length > 0 ? ` (${d.activeConditions.length})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Section Switcher Bar (matches 02:50, 03:04, 03:34 in video) */}
      <View style={styles.sectionBarWrap}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setSectionDrawerOpen(true)}
          style={styles.sectionSelectorBar}
        >
          <Text style={styles.sectionBarIcon}>{activeSecSpec.icon}</Text>
          <Text style={styles.sectionBarTitle}>{activeSecSpec.label}</Text>
          <Text style={styles.sectionGridIcon}>⊞</Text>
          <Text style={styles.sectionMenuIcon}>☰</Text>
        </Pressable>
      </View>

      {/* Section Body Content */}
      <ScrollView contentContainerStyle={styles.sheetScroll}>
        {/* ================= 1. ABILITIES, SAVES, SENSES (02:50 - 02:58) ================= */}
        {section === 'abilities' ? (
          <View style={styles.sectionContainer}>
            <View style={styles.abilitiesGrid}>
              {ABILITIES.map((ab) => {
                const score = d.scores[ab];
                const mod = abilityModifier(score);
                return (
                  <Pressable
                    key={ab}
                    accessibilityRole="button"
                    onPress={() => rollCheck(`${ab.toUpperCase()}: CHECK`, mod)}
                    style={styles.ornateAbilityCard}
                  >
                    <Text style={styles.ornateAbilityLabel}>
                      {ABILITY_NAMES[ab].toUpperCase()}
                    </Text>
                    <Text style={styles.ornateAbilityMod}>{formatSigned(mod)}</Text>
                    <View style={styles.ornateScoreCapsule}>
                      <Text style={styles.ornateScoreText}>{score}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.subHeading}>Saving Throws</Text>
            <View style={styles.savesGrid}>
              {ABILITIES.map((ab) => {
                const prof = d.savingThrowProficiencies.includes(ab);
                const mod = derived.savingThrows[ab];
                return (
                  <Pressable
                    key={`save-${ab}`}
                    accessibilityRole="button"
                    onPress={() => rollCheck(`${ABILITY_NAMES[ab].toUpperCase()}: SAVE`, mod)}
                    style={styles.savePillCard}
                  >
                    <View style={[styles.profDot, prof && styles.profDotFilled]} />
                    <Text style={styles.savePillLabel} numberOfLines={1}>
                      {ABILITY_NAMES[ab].toUpperCase()}
                    </Text>
                    <View style={styles.saveBonusCircle}>
                      <Text style={styles.saveBonusText}>{formatSigned(mod)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.subHeading}>Senses</Text>
            <View style={styles.sensePillCard}>
              <View style={styles.senseValueCircle}>
                <Text style={styles.senseValueText}>{passivePerc}</Text>
              </View>
              <Text style={styles.senseLabel}>PASSIVE PERCEPTION</Text>
            </View>
            <View style={styles.sensePillCard}>
              <View style={styles.senseValueCircle}>
                <Text style={styles.senseValueText}>{passiveInv}</Text>
              </View>
              <Text style={styles.senseLabel}>PASSIVE INVESTIGATION</Text>
            </View>
          </View>
        ) : null}

        {/* ================= 2. SKILLS (matches 02:58 - 03:02 in video) ================= */}
        {section === 'skills' ? (
          <View style={styles.sectionContainer}>
            <View style={styles.skillsHeaderRow}>
              <Text style={[styles.skillColHeader, { width: 32 }]}>PIN</Text>
              <Text style={[styles.skillColHeader, { width: 36 }]}>PROF</Text>
              <Text style={[styles.skillColHeader, { width: 38 }]}>MOD</Text>
              <Text style={[styles.skillColHeader, { flex: 1 }]}>SKILL</Text>
              <Text style={[styles.skillColHeader, { width: 52, textAlign: 'right' }]}>BONUS</Text>
            </View>

            {SKILL_KEYS.map((sk: SkillKey) => {
              const spec = SKILLS[sk];
              const profLevel: ProficiencyLevel = d.skillProficiencies[sk] ?? 'none';
              const bonus = derived.skills[sk];
              const pinned = (d.pinnedSkills ?? []).includes(sk);
              const nextProf: Record<ProficiencyLevel, ProficiencyLevel> = {
                none: 'proficient',
                half: 'proficient',
                proficient: 'expertise',
                expertise: 'none',
              };

              return (
                <View key={sk} style={styles.skillTableRow}>
                  <Pressable
                    onPress={() => {
                      const curr = d.pinnedSkills ?? [];
                      saveDetails({
                        pinnedSkills: pinned
                          ? curr.filter((k: string) => k !== sk)
                          : [...curr, sk],
                      });
                    }}
                    style={{ width: 32 }}
                  >
                    <Text style={[styles.pinIcon, pinned && { color: '#38BDF8' }]}>📌</Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      saveDetails({
                        skillProficiencies: {
                          ...d.skillProficiencies,
                          [sk]: nextProf[profLevel],
                        },
                      })
                    }
                    style={{ width: 36, justifyContent: 'center' }}
                  >
                    <View
                      style={[
                        styles.profDot,
                        profLevel !== 'none' && styles.profDotFilled,
                        profLevel === 'expertise' && {
                          borderColor: '#F59E0B',
                          backgroundColor: '#F59E0B',
                        },
                      ]}
                    />
                  </Pressable>

                  <Text style={[styles.skillModCol, { width: 38 }]}>
                    {spec.ability.toUpperCase()}
                  </Text>

                  <Text style={styles.skillNameCol}>{spec.name}</Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => rollCheck(`${spec.name.toUpperCase()}: CHECK`, bonus)}
                    style={styles.skillBonusBox}
                  >
                    <Text style={styles.skillBonusText}>{formatSigned(bonus)}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* ================= 3. ACTIONS (matches 03:06 in video) ================= */}
        {section === 'actions' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.blueCategoryHeading}>ATTACKS (EQUIPPED WEAPONS)</Text>
            {equippedWeapons.map((w: InventoryItemData) => {
              const stats = calculateWeaponCombatStats({
                scores: { str: d.scores.str, dex: d.scores.dex },
                profBonus,
                weaponProficiencies: d.weaponProficiencies ?? [],
                weapon: w,
              });

              return (
                <View key={w.id} style={styles.actionCard}>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Text style={styles.actionTitle}>{w.name}</Text>
                      {!stats.isProficient ? (
                        <View style={styles.nonProficientBadge}>
                          <Text style={styles.nonProficientBadgeText}>NOT PROFICIENT</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.actionSub}>
                      {stats.isRanged ? 'Ranged' : 'Melee'} • {stats.damageType} •{' '}
                      {stats.abilityUsed.toUpperCase()}
                      {stats.heavyBonus > 0 ? ` (+${stats.heavyBonus} Heavy)` : ''}
                      {w.properties && w.properties.length > 0
                        ? ` • ${w.properties.join(', ')}`
                        : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => rollCheck(`${w.name}: TO HIT`, stats.toHit)}
                    style={styles.skillBonusBox}
                  >
                    <Text style={styles.skillBonusText}>{formatSigned(stats.toHit)}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => rollWeaponDamage(`${w.name}: DAMAGE`, stats.damageFormula)}
                    style={[styles.skillBonusBox, { minWidth: 84, paddingHorizontal: 6 }]}
                  >
                    <Text style={styles.skillBonusText}>{stats.damageFormula}</Text>
                  </Pressable>
                </View>
              );
            })}

            <Text style={styles.blueCategoryHeading}>ACTIONS IN COMBAT</Text>
            <View style={styles.combatTextBlock}>
              <Text style={styles.combatRuleText}>
                <Text style={{ fontWeight: '800', color: '#FFF' }}>
                  Attack, Cast a Power, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use an Object.{' '}
                </Text>
                Standard actions available on your turn.
              </Text>
              <Text style={styles.combatRuleText}>
                <Text style={{ fontWeight: '800', color: '#FFF', fontStyle: 'italic' }}>
                  Grapple / Shove.{' '}
                </Text>
                The target must succeed on a STR or DEX saving throw (DC ={' '}
                {8 + profBonus + abilityModifier(d.scores.str)}) or be Grappled / pushed 5 ft. or knocked Prone.
              </Text>
            </View>

            <Text style={styles.blueCategoryHeading}>BONUS ACTIONS</Text>
            <View style={styles.combatActionStrip}>
              <Text style={styles.combatStripLabel}>Actions in Combat</Text>
              <Text style={styles.combatStripPipe}>
                | Two-Weapon Fighting / Double-Weapon Strike
              </Text>
            </View>

            <Text style={styles.blueCategoryHeading}>REACTIONS</Text>
            <View style={styles.combatActionStrip}>
              <Text style={styles.combatStripLabel}>Actions in Combat</Text>
              <Text style={styles.combatStripPipe}>| Opportunity Attack</Text>
            </View>
          </View>
        ) : null}

        {/* ================= 4. INVENTORY (matches 03:08 - 03:14 in video) ================= */}
        {section === 'inventory' ? (
          <View style={styles.sectionContainer}>
            <View style={styles.subTabsBar}>
              <Pressable
                onPress={() => setInvTab('my')}
                style={[styles.subTabItem, invTab === 'my' && styles.subTabItemActive]}
              >
                <Text style={[styles.subTabText, invTab === 'my' && styles.subTabTextActive]}>
                  MY INVENTORY
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInvTab('party')}
                style={[styles.subTabItem, invTab === 'party' && styles.subTabItemActive]}
              >
                <Text style={[styles.subTabText, invTab === 'party' && styles.subTabTextActive]}>
                  PARTY INVENTORY
                </Text>
              </Pressable>
            </View>

            <View style={styles.invSummaryBanner}>
              <View style={styles.invSummaryTopRow}>
                <View>
                  <Text style={styles.invSummaryLabel}>WEIGHT CARRIED</Text>
                  <Text style={styles.invSummaryBig}>{totalWeight} lb.</Text>
                  <Text style={styles.invSummarySub}>UNENCUMBERED</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.invSummaryLabel}>TOTAL CURRENCY ›</Text>
                  <Text style={styles.invSummaryCredits}>💳 {d.credits}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setManageInventoryOpen(true)}
                style={styles.manageOutlineBtn}
              >
                <Text style={styles.manageOutlineBtnText}>Manage Inventory</Text>
              </Pressable>
            </View>

            <Text style={styles.invGroupTitle}>
              EQUIPMENT ({d.inventory.filter((i: InventoryItemData) => i.equipped).length})
            </Text>
            <View style={styles.invTableHeader}>
              <Text style={[styles.skillColHeader, { flex: 1, paddingLeft: 32 }]}>WEIGHT</Text>
              <Text style={[styles.skillColHeader, { width: 42 }]}>QTY</Text>
              <Text style={[styles.skillColHeader, { width: 68, textAlign: 'right' }]}>
                COST (CR)
              </Text>
            </View>

            {d.inventory.map((item: InventoryItemData) => (
              <View key={item.id} style={styles.invRow}>
                <Pressable
                  onPress={() =>
                    saveDetails({
                      inventory: d.inventory.map((i: InventoryItemData) =>
                        i.id === item.id ? { ...i, equipped: !i.equipped } : i,
                      ),
                    })
                  }
                  style={[styles.invCheckbox, item.equipped && styles.invCheckboxChecked]}
                >
                  {item.equipped ? <Text style={styles.invCheckMark}>✓</Text> : null}
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invItemTitle}>{item.name}</Text>
                  <Text style={styles.invItemCategory}>
                    {item.kind.toUpperCase()}
                    {item.armorCategory ? ` • ${item.armorCategory.toUpperCase()} ARMOR` : ''}
                  </Text>
                  <Text style={styles.invWeightText}>{item.weight} lb.</Text>
                </View>
                <Text style={styles.invQtyVal}>{item.quantity}</Text>
                <Text style={styles.invCostVal}>{item.cost}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ================= 5. POWERS / SPELLS (matches 03:16 - 03:26 in video) ================= */}
        {section === 'powers' ? (
          <View style={styles.sectionContainer}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={powerSearch}
                onChangeText={setPowerSearch}
                placeholder="Search in Powers"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
            </View>

            <View style={styles.powerLevelPillsRow}>
              {(
                [
                  { k: 'all', label: 'All' },
                  { k: 0, label: '- 0 -' },
                  { k: 1, label: '1st' },
                  { k: 2, label: '2nd' },
                  { k: 3, label: '3rd' },
                ] as const
              ).map((p) => (
                <Pressable
                  key={String(p.k)}
                  onPress={() => setPowerLevelFilter(p.k)}
                  style={[
                    styles.powerPill,
                    powerLevelFilter === p.k && styles.powerPillActive,
                  ]}
                >
                  <Text style={styles.powerPillText}>{p.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.castingStatsRow}>
              <View style={styles.castingStatCol}>
                <Text style={styles.castingStatNum}>{formatSigned(castingMod)}</Text>
                <Text style={styles.castingStatLbl}>MODIFIER</Text>
              </View>
              <Pressable
                onPress={() => rollCheck('POWER ATTACK', powerAttackBonus)}
                style={styles.castingStatCol}
              >
                <Text style={styles.castingStatNum}>{formatSigned(powerAttackBonus)}</Text>
                <Text style={styles.castingStatLbl}>POWER ATTACK</Text>
              </Pressable>
              <View style={styles.castingStatCol}>
                <Text style={styles.castingStatNum}>{powerSaveDc}</Text>
                <Text style={styles.castingStatLbl}>SAVE DC</Text>
              </View>
            </View>

            <Text style={styles.pointsPoolLine}>
              Force Points: {forceRemaining}/{forcePointsMax}   •   Tech Points:{' '}
              {techRemaining}/{techPointsMax}
            </Text>

            <Pressable
              onPress={() => setManagePowersOpen(true)}
              style={[styles.manageOutlineBtn, { alignSelf: 'center' }]}
            >
              <Text style={styles.manageOutlineBtnText}>Manage Powers</Text>
            </Pressable>

            <Text style={styles.invGroupTitle}>Known Powers ({knownPowersList.length})</Text>
            <View style={styles.powerTableHeader}>
              <Text style={[styles.skillColHeader, { flex: 1 }]}>POWER / TIME</Text>
              <Text style={[styles.skillColHeader, { width: 64 }]}>RANGE</Text>
              <Text style={[styles.skillColHeader, { width: 64 }]}>COST</Text>
              <Text style={[styles.skillColHeader, { width: 62, textAlign: 'right' }]}>CAST</Text>
            </View>

            {knownPowersList
              .filter((pw) => {
                if (
                  powerSearch.trim() &&
                  !pw.name.toLowerCase().includes(powerSearch.trim().toLowerCase())
                ) {
                  return false;
                }
                if (powerLevelFilter === 'all') return true;
                try {
                  const pr = JSON.parse(pw.propertiesJson) as { level?: number };
                  return (pr.level ?? 0) === powerLevelFilter;
                } catch {
                  return true;
                }
              })
              .map((pw) => {
                let pr: { level?: number; range?: string; castingTime?: string } = {};
                try {
                  pr = JSON.parse(pw.propertiesJson);
                } catch {
                  pr = {};
                }
                const lvl = pr.level ?? 0;
                const cost = POWER_POINT_COST[lvl] ?? 0;
                const isForce = pw.contentType === 'force_power';

                return (
                  <Pressable
                    key={pw.id}
                    onPress={() => setDetailEntry(pw)}
                    style={styles.powerRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.powerNameText}>{pw.name}</Text>
                      <Text style={styles.powerSubText}>
                        {lvl === 0 ? 'At Will' : `Level ${lvl}`} • {pr.castingTime ?? '1A'}
                      </Text>
                    </View>
                    <Text style={styles.powerCellText}>{pr.range ?? '60 ft.'}</Text>
                    <Text style={styles.powerCellText}>
                      {cost === 0 ? 'At-Will' : `${cost} pts`}
                    </Text>
                    <Pressable
                      onPress={() => {
                        rollCheck(`${pw.name.toUpperCase()}: CAST`, powerAttackBonus);
                        if (cost > 0) {
                          if (isForce) {
                            saveDetails({ forcePointsSpent: d.forcePointsSpent + cost });
                          } else {
                            saveDetails({ techPointsSpent: d.techPointsSpent + cost });
                          }
                        }
                      }}
                      style={styles.castActionBtn}
                    >
                      <Text style={styles.castActionBtnText}>Cast</Text>
                    </Pressable>
                  </Pressable>
                );
              })}
          </View>
        ) : null}

        {/* ================= 6. SPEED, DEFENSES (matches 03:28 - 03:32 in video) ================= */}
        {section === 'defenses' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.blueCategoryHeading}>SPEED</Text>
            <Text style={styles.defenseMainRow}>Walking: {effectiveSpeed} ft.</Text>

            <View style={styles.divider} />

            <Text style={styles.blueCategoryHeading}>DEFENSES</Text>
            <Pressable
              onPress={() => setManageDefensesOpen(true)}
              style={[styles.manageOutlineBtn, { alignSelf: 'center' }]}
            >
              <Text style={styles.manageOutlineBtnText}>Manage Defenses</Text>
            </Pressable>

            <Text style={styles.defenseGroupTitle}>Resistances</Text>
            <Text style={styles.defenseGroupValue}>
              {(d.resistances ?? []).length > 0 ? d.resistances.join(', ') : 'No Resistances'}
            </Text>

            <Text style={styles.defenseGroupTitle}>Immunities</Text>
            <Text style={styles.defenseGroupValue}>
              {(d.immunities ?? []).length > 0 ? d.immunities.join(', ') : 'No Immunities'}
            </Text>

            <Text style={styles.defenseGroupTitle}>Vulnerabilities</Text>
            <Text style={styles.defenseGroupValue}>
              {(d.vulnerabilities ?? []).length > 0
                ? d.vulnerabilities.join(', ')
                : 'No Vulnerabilities'}
            </Text>
          </View>
        ) : null}

        {/* ================= 7. FEATURES & TRAITS (matches 03:36 in video) ================= */}
        {section === 'features' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.blueCategoryHeading}>FEATS</Text>
            <Pressable
              onPress={() => setManageFeatsOpen(true)}
              style={[styles.manageOutlineBtn, { alignSelf: 'center' }]}
            >
              <Text style={styles.manageOutlineBtnText}>Manage Feats</Text>
            </Pressable>

            {(featCatalog.data ?? [])
              .filter((f) => d.featIds.includes(f.id))
              .map((ft) => (
                <View key={ft.id} style={styles.featureBlock}>
                  <Text style={styles.featureBlockTitle}>
                    {ft.name} <Text style={styles.redDot}>•</Text>{' '}
                    <Text style={styles.featurePageCite}>{ft.sourceRef}</Text>
                  </Text>
                  <Text style={styles.featureOriginSub}>From {d.backgroundName}</Text>
                  <FormattedRuleText text={ft.description} variant="dark" />
                </View>
              ))}

            <View style={styles.divider} />
            <Text style={styles.blueCategoryHeading}>
              CLASS FEATURES ({classSpec.name.toUpperCase()})
            </Text>
            {CLASS_LEVEL_FEATURES[d.classKey]
              .filter((cf) => cf.level <= level)
              .map((cf) => (
                <View key={`${cf.level}-${cf.title}`} style={styles.featureBlock}>
                  <Text style={styles.featureBlockTitle}>
                    {cf.title} <Text style={styles.redDot}>•</Text>{' '}
                    <Text style={styles.featurePageCite}>Level {cf.level}</Text>
                  </Text>
                  <FormattedRuleText text={cf.description} variant="dark" />
                </View>
              ))}

            {/* Archetype Features (Level 3+) */}
            {level >= 3 && d.archetypeName ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.blueCategoryHeading}>
                  ARCHETYPE ({d.archetypeName.toUpperCase()})
                </Text>
                {(() => {
                  const archEntry = (archetypeCatalog.data ?? []).find(
                    (a) =>
                      a.id === d.archetypeId ||
                      a.name.toLowerCase() === d.archetypeName.toLowerCase(),
                  );
                  return (
                    <View style={styles.featureBlock}>
                      <Text style={styles.featureBlockTitle}>
                        {d.archetypeName} <Text style={styles.redDot}>•</Text>{' '}
                        <Text style={styles.featurePageCite}>Level 3 Archetype</Text>
                      </Text>
                      <FormattedRuleText
                        text={
                          archEntry?.description ||
                          `Archetype specialization for ${classSpec.name}.`
                        }
                        variant="dark"
                      />
                    </View>
                  );
                })()}
              </>
            ) : null}

            {/* Species Traits */}
            {(() => {
              const spTraits = getSpeciesTraits(d.speciesId || d.speciesName);
              if (!spTraits.traits || spTraits.traits.length === 0) return null;
              return (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.blueCategoryHeading}>
                    SPECIES TRAITS ({spTraits.name.toUpperCase()})
                  </Text>
                  <View style={{ marginBottom: 8, paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>
                      Size: {spTraits.size} • Speed: {spTraits.speed} ft
                      {spTraits.climbSpeed ? ` • Climb: ${spTraits.climbSpeed} ft` : ''}
                      {spTraits.swimSpeed ? ` • Swim: ${spTraits.swimSpeed} ft` : ''}
                      {spTraits.darkvision ? ` • Darkvision: ${spTraits.darkvision} ft` : ''}
                    </Text>
                  </View>
                  {spTraits.traits.map((tr, idx) => (
                    <View key={idx} style={styles.featureBlock}>
                      <Text style={styles.featureBlockTitle}>
                        {tr.name} <Text style={styles.redDot}>•</Text>{' '}
                        <Text style={styles.featurePageCite}>{spTraits.name}</Text>
                      </Text>
                      <FormattedRuleText text={tr.description} variant="dark" />
                    </View>
                  ))}
                </>
              );
            })()}

            {/* Background Feature */}
            {(() => {
              const bgBenefits = getBackgroundBenefits(d.backgroundId || d.backgroundName);
              if (!bgBenefits.featureTitle) return null;
              return (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.blueCategoryHeading}>
                    BACKGROUND FEATURE ({bgBenefits.name.toUpperCase()})
                  </Text>
                  <View style={styles.featureBlock}>
                    <Text style={styles.featureBlockTitle}>
                      {bgBenefits.featureTitle} <Text style={styles.redDot}>•</Text>{' '}
                      <Text style={styles.featurePageCite}>{bgBenefits.name}</Text>
                    </Text>
                    <FormattedRuleText text={bgBenefits.featureDescription} variant="dark" />
                  </View>
                </>
              );
            })()}
          </View>
        ) : null}

        {/* ================= 8. PROFICIENCIES & TRAINING (matches 03:38 in video) ================= */}
        {section === 'proficiencies' ? (
          <View style={styles.sectionContainer}>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={styles.profBigNumber}>{formatSigned(profBonus)}</Text>
              <Text style={styles.profSubLabel}>Proficiency Bonus</Text>
            </View>

            <Text style={styles.defenseGroupTitle}>Armor</Text>
            {(d.armorProficiencies ?? classSpec.armorProficiencies ?? ['Light Armor', 'Medium Armor', 'Shields']).map(
              (ap: string) => (
                <Text key={ap} style={styles.profLineText}>
                  {ap} <Text style={styles.profSourceMuted}>({classSpec.name})</Text>
                </Text>
              ),
            )}

            <View style={styles.divider} />
            <Text style={styles.defenseGroupTitle}>Weapons</Text>
            {(d.weaponProficiencies ?? classSpec.weaponProficiencies ?? ['Simple Vibroweapons', 'Lightweapons', 'Blasters']).map(
              (wp: string) => (
                <Text key={wp} style={styles.profLineText}>
                  {wp} <Text style={styles.profSourceMuted}>({classSpec.name})</Text>
                </Text>
              ),
            )}

            <View style={styles.divider} />
            <Text style={styles.defenseGroupTitle}>Tools</Text>
            {(d.toolProficiencies ?? ['Artisan’s Implements']).map((tp: string) => (
              <Text key={tp} style={styles.profLineText}>
                {tp} <Text style={styles.profSourceMuted}>({d.backgroundName})</Text>
              </Text>
            ))}

            <View style={styles.divider} />
            <Text style={styles.defenseGroupTitle}>Languages</Text>
            {(d.languages ?? ['Galactic Basic']).map((lg: string) => (
              <Text key={lg} style={styles.profLineText}>
                {lg} <Text style={styles.profSourceMuted}>({d.speciesName})</Text>
              </Text>
            ))}
          </View>
        ) : null}

        {/* ================= 9. BACKGROUND (matches 03:40 in video) ================= */}
        {section === 'background' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.blueCategoryHeading}>BACKGROUND</Text>
            <Text style={styles.featureBlockTitle}>{d.backgroundName}</Text>
            <Text style={styles.featureOriginSub}>
              {d.backgroundName} Ability Score Improvements • PHB Ch. 4
            </Text>

            <View style={styles.divider} />
            <Text style={styles.blueCategoryHeading}>CHARACTERISTICS</Text>
            {[
              { k: 'Alignment', v: d.alignment || '--' },
              { k: 'Gender', v: d.characteristics?.gender || '--' },
              { k: 'Eyes', v: d.characteristics?.eyes || '--' },
              {
                k: 'Size',
                v: getSpeciesTraits(d.speciesId || d.speciesName).size || 'Medium',
              },
              { k: 'Height', v: d.characteristics?.height || '--' },
              { k: 'Faith / Philosophy', v: d.characteristics?.faith || '--' },
              { k: 'Hair', v: d.characteristics?.hair || '--' },
              { k: 'Skin', v: d.characteristics?.skin || '--' },
              { k: 'Age', v: d.characteristics?.age || '--' },
              { k: 'Weight', v: d.characteristics?.weight || '--' },
            ].map((row) => (
              <Text key={row.k} style={styles.charTraitLine}>
                {row.k}: <Text style={styles.charTraitVal}>{row.v}</Text>
              </Text>
            ))}

            <Text style={styles.defenseGroupTitle}>Personality Traits</Text>
            <Text style={styles.defenseGroupValue}>
              {d.characteristics?.personalityTraits || '--'}
            </Text>
            <Text style={styles.defenseGroupTitle}>Ideals</Text>
            <Text style={styles.defenseGroupValue}>{d.characteristics?.ideals || '--'}</Text>
            <Text style={styles.defenseGroupTitle}>Bonds</Text>
            <Text style={styles.defenseGroupValue}>{d.characteristics?.bonds || '--'}</Text>
            <Text style={styles.defenseGroupTitle}>Flaws</Text>
            <Text style={styles.defenseGroupValue}>{d.characteristics?.flaws || '--'}</Text>
          </View>
        ) : null}

        {/* ================= 10. NOTES (matches 03:42 in video) ================= */}
        {section === 'notes' ? (
          <View style={styles.sectionContainer}>
            {(
              [
                { key: 'organizations', label: 'Organizations' },
                { key: 'allies', label: 'Allies' },
                { key: 'enemies', label: 'Enemies' },
                { key: 'backstory', label: 'Backstory' },
                { key: 'other', label: 'Other' },
              ] as const
            ).map((n) => (
              <View key={n.key} style={styles.noteFieldBlock}>
                <Text style={styles.defenseGroupTitle}>{n.label}</Text>
                <TextInput
                  value={d.structuredNotes?.[n.key] ?? ''}
                  onChangeText={(txt) =>
                    saveDetails({
                      structuredNotes: {
                        ...(d.structuredNotes ?? {
                          organizations: '',
                          allies: '',
                          enemies: '',
                          backstory: '',
                          other: '',
                        }),
                        [n.key]: txt,
                      },
                    })
                  }
                  placeholder={`+ Add ${n.label}`}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  style={styles.noteInput}
                />
              </View>
            ))}
          </View>
        ) : null}

        {/* ================= 11. EXTRAS: CREATURES (matches 03:44 in video) ================= */}
        {section === 'extras' ? (
          <View style={styles.sectionContainer}>
            <View style={styles.extrasArtBanner}>
              <Text style={styles.extrasArtGlyph}>🐾</Text>
              <Text style={styles.extrasArtTitle}>
                Companions, Droids, Mounts & Adversaries
              </Text>
            </View>
            {(creaturesCatalog.data ?? []).map((cr) => {
              const attached = (d.extrasCreatureIds ?? []).includes(cr.id);
              return (
                <View key={cr.id} style={styles.extraCreatureRow}>
                  <Pressable onPress={() => setDetailEntry(cr)} style={{ flex: 1 }}>
                    <Text style={styles.invItemTitle}>{cr.name}</Text>
                    <Text style={styles.invItemCategory}>{cr.summary}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const curr = d.extrasCreatureIds ?? [];
                      saveDetails({
                        extrasCreatureIds: attached
                          ? curr.filter((x: string) => x !== cr.id)
                          : [...curr, cr.id],
                      });
                    }}
                    style={[styles.castActionBtn, attached && { backgroundColor: '#16A34A' }]}
                  >
                    <Text style={styles.castActionBtnText}>
                      {attached ? 'Added ✓' : '+ Add'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      {/* FULL-SCREEN 11-SECTION DRAWER MODAL (exact match for 03:04 & 03:34 in video) */}
      <Modal
        visible={sectionDrawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSectionDrawerOpen(false)}
      >
        <View style={styles.drawerBackdrop}>
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <Pressable onPress={() => setSectionDrawerOpen(false)}>
                <Text style={styles.drawerCloseX}>✕</Text>
              </Pressable>
              <Text style={styles.drawerReorderText}>Reorder</Text>
            </View>
            <ScrollView contentContainerStyle={styles.drawerButtonsList}>
              {SHEET_SECTIONS.map((sec) => {
                const active = sec.key === section;
                return (
                  <Pressable
                    key={sec.key}
                    onPress={() => {
                      setSection(sec.key);
                      setSectionDrawerOpen(false);
                    }}
                    style={[styles.drawerItemBtn, active && styles.drawerItemBtnActive]}
                  >
                    <Text style={styles.drawerItemIcon}>{sec.icon}</Text>
                    <Text style={styles.drawerItemLabel}>{sec.label}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => {
                  setSectionDrawerOpen(false);
                  setBuilderOpen(true);
                }}
                style={styles.drawerItemBtn}
              >
                <Text style={styles.drawerItemIcon}>📝</Text>
                <Text style={[styles.drawerItemLabel, { color: '#38BDF8' }]}>
                  Edit Character in Builder
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MANAGE POWERS FULL-SCREEN MODAL (exact match for 03:20 - 03:22 in video) */}
      <Modal
        visible={managePowersOpen}
        animationType="slide"
        onRequestClose={() => setManagePowersOpen(false)}
      >
        <View style={styles.root}>
          <View style={styles.topBar}>
            <Pressable onPress={() => setManagePowersOpen(false)} style={styles.backBtn}>
              <Text style={styles.backGlyph}>‹</Text>
            </Pressable>
            <Text style={styles.charTitle}>Manage Powers</Text>
          </View>
          <View style={styles.subTabsBar}>
            <Pressable
              onPress={() => setManagePowersTab('known')}
              style={[styles.subTabItem, managePowersTab === 'known' && styles.subTabItemActive]}
            >
              <Text
                style={[
                  styles.subTabText,
                  managePowersTab === 'known' && styles.subTabTextActive,
                ]}
              >
                ALL POWERS
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setManagePowersTab('prepared')}
              style={[
                styles.subTabItem,
                managePowersTab === 'prepared' && styles.subTabItemActive,
              ]}
            >
              <Text
                style={[
                  styles.subTabText,
                  managePowersTab === 'prepared' && styles.subTabTextActive,
                ]}
              >
                KNOWN POWERS ({d.knownPowerIds.length})
              </Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetScroll}>
            {(powersCatalog.data ?? [])
              .filter((pw) =>
                managePowersTab === 'prepared' ? d.knownPowerIds.includes(pw.id) : true,
              )
              .map((pw) => {
                const learned = d.knownPowerIds.includes(pw.id);
                let lvl = 0;
                try {
                  lvl = (JSON.parse(pw.propertiesJson) as { level?: number }).level ?? 0;
                } catch {
                  lvl = 0;
                }
                return (
                  <View key={pw.id} style={styles.managePowerRow}>
                    <Pressable onPress={() => setDetailEntry(pw)} style={{ flex: 1 }}>
                      <Text style={styles.managePowerName}>
                        {pw.name}{' '}
                        <Text style={styles.managePowerLevelTag}>
                          ({lvl === 0 ? 'AT-WILL' : `${lvl}ST/ND`})
                        </Text>
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        saveDetails({
                          knownPowerIds: learned
                            ? d.knownPowerIds.filter((x: string) => x !== pw.id)
                            : [...d.knownPowerIds, pw.id],
                        })
                      }
                      style={[styles.learnBtn, learned && styles.learnBtnActive]}
                    >
                      <Text style={[styles.learnBtnText, learned && styles.learnBtnTextActive]}>
                        {learned ? 'Learned ✓' : 'Learn'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
          </ScrollView>
        </View>
      </Modal>

      {/* MANAGE INVENTORY MODAL */}
      <Modal
        visible={manageInventoryOpen}
        animationType="slide"
        onRequestClose={() => setManageInventoryOpen(false)}
      >
        <View style={styles.root}>
          <View style={styles.topBar}>
            <Pressable onPress={() => setManageInventoryOpen(false)} style={styles.backBtn}>
              <Text style={styles.backGlyph}>‹</Text>
            </Pressable>
            <Text style={styles.charTitle}>Manage Inventory & Add Gear</Text>
          </View>
          <ScrollView contentContainerStyle={styles.sheetScroll}>
            {(itemsCatalog.data ?? []).map((item) => {
              let props: Record<string, unknown> = {};
              try {
                props = JSON.parse(item.propertiesJson) as Record<string, unknown>;
              } catch {
                props = {};
              }
              return (
                <View key={item.id} style={styles.managePowerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.managePowerName}>{item.name}</Text>
                    <Text style={styles.invItemCategory}>{item.summary}</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      const kind =
                        item.contentType === 'armor' && props.Category === 'shield'
                          ? 'shield'
                          : (item.contentType as
                              | 'weapon'
                              | 'armor'
                              | 'equipment'
                              | 'consumable'
                              | 'enhanced_item');
                      saveDetails({
                        inventory: [
                          ...d.inventory,
                          {
                            id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                            contentId: item.id,
                            name: item.name,
                            kind,
                            quantity: 1,
                            equipped: false,
                            weight: typeof props.weight === 'number' ? props.weight : 2,
                            cost: typeof props.cost === 'number' ? props.cost : 50,
                            armorCategory: props.armorCategory as
                              | 'light'
                              | 'medium'
                              | 'heavy'
                              | undefined,
                            baseAc: typeof props.baseAc === 'number' ? props.baseAc : undefined,
                            shieldAcBonus:
                              typeof props.shieldAcBonus === 'number'
                                ? props.shieldAcBonus
                                : undefined,
                            enhancementBonus: 0,
                            damageDice:
                              typeof props.damageDice === 'string' ? props.damageDice : undefined,
                            damageType:
                              typeof props.damageType === 'string' ? props.damageType : undefined,
                            finesse: Boolean(props.finesse),
                            ranged: Boolean(props.ranged),
                            properties: [],
                          },
                        ],
                      });
                    }}
                    style={styles.learnBtn}
                  >
                    <Text style={styles.learnBtnText}>+ Add</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* MANAGE DEFENSES CUSTOMIZE MODAL (matches 03:32 in video) */}
      <Modal
        visible={manageDefensesOpen}
        animationType="slide"
        onRequestClose={() => setManageDefensesOpen(false)}
      >
        <View style={styles.root}>
          <View style={styles.topBar}>
            <Pressable onPress={() => setManageDefensesOpen(false)} style={styles.backBtn}>
              <Text style={styles.backGlyph}>‹</Text>
            </Pressable>
            <Text style={styles.charTitle}>Customize Defenses</Text>
          </View>
          <View style={styles.subTabsBar}>
            {(['resistances', 'immunities', 'vulnerabilities'] as const).map((dt) => (
              <Pressable
                key={dt}
                onPress={() => setDefenseTarget(dt)}
                style={[styles.subTabItem, defenseTarget === dt && styles.subTabItemActive]}
              >
                <Text
                  style={[styles.subTabText, defenseTarget === dt && styles.subTabTextActive]}
                >
                  {dt.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
          <ScrollView contentContainerStyle={styles.sheetScroll}>
            {DAMAGE_TYPES.map((dmg) => {
              const list = d[defenseTarget] ?? [];
              const active = list.includes(dmg);
              return (
                <Pressable
                  key={dmg}
                  onPress={() =>
                    saveDetails({
                      [defenseTarget]: active
                        ? list.filter((x: string) => x !== dmg)
                        : [...list, dmg],
                    })
                  }
                  style={styles.managePowerRow}
                >
                  <Text style={styles.managePowerName}>{dmg} Damage</Text>
                  <View style={[styles.learnBtn, active && styles.learnBtnActive]}>
                    <Text style={[styles.learnBtnText, active && styles.learnBtnTextActive]}>
                      {active ? 'Active ✓' : 'Add'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* MANAGE FEATS MODAL */}
      <Modal
        visible={manageFeatsOpen}
        animationType="slide"
        onRequestClose={() => setManageFeatsOpen(false)}
      >
        <View style={styles.root}>
          <View style={styles.topBar}>
            <Pressable onPress={() => setManageFeatsOpen(false)} style={styles.backBtn}>
              <Text style={styles.backGlyph}>‹</Text>
            </Pressable>
            <Text style={styles.charTitle}>Manage Feats</Text>
          </View>
          <ScrollView contentContainerStyle={styles.sheetScroll}>
            {(featCatalog.data ?? []).map((ft) => {
              const active = d.featIds.includes(ft.id);
              return (
                <View key={ft.id} style={styles.managePowerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.managePowerName}>{ft.name}</Text>
                    <Text style={styles.invItemCategory}>{ft.summary}</Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      saveDetails({
                        featIds: active
                          ? d.featIds.filter((x: string) => x !== ft.id)
                          : [...d.featIds, ft.id],
                      })
                    }
                    style={[styles.learnBtn, active && styles.learnBtnActive]}
                  >
                    <Text style={[styles.learnBtnText, active && styles.learnBtnTextActive]}>
                      {active ? 'Added ✓' : 'Add'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* HP MANAGER MODAL */}
      <Modal
        visible={hpModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHpModalOpen(false)}
      >
        <View style={styles.drawerBackdrop}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>
              Hit Points: {d.hpCurrent} / {maxHp}
            </Text>
            <TextInput
              value={hpDeltaInput}
              onChangeText={setHpDeltaInput}
              keyboardType="numeric"
              style={styles.popupInput}
            />
            <View style={styles.popupBtnsRow}>
              <Pressable
                onPress={() => {
                  const delta = Math.max(1, parseInt(hpDeltaInput, 10) || 1);
                  saveDetails({ hpCurrent: Math.min(maxHp, d.hpCurrent + delta) });
                  setHpModalOpen(false);
                }}
                style={[styles.popupBtn, { backgroundColor: '#16A34A' }]}
              >
                <Text style={styles.popupBtnText}>HEAL (+)</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const delta = Math.max(1, parseInt(hpDeltaInput, 10) || 1);
                  saveDetails({ hpCurrent: Math.max(0, d.hpCurrent - delta) });
                  setHpModalOpen(false);
                }}
                style={[styles.popupBtn, { backgroundColor: '#DC2626' }]}
              >
                <Text style={styles.popupBtnText}>DAMAGE (-)</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setHpModalOpen(false)} style={styles.popupCloseBtn}>
              <Text style={styles.popupCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* SHORT REST / LONG REST MODAL */}
      <Modal
        visible={restModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRestModalOpen(false)}
      >
        <View style={styles.drawerBackdrop}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>Take a Rest</Text>
            <Pressable
              onPress={() => {
                const heal = Math.max(
                  1,
                  classSpec.fixedHpPerLevel + abilityModifier(d.scores.con),
                );
                saveDetails({
                  hpCurrent: Math.min(maxHp, d.hpCurrent + heal),
                  hitDiceSpent: Math.min(level, d.hitDiceSpent + 1),
                  techPointsSpent: 0,
                });
                setRestModalOpen(false);
              }}
              style={[styles.popupBtn, { backgroundColor: '#0284C7' }]}
            >
              <Text style={styles.popupBtnText}>
                SHORT REST (Spend 1 Hit Die & Recharge Tech Points)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                saveDetails({
                  hpCurrent: maxHp,
                  hpTemp: 0,
                  hitDiceSpent: Math.max(0, d.hitDiceSpent - Math.max(1, Math.floor(level / 2))),
                  forcePointsSpent: 0,
                  techPointsSpent: 0,
                  exhaustionLevel: Math.max(0, d.exhaustionLevel - 1),
                });
                setRestModalOpen(false);
              }}
              style={[styles.popupBtn, { backgroundColor: '#16A34A' }]}
            >
              <Text style={styles.popupBtnText}>
                LONG REST (Full HP, Force & Tech Points)
              </Text>
            </Pressable>
            <Pressable onPress={() => setRestModalOpen(false)} style={styles.popupCloseBtn}>
              <Text style={styles.popupCloseText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CONDITIONS MODAL */}
      <Modal
        visible={conditionsModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConditionsModalOpen(false)}
      >
        <View style={styles.drawerBackdrop}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>Active Conditions</Text>
            <View style={styles.condChipsWrap}>
              {CONDITIONS.map((cond: ConditionKey) => {
                const active = d.activeConditions.includes(cond);
                return (
                  <Pressable
                    key={cond}
                    onPress={() =>
                      saveDetails({
                        activeConditions: active
                          ? d.activeConditions.filter((c: ConditionKey) => c !== cond)
                          : [...d.activeConditions, cond],
                      })
                    }
                    style={[styles.powerPill, active && { backgroundColor: '#DC2626' }]}
                  >
                    <Text style={styles.powerPillText}>{cond}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => setConditionsModalOpen(false)}
              style={styles.popupCloseBtn}
            >
              <Text style={styles.popupCloseText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Character Builder Modal for Editing / Leveling Up */}
      <CharacterBuilderModal
        visible={builderOpen}
        initialCharacter={character}
        speciesEntries={speciesCatalog.data ?? []}
        archetypeEntries={archetypeCatalog.data ?? []}
        backgroundEntries={backgroundCatalog.data ?? []}
        featEntries={featCatalog.data ?? []}
        powerEntries={powersCatalog.data ?? []}
        catalogItems={itemsCatalog.data ?? []}
        onClose={() => setBuilderOpen(false)}
        onSaveCharacter={async (payload) => {
          await saveDetails(payload.details, payload.levelTotal, payload.name);
          setBuilderOpen(false);
        }}
      />

      <ContentDetailModal entry={detailEntry} onClose={() => setDetailEntry(null)} />
      <FloatingDiceRoller />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#12151A',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: '#161A20',
    borderBottomWidth: 1,
    borderBottomColor: '#262C36',
    gap: 8,
  },
  backBtn: {
    paddingRight: 8,
  },
  backGlyph: {
    color: '#FFFFFF',
    fontSize: 28,
  },
  topTitleCol: {
    flex: 1,
  },
  charTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  charSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  levelUpBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  levelUpBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  levelDownBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  levelDownBtnText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#161A20',
    gap: 10,
  },
  heroSideCol: {
    flex: 1,
    gap: 6,
  },
  acInitRow: {
    flexDirection: 'row',
    gap: 6,
  },
  shieldAcBox: {
    flex: 1,
    backgroundColor: '#222730',
    borderWidth: 1.5,
    borderColor: '#4B5563',
    borderRadius: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  shieldTopLabel: {
    color: '#9CA3AF',
    fontSize: 8,
    fontWeight: '800',
  },
  shieldAcNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  shieldBottomLabel: {
    color: '#9CA3AF',
    fontSize: 8,
    fontWeight: '800',
  },
  initBox: {
    flex: 1,
    backgroundColor: '#222730',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  initValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  initLabel: {
    color: '#9CA3AF',
    fontSize: 8,
    fontWeight: '800',
  },
  quickActionIconsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  squareActionBtn: {
    flex: 1,
    backgroundColor: '#222730',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  squareActionGlyph: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  portraitContainer: {
    alignItems: 'center',
    width: 86,
  },
  portraitFrame: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#2A3429',
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitAvatarGlyph: {
    fontSize: 32,
    color: '#4ADE80',
  },
  inspirationPill: {
    marginTop: -8,
    backgroundColor: '#2D3748',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  inspirationText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    textAlign: 'center',
  },
  hpBox: {
    backgroundColor: '#222730',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  hpLabel: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '800',
  },
  hpVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  conditionsBtn: {
    backgroundColor: '#222730',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
  },
  conditionsBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionBarWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: '#12151A',
  },
  sectionSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222730',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  sectionBarIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  sectionBarTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionGridIcon: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionMenuIcon: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  sheetScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: 110,
  },
  sectionContainer: {
    gap: 12,
  },
  abilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  ornateAbilityCard: {
    width: '30.5%',
    backgroundColor: '#1C222B',
    borderWidth: 1.5,
    borderColor: '#374151',
    borderRadius: 10,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 4,
  },
  ornateAbilityLabel: {
    color: '#D1D5DB',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  ornateAbilityMod: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 2,
  },
  ornateScoreCapsule: {
    backgroundColor: '#28303D',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  ornateScoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  subHeading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  savesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  savePillCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C222B',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 24,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 6,
  },
  profDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
  },
  profDotFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  savePillLabel: {
    flex: 1,
    color: '#E5E7EB',
    fontSize: 10,
    fontWeight: '800',
  },
  saveBonusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262E3B',
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBonusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sensePillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C222B',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 24,
    padding: 4,
    gap: 12,
  },
  senseValueCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#262E3B',
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  senseValueText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  senseLabel: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  skillsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#262C36',
  },
  skillColHeader: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '800',
  },
  skillTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E232B',
  },
  pinIcon: {
    color: '#6B7280',
    fontSize: 13,
  },
  skillModCol: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
  },
  skillNameCol: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  skillBonusBox: {
    width: 48,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#1C222B',
    alignItems: 'center',
  },
  skillBonusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  blueCategoryHeading: {
    color: '#2596FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C222B',
    padding: 10,
    borderRadius: 6,
    gap: 8,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionSub: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  nonProficientBadge: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nonProficientBadgeText: {
    color: '#FCA5A5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  combatTextBlock: {
    gap: 8,
  },
  combatRuleText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 20,
  },
  combatActionStrip: {
    gap: 4,
    paddingVertical: 6,
  },
  combatStripLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  combatStripPipe: {
    color: '#D1D5DB',
    fontSize: 13,
    borderLeftWidth: 2,
    borderLeftColor: '#9CA3AF',
    paddingLeft: 8,
  },
  subTabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#262C36',
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabItemActive: {
    borderBottomColor: '#2596FF',
  },
  subTabText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
  },
  subTabTextActive: {
    color: '#FFFFFF',
  },
  invSummaryBanner: {
    backgroundColor: '#1C222B',
    padding: 14,
    borderRadius: 8,
    gap: 12,
  },
  invSummaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invSummaryLabel: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '800',
  },
  invSummaryBig: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  invSummarySub: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
  },
  invSummaryCredits: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '900',
  },
  manageOutlineBtn: {
    borderWidth: 1,
    borderColor: '#2596FF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
  },
  manageOutlineBtnText: {
    color: '#2596FF',
    fontSize: 13,
    fontWeight: '700',
  },
  invGroupTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  invTableHeader: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#262C36',
  },
  invRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E232B',
    gap: 10,
  },
  invCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invCheckboxChecked: {
    borderColor: '#2596FF',
    backgroundColor: '#0284C7',
  },
  invCheckMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  invItemTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  invItemCategory: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  invWeightText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  invQtyVal: {
    width: 42,
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
  },
  invCostVal: {
    width: 68,
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'right',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222730',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  powerLevelPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  powerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#222730',
  },
  powerPillActive: {
    backgroundColor: '#2596FF',
  },
  powerPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  castingStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  castingStatCol: {
    alignItems: 'center',
  },
  castingStatNum: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  castingStatLbl: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '800',
  },
  pointsPoolLine: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  powerTableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#262C36',
  },
  powerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E232B',
  },
  powerNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  powerSubText: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  powerCellText: {
    width: 64,
    color: '#D1D5DB',
    fontSize: 12,
  },
  castActionBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  castActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  defenseMainRow: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#262C36',
    marginVertical: 6,
  },
  defenseGroupTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  defenseGroupValue: {
    color: '#D1D5DB',
    fontSize: 13,
  },
  featureBlock: {
    gap: 4,
    paddingVertical: 6,
  },
  featureBlockTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  redDot: {
    color: '#EF4444',
  },
  featurePageCite: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '400',
  },
  featureOriginSub: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  featureBodyText: {
    color: '#E5E7EB',
    fontSize: 13,
    lineHeight: 20,
  },
  profBigNumber: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  profSubLabel: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  profLineText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  profSourceMuted: {
    color: '#9CA3AF',
  },
  charTraitLine: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  charTraitVal: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noteFieldBlock: {
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222730',
    paddingBottom: 10,
  },
  noteInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 36,
  },
  extrasArtBanner: {
    height: 160,
    backgroundColor: '#1E242D',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  extrasArtGlyph: {
    fontSize: 48,
  },
  extrasArtTitle: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '700',
  },
  extraCreatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222730',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  drawerContainer: {
    backgroundColor: '#161A20',
    borderRadius: 10,
    padding: spacing.md,
    maxHeight: '90%',
    gap: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerCloseX: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  drawerReorderText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  drawerButtonsList: {
    gap: 8,
  },
  drawerItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222730',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  drawerItemBtnActive: {
    borderColor: '#DC2626',
  },
  drawerItemIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  drawerItemLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  managePowerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222730',
    gap: 10,
  },
  managePowerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  managePowerLevelTag: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  learnBtn: {
    borderWidth: 1,
    borderColor: '#2596FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
  },
  learnBtnActive: {
    backgroundColor: '#0284C7',
  },
  learnBtnText: {
    color: '#2596FF',
    fontSize: 12,
    fontWeight: '700',
  },
  learnBtnTextActive: {
    color: '#FFFFFF',
  },
  popupCard: {
    backgroundColor: '#1E242D',
    borderRadius: 8,
    padding: spacing.md,
    gap: 12,
  },
  popupTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  popupInput: {
    backgroundColor: '#12151A',
    color: '#FFFFFF',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  popupBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  popupBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  popupBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  popupCloseBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  popupCloseText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  condChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
