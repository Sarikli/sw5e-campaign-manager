import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { abilityModifier, formatSigned } from '../domain/calculations/characterStats';
import { CLASS_SPECS, type ClassKey } from '../domain/sw5e/constants';
import type { ContentEntry } from '../domain/sw5e/contentSchema';
import {
  CLASS_LEVEL_FEATURES,
  CLASS_STARTING_EQUIPMENT,
  getBackgroundStartingEquipment,
} from '../domain/sw5e/sourcebooks';
import { useDiceStore } from '../features/dice/diceStore';
import { colors, radius, spacing } from '../theme';
import { FormattedRuleText } from './FormattedRuleText';

interface Props {
  entry: ContentEntry | null;
  onClose: () => void;
}

export function ContentDetailModal({ entry, onClose }: Props) {
  const { rollCheck } = useDiceStore();

  if (!entry) return null;

  let props: Record<string, unknown> = {};
  try {
    props = JSON.parse(entry.propertiesJson) as Record<string, unknown>;
  } catch {
    props = {};
  }

  const isCreature = entry.contentType === 'creature' || entry.contentType === 'npc';
  const isClass = entry.contentType === 'class';
  const isPower = entry.contentType === 'force_power' || entry.contentType === 'tech_power';
  const isItem =
    entry.contentType === 'weapon' ||
    entry.contentType === 'armor' ||
    entry.contentType === 'equipment' ||
    entry.contentType === 'consumable' ||
    entry.contentType === 'enhanced_item';

  const classKey = (props.classKey as ClassKey | undefined) ?? (entry.slug as ClassKey);
  const classFeatures = isClass && CLASS_LEVEL_FEATURES[classKey] ? CLASS_LEVEL_FEATURES[classKey] : [];
  const classEquip = isClass && CLASS_STARTING_EQUIPMENT[classKey] ? CLASS_STARTING_EQUIPMENT[classKey] : null;
  const classSpec = isClass && CLASS_SPECS[classKey] ? CLASS_SPECS[classKey] : null;
  const bgEquip = entry.contentType === 'background' ? getBackgroundStartingEquipment(entry.slug) : null;

  // Creature ability scores fallback
  const crStr = typeof props.str === 'number' ? props.str : 14;
  const crDex = typeof props.dex === 'number' ? props.dex : 12;
  const crCon = typeof props.con === 'number' ? props.con : 14;
  const crInt = typeof props.int === 'number' ? props.int : 10;
  const crWis = typeof props.wis === 'number' ? props.wis : 12;
  const crCha = typeof props.cha === 'number' ? props.cha : 11;
  const crAc = typeof props.ac === 'number' ? props.ac : 15;
  const crHp = typeof props.hp === 'number' ? props.hp : 45;
  const crSpeed = typeof props.speed === 'string' ? props.speed : '30 ft.';
  const crInitMod = abilityModifier(crDex);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Top Navigation Bar matching 00:18 / 00:34 in video */}
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
          <View style={styles.titleRow}>
            <Text style={styles.typeGlyph}>
              {isCreature ? '🐾' : isPower ? '✦' : isItem ? '⚔' : isClass ? '🛡' : '❖'}
            </Text>
            <Text style={styles.topTitle} numberOfLines={1}>
              {entry.name}
            </Text>
            <View style={styles.sourceTag}>
              <Text style={styles.sourceTagText}>{entry.isCustom ? 'Homebrew' : 'SW5e Core'}</Text>
            </View>
          </View>
          <Text style={styles.bookmarkIcon}>🔖</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* CREATURE / MONSTER STATBLOCK VIEW (matches 00:18 - 00:20 in video) */}
          {isCreature ? (
            <>
              <View style={styles.creatureArtBanner}>
                <Text style={styles.creatureArtGlyph}>☠</Text>
                <Text style={styles.creatureArtCaption}>SCUM AND VILLAINY ARCHIVE</Text>
              </View>

              <View style={styles.statblockBox}>
                <Text style={styles.statblockTitle}>{entry.name.toUpperCase()}</Text>
                <Text style={styles.statblockSub}>
                  {(props.size as string) ?? 'Medium'} {(props.creatureType as string) ?? 'Humanoid'},{' '}
                  {(props.alignment as string) ?? 'Lawful Evil'}
                </Text>

                <View style={styles.divider} />

                <View style={styles.statInlineRow}>
                  <Text style={styles.statLabelBold}>
                    AC <Text style={styles.statVal}>{crAc}</Text>
                  </Text>
                  <Pressable
                    onPress={() => rollCheck(`${entry.name} Initiative`, crInitMod)}
                    style={styles.rollableInline}
                  >
                    <Text style={styles.statLabelBold}>
                      Initiative{' '}
                      <Text style={styles.statValCyan}>
                        {formatSigned(crInitMod)} ({10 + crInitMod})
                      </Text>
                    </Text>
                  </Pressable>
                </View>
                <Text style={styles.statLabelBold}>
                  HP <Text style={styles.statVal}>{crHp}</Text>{' '}
                  <Text style={styles.statMuted}>({(props.hitDice as string) ?? '8d8 + 16'})</Text>
                </Text>
                <Text style={styles.statLabelBold}>
                  Speed <Text style={styles.statVal}>{crSpeed}</Text>
                </Text>

                <View style={styles.divider} />

                {/* 2-Column Ability Score Table with MOD and SAV (exact 00:18 layout) */}
                <View style={styles.abilityGridHeader}>
                  <Text style={styles.abilityColHeader}>MOD   SAV</Text>
                  <Text style={styles.abilityColHeader}>MOD   SAV</Text>
                </View>
                {[
                  [
                    { k: 'STR', v: crStr },
                    { k: 'INT', v: crInt },
                  ],
                  [
                    { k: 'DEX', v: crDex },
                    { k: 'WIS', v: crWis },
                  ],
                  [
                    { k: 'CON', v: crCon },
                    { k: 'CHA', v: crCha },
                  ],
                ].map((pair, idx) => (
                  <View key={idx} style={styles.abilityPairRow}>
                    {pair.map((ab) => {
                      const mod = abilityModifier(ab.v);
                      return (
                        <Pressable
                          key={ab.k}
                          onPress={() => rollCheck(`${entry.name} ${ab.k}`, mod)}
                          style={[
                            styles.abilityCell,
                            idx % 2 === 1 && styles.abilityCellAlt,
                          ]}
                        >
                          <Text style={styles.abilityCellKey}>{ab.k}</Text>
                          <Text style={styles.abilityCellScore}>{ab.v}</Text>
                          <Text style={styles.abilityCellMod}>{formatSigned(mod)}</Text>
                          <Text style={styles.abilityCellSav}>{formatSigned(mod)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}

                <View style={styles.divider} />

                <Text style={styles.statLabelBold}>
                  Challenge Rating:{' '}
                  <Text style={styles.statVal}>{String(props.cr ?? '3')}</Text>
                </Text>
                <Text style={styles.statLabelBold}>
                  Summary: <Text style={styles.statVal}>{entry.summary}</Text>
                </Text>
              </View>

              <Text style={styles.sectionHeading}>Traits & Actions</Text>
              <FormattedRuleText text={entry.description} variant="dark" />

              <Text style={styles.sectionHeading}>Lore & Tactics</Text>
              <Text style={styles.bodyText}>
                Encountered across the galaxy, {entry.name} operates as a formidable adversary in Star Wars 5e campaigns. Game Masters can deploy this statblock directly into the Campaign Initiative Tracker.
              </Text>
            </>
          ) : null}

          {/* CLASS DETAIL VIEW (matches 00:50 - 00:54 in video) */}
          {isClass ? (
            <>
              {classEquip ? (
                <View style={styles.startingEquipBox}>
                  <Text style={styles.startingEquipLabel}>Starting Equipment</Text>
                  <Text style={styles.startingEquipValue}>
                    Choose A or B: {classEquip.packageALabel}; or (B) {classEquip.packageBCredits} CR
                  </Text>
                </View>
              ) : null}

              <FormattedRuleText text={entry.description} variant="dark" />

              {classSpec ? (
                <View style={styles.metaList}>
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaKey}>Hit Die: </Text>1d{classSpec.hitDie} ({classSpec.fixedHpPerLevel} fixed per level)
                  </Text>
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaKey}>Saving Throws: </Text>
                    {classSpec.savingThrows.map((s) => s.toUpperCase()).join(', ')}
                  </Text>
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaKey}>Caster Type: </Text>
                    {classSpec.casterKind.toUpperCase()} ({classSpec.pointsPerLevel} pts/lvl, Max Power Level {classSpec.potentialMaxPowerLevel})
                  </Text>
                </View>
              ) : null}

              {classFeatures.map((feat) => (
                <View key={`${feat.level}-${feat.title}`} style={styles.featureBlock}>
                  <Text style={styles.sectionHeading}>
                    Level {feat.level}: {feat.title}
                  </Text>
                  <FormattedRuleText text={feat.description} variant="dark" />
                </View>
              ))}
            </>
          ) : null}

          {/* ITEM / POWER / SPECIES / BACKGROUND / FEAT DETAIL VIEW (matches 00:32 - 00:34 in video) */}
          {!isCreature && !isClass ? (
            <>
              <View style={styles.itemMetaBox}>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaKey}>Type: </Text>
                  {entry.contentType.replace('_', ' ').toUpperCase()}
                </Text>
                {props.cost !== undefined ? (
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaKey}>Cost: </Text>
                    {String(props.cost)} CR
                  </Text>
                ) : null}
                {props.weight !== undefined ? (
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaKey}>Weight: </Text>
                    {String(props.weight)} lb
                  </Text>
                ) : null}
                {props.level !== undefined ? (
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaKey}>Power Level: </Text>
                    {Number(props.level) === 0 ? 'At-Will (0 pts)' : `Level ${String(props.level)} (${Number(props.level) + 1} pts)`}
                  </Text>
                ) : null}
                {props.alignment !== undefined ? (
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaKey}>Alignment: </Text>
                    {String(props.alignment).toUpperCase()}
                  </Text>
                ) : null}
                {props.castingTime !== undefined ? (
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaKey}>Casting Time: </Text>
                    {String(props.castingTime)}
                  </Text>
                ) : null}
                {props.range !== undefined ? (
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaKey}>Range: </Text>
                    {String(props.range)}
                  </Text>
                ) : null}
                {props.damageDice !== undefined ? (
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaKey}>Damage: </Text>
                    {String(props.damageDice)} {String(props.damageType ?? '')}
                  </Text>
                ) : null}
                <Text style={styles.metaLine}>
                  <Text style={styles.metaKey}>Summary: </Text>
                  {entry.summary}
                </Text>
              </View>

              <View style={styles.divider} />

              {bgEquip ? (
                <View style={[styles.startingEquipBox, { marginBottom: spacing.md }]}>
                  <Text style={styles.startingEquipLabel}>Starting Equipment</Text>
                  <Text style={styles.startingEquipValue}>
                    (A) {bgEquip.label}; or (B) {bgEquip.credits} CR
                  </Text>
                </View>
              ) : null}

              <FormattedRuleText text={entry.description} variant="dark" />
            </>
          ) : null}

          <Text style={styles.sourceCitation}>{entry.sourceRef}</Text>
        </ScrollView>
      </View>
    </Modal>
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
    paddingVertical: spacing.sm,
    backgroundColor: '#181C22',
    borderBottomWidth: 1,
    borderBottomColor: '#2A313C',
    gap: spacing.sm,
  },
  backBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  backGlyph: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '600',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeGlyph: {
    color: '#EF4444',
    fontSize: 16,
  },
  topTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  sourceTag: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceTagText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  bookmarkIcon: {
    fontSize: 16,
    color: '#94A3B8',
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 60,
  },
  creatureArtBanner: {
    height: 160,
    borderRadius: radius.md,
    backgroundColor: '#1E1B2E',
    borderWidth: 1,
    borderColor: '#3B2F63',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  creatureArtGlyph: {
    fontSize: 54,
    color: '#C084FC',
  },
  creatureArtCaption: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  statblockBox: {
    backgroundColor: '#1D222B',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 6,
  },
  statblockTitle: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  statblockSub: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 6,
  },
  statInlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rollableInline: {
    paddingVertical: 2,
  },
  statLabelBold: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '800',
  },
  statVal: {
    color: '#CBD5E1',
    fontWeight: '500',
  },
  statValCyan: {
    color: colors.cyan,
    fontWeight: '800',
  },
  statMuted: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  abilityGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 70,
  },
  abilityColHeader: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  abilityPairRow: {
    flexDirection: 'row',
    gap: 8,
  },
  abilityCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#262C36',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  abilityCellAlt: {
    backgroundColor: '#2D3542',
  },
  abilityCellKey: {
    color: '#F8FAFC',
    fontWeight: '900',
    fontSize: 13,
    width: 34,
  },
  abilityCellScore: {
    color: '#CBD5E1',
    fontSize: 13,
    width: 24,
  },
  abilityCellMod: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 13,
    width: 28,
    textAlign: 'right',
  },
  abilityCellSav: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 13,
    width: 28,
    textAlign: 'right',
  },
  startingEquipBox: {
    flexDirection: 'row',
    backgroundColor: '#1B222C',
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#2D3748',
    gap: spacing.md,
  },
  startingEquipLabel: {
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 13,
    width: 110,
  },
  startingEquipValue: {
    color: '#CBD5E1',
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
  },
  metaList: {
    backgroundColor: '#1A202C',
    padding: spacing.md,
    borderRadius: radius.sm,
    gap: 4,
  },
  itemMetaBox: {
    gap: 6,
  },
  metaLine: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
  metaKey: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  featureBlock: {
    gap: 4,
    marginTop: 6,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  bodyText: {
    color: '#D1D5DB',
    fontSize: 15,
    lineHeight: 23,
  },
  sourceCitation: {
    color: '#9CA3AF',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: spacing.md,
  },
});
