import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { CharacterBuilderModal } from '../../components/CharacterBuilderModal';
import { FloatingDiceRoller } from '../../components/FloatingDiceRoller';
import { computeMaxHp, abilityModifier } from '../../domain/calculations/characterStats';
import {
  defaultSavesForClass,
  type Character,
  type CharacterDetails,
} from '../../domain/models';
import { CLASS_SPECS } from '../../domain/sw5e/constants';
import {
  CLASS_STARTING_EQUIPMENT,
  getBackgroundStartingEquipment,
  PREMADE_CHARACTERS,
  type PremadeCharacterPreset,
} from '../../domain/sw5e/sourcebooks';
import { useRepositories } from '../../hooks/DatabaseProvider';
import { useAsync } from '../../hooks/useAsync';
import { spacing } from '../../theme';

export default function CharactersScreen() {
  const router = useRouter();
  const { characters, campaigns, content } = useRepositories();
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  // Create Mode Modal ("PREMADE" vs "CUSTOM" at 01:00 in video)
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [premadeModalOpen, setPremadeModalOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [menuChar, setMenuChar] = useState<Character | null>(null);

  const listQuery = useAsync(() => characters.list(), [characters]);
  const campaignsQuery = useAsync(async () => {
    const camps = await campaigns.list();
    const charToCamp: Record<string, string> = {};
    for (const c of camps) {
      const members = await campaigns.listCharacters(c.id);
      for (const m of members) {
        charToCamp[m.id] = c.name;
      }
    }
    return charToCamp;
  }, [campaigns, listQuery.data]);

  const speciesQuery = useAsync(
    () => content.searchEntries({ contentType: 'species', limit: 50 }),
    [content],
  );
  const archetypeQuery = useAsync(
    () => content.searchEntries({ contentType: 'archetype', limit: 50 }),
    [content],
  );
  const backgroundQuery = useAsync(
    () => content.searchEntries({ contentType: 'background', limit: 50 }),
    [content],
  );
  const featQuery = useAsync(
    () => content.searchEntries({ contentType: 'feat', limit: 50 }),
    [content],
  );
  const powersQuery = useAsync(async () => {
    const force = await content.searchEntries({ contentType: 'force_power', limit: 50 });
    const tech = await content.searchEntries({ contentType: 'tech_power', limit: 50 });
    return [...force, ...tech];
  }, [content]);
  const catalogQuery = useAsync(async () => {
    const weapons = await content.searchEntries({ contentType: 'weapon', limit: 50 });
    const armor = await content.searchEntries({ contentType: 'armor', limit: 50 });
    const gear = await content.searchEntries({ contentType: 'equipment', limit: 50 });
    const consumables = await content.searchEntries({ contentType: 'consumable', limit: 50 });
    return [...weapons, ...armor, ...gear, ...consumables];
  }, [content]);

  const handleSaveFromBuilder = useCallback(
    async (payload: {
      name: string;
      levelTotal: number;
      details: Partial<CharacterDetails>;
      openSheetAfter: boolean;
    }) => {
      if (editingCharacter) {
        await characters.update(editingCharacter.id, {
          name: payload.name,
          levelTotal: payload.levelTotal,
          creationState: 'complete',
          details: payload.details,
        });
        const id = editingCharacter.id;
        setBuilderOpen(false);
        setEditingCharacter(null);
        await listQuery.reload();
        if (payload.openSheetAfter) {
          router.push(`/character/${id}`);
        }
      } else {
        const created = await characters.create({
          name: payload.name,
          levelTotal: payload.levelTotal,
          creationState: 'complete',
          details: payload.details,
        });
        setBuilderOpen(false);
        await listQuery.reload();
        if (payload.openSheetAfter) {
          router.push(`/character/${created.id}`);
        }
      }
    },
    [characters, editingCharacter, listQuery, router],
  );

  const handleCreatePremade = useCallback(
    async (preset: PremadeCharacterPreset) => {
      const maxHp = computeMaxHp(
        preset.classKey,
        preset.levelTotal,
        abilityModifier(preset.scores.con),
      );
      const pkg = CLASS_STARTING_EQUIPMENT[preset.classKey];
      const bgPkg = getBackgroundStartingEquipment(preset.backgroundId);
      const inv = [
        ...pkg.packageAItems.map((it, idx) => ({
          id: `pre-cls-${idx}-${Date.now()}`,
          contentId: null,
          name: it.name,
          kind: it.kind,
          quantity: it.quantity,
          equipped: Boolean(it.equipped),
          weight: it.weight,
          cost: it.cost,
          armorCategory: it.armorCategory,
          baseAc: it.baseAc,
          shieldAcBonus: it.shieldAcBonus,
          enhancementBonus: 0,
          damageDice: it.damageDice,
          damageType: it.damageType,
          finesse: it.finesse,
          ranged: it.ranged,
          properties: [],
        })),
        ...bgPkg.items.map((it, idx) => ({
          id: `pre-bg-${idx}-${Date.now()}`,
          contentId: null,
          name: it.name,
          kind: it.kind,
          quantity: it.quantity,
          equipped: Boolean(it.equipped),
          weight: it.weight,
          cost: it.cost,
          armorCategory: undefined,
          baseAc: undefined,
          shieldAcBonus: undefined,
          enhancementBonus: 0,
          damageDice: it.damageDice,
          damageType: it.damageType,
          finesse: it.finesse,
          ranged: it.ranged,
          properties: [],
        })),
      ];

      const created = await characters.create({
        name: preset.name,
        levelTotal: preset.levelTotal,
        creationState: 'complete',
        details: {
          speciesId: preset.speciesId,
          speciesName: preset.speciesName,
          classKey: preset.classKey,
          archetypeId: preset.archetypeId,
          archetypeName: preset.archetypeName,
          backgroundId: preset.backgroundId,
          backgroundName: preset.backgroundName,
          alignment: preset.alignment,
          scores: preset.scores,
          skillProficiencies: preset.skillProficiencies,
          savingThrowProficiencies: defaultSavesForClass(preset.classKey),
          hpCurrent: maxHp,
          hpTemp: 0,
          credits: preset.credits,
          knownPowerIds: preset.knownPowerIds,
          featIds: preset.featIds,
          inventory: inv,
          notes: preset.backstory,
          structuredNotes: {
            organizations: '',
            allies: '',
            enemies: '',
            backstory: preset.backstory,
            other: '',
          },
        },
      });
      setPremadeModalOpen(false);
      await listQuery.reload();
      router.push(`/character/${created.id}`);
    },
    [characters, listQuery, router],
  );

  const filteredChars = [...(listQuery.data ?? [])]
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.details.speciesName.toLowerCase().includes(q) ||
        c.details.classKey.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  const charCampaignMap = campaignsQuery.data ?? {};

  return (
    <View style={styles.root}>
      {/* Top Bar (matches 00:56 in video) */}
      <View style={styles.topBar}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>SW</Text>
          <View style={styles.brandDot} />
        </View>
        <Pressable onPress={() => setSortAsc((v) => !v)} style={styles.centerTitleCol}>
          <Text style={styles.topTitle}>My Characters</Text>
          <Text style={styles.sortSubtitle}>
            Name: {sortAsc ? 'A - Z ⌃' : 'Z - A ⌄'}
          </Text>
        </Pressable>
        <View style={{ width: 30 }} />
      </View>

      {/* Search Bar: "Search characters" (00:56 in video) */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search characters"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Character Cards List (matches 00:56 - 00:58 in video) */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredChars.map((char) => {
          const d = char.details;
          const classSpec = CLASS_SPECS[d.classKey] ?? CLASS_SPECS.guardian;
          const campName = charCampaignMap[char.id];

          return (
            <View key={char.id} style={styles.charCard}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/character/${char.id}`)}
                style={styles.charMainRow}
              >
                <View style={styles.portraitBox}>
                  {d.avatarUri ? (
                    <Image
                      source={{ uri: d.avatarUri }}
                      style={{ width: '100%', height: '100%', borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.portraitGlyph}>
                      {classSpec.casterKind === 'force'
                        ? '⚔'
                        : classSpec.casterKind === 'tech'
                          ? '⚙'
                          : '🛡'}
                    </Text>
                  )}
                </View>

                <View style={styles.charInfoCol}>
                  <Text style={styles.charName}>{char.name}</Text>
                  <Text style={styles.charSubLine}>
                    Level {char.levelTotal} <Text style={styles.pipeSep}>|</Text> {d.speciesName}
                  </Text>
                  <Text style={styles.charClassLine}>
                    {classSpec.name}
                    {d.archetypeName ? `  •  ${d.archetypeName}` : ''}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Options for ${char.name}`}
                  onPress={() => setMenuChar(char)}
                  style={styles.dotsBtn}
                >
                  <Text style={styles.dotsGlyph}>⋮</Text>
                </Pressable>
              </Pressable>

              {/* Attached Campaign Banner Strip (exact match for 00:56 in video) */}
              {campName ? (
                <View style={styles.campaignBannerStrip}>
                  <Text style={styles.campaignFlagIcon}>🚩</Text>
                  <Text style={styles.campaignBannerText}>{campName}</Text>
                </View>
              ) : null}
            </View>
          );
        })}

        {filteredChars.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No characters yet</Text>
            <Text style={styles.emptySub}>
              Tap CREATE NEW CHARACTER below to build a custom hero or choose a premade adventurer.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom CREATE NEW CHARACTER Button Bar (matches 00:56 - 00:58 in video) */}
      <View style={styles.bottomCreateBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setEditingCharacter(null);
            setModeModalOpen(true);
          }}
          style={styles.createNewCharBtn}
        >
          <Text style={styles.createNewCharText}>CREATE NEW CHARACTER</Text>
        </Pressable>
      </View>

      {/* PREMADE vs CUSTOM Modal (exact match for 01:00 in video) */}
      <Modal
        visible={modeModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModeModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modeCardsStack}>
            <View style={styles.modeOptionCard}>
              <Text style={styles.modeOptionPrompt}>
                Create a character from a selection of exciting premade adventurers!
              </Text>
              <Pressable
                onPress={() => {
                  setModeModalOpen(false);
                  setPremadeModalOpen(true);
                }}
                style={styles.modeOutlineBtn}
              >
                <Text style={styles.modeOutlineBtnText}>PREMADE</Text>
              </Pressable>
            </View>

            <View style={styles.modeOptionCard}>
              <Text style={styles.modeOptionPrompt}>
                Create a character using Quickbuilder or by using a step-by-step approach.
              </Text>
              <Pressable
                onPress={() => {
                  setModeModalOpen(false);
                  setBuilderOpen(true);
                }}
                style={styles.modeOutlineBtn}
              >
                <Text style={styles.modeOutlineBtnText}>CUSTOM</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setModeModalOpen(false)}
              style={styles.modeCancelBlueBtn}
            >
              <Text style={styles.modeCancelBlueText}>✕ CANCEL</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* PREMADE ADVENTURERS SELECTION MODAL */}
      <Modal
        visible={premadeModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPremadeModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.premadeCard}>
            <View style={styles.premadeHeader}>
              <Text style={styles.premadeTitle}>Select a Premade Adventurer</Text>
              <Pressable onPress={() => setPremadeModalOpen(false)}>
                <Text style={styles.closeX}>✕</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: 10 }}>
              {PREMADE_CHARACTERS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => handleCreatePremade(p)}
                  style={styles.premadeRow}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.premadeItemName}>{p.name}</Text>
                    <Text style={styles.premadeItemSub}>{p.tagline}</Text>
                    <Text style={styles.premadeItemDesc} numberOfLines={2}>
                      {p.backstory}
                    </Text>
                  </View>
                  <View style={styles.selectPill}>
                    <Text style={styles.selectPillText}>CREATE ›</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 3-Dot Character Options Modal */}
      {menuChar ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setMenuChar(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modeOptionCard}>
              <Text style={styles.premadeItemName}>{menuChar.name}</Text>
              <Pressable
                onPress={() => {
                  const id = menuChar.id;
                  setMenuChar(null);
                  router.push(`/character/${id}`);
                }}
                style={styles.modeOutlineBtn}
              >
                <Text style={styles.modeOutlineBtnText}>VIEW CHARACTER SHEET</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const c = menuChar;
                  setMenuChar(null);
                  setEditingCharacter(c);
                  setBuilderOpen(true);
                }}
                style={styles.modeOutlineBtn}
              >
                <Text style={styles.modeOutlineBtnText}>EDIT IN CHARACTER BUILDER</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  const id = menuChar.id;
                  setMenuChar(null);
                  await characters.softDelete(id);
                  await listQuery.reload();
                }}
                style={[styles.modeOutlineBtn, { borderColor: '#EF4444' }]}
              >
                <Text style={[styles.modeOutlineBtnText, { color: '#EF4444' }]}>
                  DELETE CHARACTER
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMenuChar(null)}
                style={styles.modeCancelBlueBtn}
              >
                <Text style={styles.modeCancelBlueText}>CLOSE</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* 6-Step Character Builder Modal */}
      <CharacterBuilderModal
        visible={builderOpen}
        initialCharacter={editingCharacter}
        speciesEntries={speciesQuery.data ?? []}
        archetypeEntries={archetypeQuery.data ?? []}
        backgroundEntries={backgroundQuery.data ?? []}
        featEntries={featQuery.data ?? []}
        powerEntries={powersQuery.data ?? []}
        catalogItems={catalogQuery.data ?? []}
        onClose={() => {
          setBuilderOpen(false);
          setEditingCharacter(null);
        }}
        onSaveCharacter={handleSaveFromBuilder}
      />

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
    paddingVertical: 10,
    backgroundColor: '#161A20',
    borderBottomWidth: 1,
    borderBottomColor: '#262C36',
  },
  brandBadge: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  brandDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  centerTitleCol: {
    flex: 1,
    alignItems: 'center',
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  sortSubtitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262C36',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearIcon: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: 12,
    paddingBottom: 100,
  },
  charCard: {
    backgroundColor: '#222730',
    borderRadius: 6,
    overflow: 'hidden',
  },
  charMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  portraitBox: {
    width: 58,
    height: 58,
    borderRadius: 6,
    backgroundColor: '#14181F',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitGlyph: {
    fontSize: 28,
    color: '#38BDF8',
  },
  charInfoCol: {
    flex: 1,
    gap: 2,
  },
  charName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  charSubLine: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  pipeSep: {
    color: '#4B5563',
  },
  charClassLine: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  dotsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dotsGlyph: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  campaignBannerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C333F',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  campaignFlagIcon: {
    fontSize: 12,
  },
  campaignBannerText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  emptySub: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
  },
  bottomCreateBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#12151A',
    borderTopWidth: 1,
    borderTopColor: '#222730',
  },
  createNewCharBtn: {
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 6,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#181C22',
  },
  createNewCharText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  modeCardsStack: {
    gap: 12,
    marginBottom: 24,
  },
  modeOptionCard: {
    backgroundColor: '#222832',
    borderRadius: 8,
    padding: 18,
    gap: 14,
  },
  modeOptionPrompt: {
    color: '#F3F4F6',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modeOutlineBtn: {
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modeOutlineBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  modeCancelBlueBtn: {
    backgroundColor: '#2596FF',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modeCancelBlueText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  premadeCard: {
    backgroundColor: '#1E242D',
    borderRadius: 10,
    padding: spacing.md,
    maxHeight: '80%',
    gap: 12,
  },
  premadeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premadeTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  closeX: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  premadeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28303D',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  premadeItemName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  premadeItemSub: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  premadeItemDesc: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  selectPill: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  selectPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
