import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ContentDetailModal } from '../../components/ContentDetailModal';
import { FloatingDiceRoller } from '../../components/FloatingDiceRoller';
import type { ContentEntry, ContentType } from '../../domain/sw5e/contentSchema';
import { useRepositories } from '../../hooks/DatabaseProvider';
import { useAsync } from '../../hooks/useAsync';
import { spacing } from '../../theme';

type ListingCategoryKey =
  | 'force_powers'
  | 'tech_powers'
  | 'weapons'
  | 'enhanced_items'
  | 'equipment'
  | 'monsters'
  | 'species'
  | 'classes'
  | 'backgrounds'
  | 'feats'
  | 'maneuvers'
  | 'starships'
  | 'conditions';

interface CategorySpec {
  key: ListingCategoryKey;
  label: string;
  icon: string;
  types: ContentType[];
}

const CATEGORIES: readonly CategorySpec[] = [
  { key: 'force_powers', label: 'Force Powers', icon: '✦', types: ['force_power'] },
  { key: 'tech_powers', label: 'Tech Powers', icon: '⚙', types: ['tech_power'] },
  { key: 'weapons', label: 'Weapons', icon: '⚔', types: ['weapon'] },
  { key: 'enhanced_items', label: 'Enhanced Items', icon: '🧪', types: ['enhanced_item'] },
  {
    key: 'equipment',
    label: 'Armor & Equipment',
    icon: '🧰',
    types: ['armor', 'equipment', 'consumable'],
  },
  { key: 'monsters', label: 'Monsters', icon: '🐾', types: ['creature', 'npc'] },
  { key: 'species', label: 'Species', icon: '🧬', types: ['species'] },
  { key: 'classes', label: 'Classes', icon: '🛡', types: ['class', 'archetype'] },
  { key: 'backgrounds', label: 'Backgrounds', icon: '🎖', types: ['background'] },
  { key: 'feats', label: 'Feats & Fighting Styles', icon: '👑', types: ['feat', 'fighting_style'] },
  { key: 'maneuvers', label: 'Maneuvers', icon: '🎯', types: ['maneuver'] },
  {
    key: 'starships',
    label: 'Starships & Deployments',
    icon: '🚀',
    types: ['starship', 'deployment', 'venture'],
  },
  { key: 'conditions', label: 'Conditions', icon: '⚡', types: ['condition'] },
];

