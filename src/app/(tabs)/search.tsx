import { useState } from 'react';
import {
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

const FILTER_CHIPS: { key: ContentType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'ALL' },
  { key: 'class', label: 'CLASS' },
  { key: 'archetype', label: 'ARCHETYPE' },
  { key: 'force_power', label: 'FORCE POWER' },
  { key: 'tech_power', label: 'TECH POWER' },
  { key: 'enhanced_item', label: 'ENHANCED ITEM' },
  { key: 'weapon', label: 'WEAPON' },
  { key: 'armor', label: 'ARMOR' },
  { key: 'species', label: 'SPECIES' },
  { key: 'background', label: 'BACKGROUND' },
  { key: 'feat', label: 'FEAT' },
  { key: 'creature', label: 'MONSTER' },
];

export default function SearchScreen() {
  const { content } = useRepositories();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'ALL'>('ALL');
  const [activeEntry, setActiveEntry] = useState<ContentEntry | null>(null);

  const resultsQuery = useAsync(
    () =>
      content.searchEntries({
        query: query.trim() || undefined,
        contentType: typeFilter === 'ALL' ? undefined : typeFilter,
        limit: 100,
      }),
    [content, query, typeFilter],
  );

  const hasTyped = query.trim().length > 0 || typeFilter !== 'ALL';
  const results = resultsQuery.data ?? [];

  return (
    <View style={styles.root}>
      {/* Top Bar (matches 00:36 in video) */}
      <View style={styles.topBar}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>SW</Text>
          <View style={styles.brandDot} />
        </View>
        <Text style={styles.topTitle}>Search</Text>
        <Text style={styles.bookmarkIcon}>🔖</Text>
      </View>

      {/* Search Bar Row (matches 00:36 - 00:48 in video) */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search all content..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')}>
              <Text style={styles.clearX}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setTypeFilter((prev) => (prev === 'ALL' ? 'class' : 'ALL'))}
          style={styles.filterSlidersBtn}
        >
          <Text style={styles.filterSlidersGlyph}> sliders </Text>
        </Pressable>
      </View>

      {/* Empty Query State with Fanned Book Covers (exact match for 00:36 - 00:38 in video) */}
      {!hasTyped ? (
        <View style={styles.emptyCenter}>
          <View style={styles.fannedBooksRow}>
            <View style={[styles.fanCard, styles.fanLeft]}>
              <Text style={styles.fanHeader}>SCUM & VILLAINY</Text>
              <Text style={styles.fanGlyph}>☠</Text>
            </View>
            <View style={[styles.fanCard, styles.fanRight]}>
              <Text style={styles.fanHeader}>STARSHIPS</Text>
              <Text style={styles.fanGlyph}>🚀</Text>
            </View>
            <View style={[styles.fanCard, styles.fanCenter]}>
              <Text style={styles.fanHeader}>PLAYER’S HANDBOOK</Text>
              <Text style={styles.fanGlyph}>⚔</Text>
              <Text style={styles.fanFooter}>SW5e CORE</Text>
            </View>
          </View>
          <Text style={styles.emptyPromptText}>
            Use search to find powers, items, books, monsters and more
          </Text>
        </View>
      ) : (
        <>
          {/* Horizontal Category Filter Chips (matches 00:48 in video) */}
          <View style={styles.chipsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContent}
            >
              {FILTER_CHIPS.map((c) => {
                const active = c.key === typeFilter;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setTypeFilter(c.key)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* No Results State (matches 00:42 - 00:44 in video) */}
          {results.length === 0 ? (
            <View style={styles.noResultsCenter}>
              <Text style={styles.noResultsText}>No results found for &quot;{query}&quot;</Text>
              <Pressable
                onPress={() => {
                  setQuery('');
                  setTypeFilter('ALL');
                }}
                style={styles.startNewSearchBtn}
              >
                <Text style={styles.startNewSearchText}>START NEW SEARCH</Text>
              </Pressable>
            </View>
          ) : (
            /* Results List (matches 00:48 in video) */
            <ScrollView contentContainerStyle={styles.resultsList}>
              {results.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setActiveEntry(item)}
                  style={styles.resultRow}
                >
                  <View style={styles.resultBadgeBox}>
                    <Text style={styles.resultBadgeGlyph}>
                      {item.contentType === 'class' || item.contentType === 'archetype'
                        ? '🛡'
                        : item.contentType === 'force_power' || item.contentType === 'tech_power'
                          ? '✦'
                          : item.contentType === 'creature' || item.contentType === 'npc'
                            ? '🐾'
                            : '❖'}
                    </Text>
                  </View>
                  <View style={styles.resultCenter}>
                    <Text style={styles.resultTitle}>{item.name}</Text>
                    <Text style={styles.resultType}>
                      {item.contentType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                    <Text style={styles.resultSource}>{item.sourceRef}</Text>
                  </View>
                  <View style={styles.legacyTag}>
                    <Text style={styles.legacyTagText}>SW5e</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </>
      )}

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
    paddingVertical: 12,
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
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  bookmarkIcon: {
    fontSize: 18,
    color: '#E5E7EB',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 10,
  },
  searchBox: {
    flex: 1,
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
  clearX: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '700',
  },
  filterSlidersBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 6,
  },
  filterSlidersGlyph: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 24,
  },
  fannedBooksRow: {
    height: 210,
    width: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fanCard: {
    position: 'absolute',
    width: 132,
    height: 184,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
  },
  fanLeft: {
    backgroundColor: '#3B1219',
    borderColor: '#EF4444',
    left: 10,
    transform: [{ rotate: '-10deg' }, { scale: 0.9 }],
  },
  fanRight: {
    backgroundColor: '#3A260B',
    borderColor: '#F59E0B',
    right: 10,
    transform: [{ rotate: '10deg' }, { scale: 0.9 }],
  },
  fanCenter: {
    backgroundColor: '#0F2942',
    borderColor: '#38BDF8',
    zIndex: 5,
  },
  fanHeader: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  fanGlyph: {
    fontSize: 44,
    color: '#FFFFFF',
  },
  fanFooter: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyPromptText: {
    color: '#E5E7EB',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  chipsBar: {
    paddingBottom: 8,
  },
  chipsContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#181C22',
  },
  filterChipActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0C4A6E',
  },
  filterChipText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  noResultsCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  noResultsText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  startNewSearchBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 6,
  },
  startNewSearchText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  resultsList: {
    paddingHorizontal: spacing.md,
    paddingBottom: 90,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222730',
    gap: 12,
  },
  resultBadgeBox: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: '#92400E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBadgeGlyph: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  resultCenter: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resultType: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  resultSource: {
    color: '#9CA3AF',
    fontSize: 11,
    fontStyle: 'italic',
  },
  legacyTag: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  legacyTagText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
});