export default function ListingsScreen() {
  const { content } = useRepositories();
  const [selectedCategory, setSelectedCategory] = useState<ListingCategoryKey>('monsters');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEntry, setActiveEntry] = useState<ContentEntry | null>(null);

  // Homebrew creation modal state
  const [homebrewOpen, setHomebrewOpen] = useState(false);
  const [hbName, setHbName] = useState('');
  const [hbType, setHbType] = useState<ContentType>('weapon');
  const [hbSummary, setHbSummary] = useState('');
  const [hbDesc, setHbDesc] = useState('');

  const catSpec: CategorySpec =
    CATEGORIES.find((c) => c.key === selectedCategory) ?? CATEGORIES[4]!;

  const entriesQuery = useAsync(async () => {
    const all: ContentEntry[] = [];
    for (const ct of catSpec.types) {
      const list = await content.searchEntries({ contentType: ct, limit: 500 });
      all.push(...list);
    }
    return all;
  }, [content, catSpec]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredEntries = normalizedSearch
    ? (entriesQuery.data ?? []).filter(
        (item) =>
          item.name.toLowerCase().includes(normalizedSearch) ||
          item.summary.toLowerCase().includes(normalizedSearch) ||
          item.sourceRef.toLowerCase().includes(normalizedSearch),
      )
    : (entriesQuery.data ?? []);

  const sortedEntries = [...filteredEntries].sort((a, b) =>
    sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  );

  const handleCreateHomebrew = useCallback(async () => {
    if (!hbName.trim()) return;
    const slug = hbName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const packId = `hb-${slug}-${Date.now()}`;
    const ns = `homebrew:${slug || 'custom'}`;
    await content.installBundle({
      pack: {
        id: packId,
        namespace: ns,
        name: `Homebrew: ${hbName.trim()}`,
        publisher: 'Local User',
        rulesVersion: 'SW5e-2022',
        dataVersion: '1.0.0',
        licenseId: 'User-Homebrew',
        attribution: 'User Created Homebrew',
        sourceUrl: '',
        origin: 'homebrew',
      },
      entries: [
        {
          id: `${ns}:${hbType}:${slug || 'item'}`,
          packId,
          slug: slug || 'item',
          contentType: hbType,
          name: hbName.trim(),
          summary: hbSummary.trim() || 'Custom Homebrew Entry',
          description: hbDesc.trim() || 'Created in SW5e Campaign Manager.',
          prerequisitesJson: '{}',
          propertiesJson: '{}',
          sourceRef: 'User Homebrew',
          rulesVersion: 'SW5e-2022',
          dataVersion: '1.0.0',
          attribution: 'Local User',
          isCustom: true,
        },
      ],
    });
    setHbName('');
    setHbSummary('');
    setHbDesc('');
    setHomebrewOpen(false);
    await entriesQuery.reload();
  }, [content, hbName, hbType, hbSummary, hbDesc, entriesQuery]);

  const formatEntrySub = (item: ContentEntry) => {
    try {
      const p = JSON.parse(item.propertiesJson) as Record<string, unknown>;
      if (item.contentType === 'creature' || item.contentType === 'npc') {
        return `AC: ${String(p.ac ?? 15)} • HP: ${String(p.hp ?? 45)} • CR ${String(p.cr ?? 2)}`;
      }
      if (item.contentType === 'weapon' && p.damageDice) {
        return `${String(p.damageDice)} ${String(p.damageType ?? '')} • ${String(p.cost ?? 0)} cr • ${String(p.weight ?? 1)} lb.`.trim();
      }
      if (item.contentType === 'armor' && p.baseAc !== undefined) {
        return `AC ${String(p.baseAc)} • ${String(p.cost ?? 0)} cr • ${String(p.weight ?? 0)} lb.`;
      }
      if (p.cost !== undefined || p.weight !== undefined) {
        return `${String(p.cost ?? 0)} cr • ${String(p.weight ?? 1)} lb.`;
      }
    } catch {
      // ignore
    }
    return item.summary;
  };

  return (
    <View style={styles.root}>
      {/* Top Header Bar (matches 00:22 in video) */}
      <View style={styles.topBar}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>SW</Text>
          <View style={styles.brandDot} />
        </View>
        <Pressable onPress={() => setSortAsc((v) => !v)} style={styles.centerTitleCol}>
          <Text style={styles.topTitle}>Listings</Text>
          <Text style={styles.sortSubtitle}>
            Name: {sortAsc ? 'A - Z ⌃' : 'Z - A ⌄'}
          </Text>
        </Pressable>
        <Pressable onPress={() => setHomebrewOpen(true)} style={styles.homebrewBtn}>
          <Text style={styles.homebrewBtnText}>+ HB</Text>
        </Pressable>
      </View>

      {/* Category Switcher Bar (matches 00:22 in video) */}
      <View style={styles.switcherContainer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCategoryModalOpen(true)}
          style={styles.categorySelectorBar}
        >
          <Text style={styles.categoryBarIcon}>{catSpec.icon}</Text>
          <Text style={styles.categoryBarLabel}>
            {catSpec.label} ({sortedEntries.length})
          </Text>
          <Text style={styles.categoryGridGlyph}>⊞</Text>
        </Pressable>
        <View style={styles.searchRow}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${catSpec.label.toLowerCase()}...`}
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Listings ScrollView (matches 00:22 & 00:30 in video) */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {sortedEntries.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => setActiveEntry(item)}
            style={styles.listingRow}
          >
            <View style={styles.itemThumb}>
              <Text style={styles.itemThumbIcon}>{catSpec.icon}</Text>
            </View>
            <View style={styles.itemCenter}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemStats} numberOfLines={1}>
                {formatEntrySub(item)}
              </Text>
              <Text style={styles.itemSource} numberOfLines={1}>
                {item.sourceRef.startsWith('PHB')
                  ? "Player's Handbook"
                  : item.sourceRef.startsWith('S&V')
                    ? 'Scum and Villainy'
                    : item.sourceRef.startsWith('SotG')
                      ? 'Starships of the Galaxy'
                      : item.sourceRef}
              </Text>
            </View>
            {item.isCustom ? (
              <View style={styles.legacyBadge}>
                <Text style={styles.legacyBadgeText}>Homebrew</Text>
              </View>
            ) : (
              <View style={styles.legacyBadge}>
                <Text style={styles.legacyBadgeText}>SW5e</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Category Switcher Modal (exact match for 00:24 & 00:28 in video) */}
      <Modal
        visible={categoryModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.categoryModalCard}>
            <Pressable
              onPress={() => setCategoryModalOpen(false)}
              style={styles.closeModalBtn}
            >
              <Text style={styles.closeModalX}>✕</Text>
            </Pressable>
            <ScrollView contentContainerStyle={styles.categoryOptionsList}>
              {CATEGORIES.map((cat) => {
                const selected = cat.key === selectedCategory;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => {
                      setSelectedCategory(cat.key);
                      setCategoryModalOpen(false);
                    }}
                    style={[styles.categoryOptionBtn, selected && styles.categoryOptionBtnActive]}
                  >
                    <Text style={styles.categoryOptionIcon}>{cat.icon}</Text>
                    <Text style={styles.categoryOptionText}>{cat.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Homebrew Creation Modal */}
      <Modal
        visible={homebrewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHomebrewOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.categoryModalCard}>
            <View style={styles.hbHeaderRow}>
              <Text style={styles.hbTitle}>Create Homebrew Entry</Text>
              <Pressable onPress={() => setHomebrewOpen(false)}>
                <Text style={styles.closeModalX}>✕</Text>
              </Pressable>
            </View>
            <TextInput
              value={hbName}
              onChangeText={setHbName}
              placeholder="Entry Name..."
              placeholderTextColor="#9CA3AF"
              style={styles.hbInput}
            />
            <View style={styles.hbTypesRow}>
              {(['weapon', 'armor', 'force_power', 'tech_power', 'creature', 'feat'] as const).map(
                (t) => (
                  <Pressable
                    key={t}
                    onPress={() => setHbType(t)}
                    style={[styles.hbTypeChip, hbType === t && styles.hbTypeChipActive]}
                  >
                    <Text style={styles.hbTypeText}>{t}</Text>
                  </Pressable>
                ),
              )}
            </View>
            <TextInput
              value={hbSummary}
              onChangeText={setHbSummary}
              placeholder="Quick mechanical summary..."
              placeholderTextColor="#9CA3AF"
              style={styles.hbInput}
            />
            <TextInput
              value={hbDesc}
              onChangeText={setHbDesc}
              placeholder="Full rules description..."
              placeholderTextColor="#9CA3AF"
              multiline
              style={[styles.hbInput, { minHeight: 70 }]}
            />
            <Pressable onPress={handleCreateHomebrew} style={styles.hbSaveBtn}>
              <Text style={styles.hbSaveBtnText}>SAVE HOMEBREW</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ContentDetailModal entry={activeEntry} onClose={() => setActiveEntry(null)} />
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
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  homebrewBtn: {
    backgroundColor: '#262C36',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  homebrewBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  switcherContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B24',
    borderWidth: 1,
    borderColor: '#252D3B',
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 13,
    paddingVertical: 8,
  },
  clearSearchBtn: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  clearSearchText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
  },
  categorySelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222730',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  categoryBarIcon: {
    color: '#EF4444',
    fontSize: 18,
  },
  categoryBarLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  categoryGridGlyph: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 90,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222730',
    gap: 12,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#1E2530',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemThumbIcon: {
    fontSize: 22,
    color: '#38BDF8',
  },
  itemCenter: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  itemStats: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  itemSource: {
    color: '#9CA3AF',
    fontSize: 11,
    fontStyle: 'italic',
  },
  legacyBadge: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  legacyBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  categoryModalCard: {
    backgroundColor: '#1E242D',
    borderRadius: 8,
    padding: spacing.md,
    maxHeight: '84%',
    gap: 10,
  },
  closeModalBtn: {
    alignSelf: 'flex-start',
    padding: 4,
  },
  closeModalX: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  categoryOptionsList: {
    gap: 8,
  },
  categoryOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28303D',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  categoryOptionBtnActive: {
    borderColor: '#DC2626',
  },
  categoryOptionIcon: {
    fontSize: 18,
    color: '#38BDF8',
  },
  categoryOptionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  hbHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hbTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  hbInput: {
    backgroundColor: '#12151A',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  hbTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hbTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#28303D',
    borderRadius: 4,
  },
  hbTypeChipActive: {
    backgroundColor: '#0284C7',
  },
  hbTypeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  hbSaveBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  hbSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
