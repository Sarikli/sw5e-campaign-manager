import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FloatingDiceRoller } from '../../components/FloatingDiceRoller';
import { FormattedRuleText } from '../../components/FormattedRuleText';
import {
  SW5E_SOURCEBOOKS,
  type BookChapter,
  type BookSection,
  type Sourcebook,
} from '../../domain/sw5e/sourcebooks';
import { spacing } from '../../theme';

type LibraryFilter = 'ALL' | 'DOWNLOADED' | 'OWNED';

export default function LibraryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>('DOWNLOADED');

  // Book Reader state (matches 00:04 - 00:16 in video)
  const [activeBook, setActiveBook] = useState<Sourcebook | null>(null);
  const [activeSection, setActiveSection] = useState<{
    chapter: BookChapter;
    section: BookSection;
  } | null>(null);
  const [tocDrawerOpen, setTocDrawerOpen] = useState(false);

  const filteredBooks = SW5E_SOURCEBOOKS.filter((b) => {
    if (filter === 'OWNED' && b.category !== 'core') return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.chapters.some((c) => c.title.toLowerCase().includes(q))
    );
  });

  return (
    <View style={styles.root}>
      {/* Top App Header Bar (matches 00:00 in video) */}
      <View style={styles.topBar}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>SW</Text>
          <View style={styles.brandDot} />
        </View>
        <Text style={styles.topTitle}>Library</Text>
        <View style={styles.topRightActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Settings and Sync"
            onPress={() => router.push('/(tabs)/settings')}
            style={styles.iconBtn}
          >
            <Text style={styles.iconBtnText}>⚙</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Bar: "Search for sourcebooks and adventures" (00:00 in video) */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search for sourcebooks and adventures"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Filter Pills: ALL | DOWNLOADED | CORE RULES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          {(
            [
              { key: 'ALL', label: 'ALL' },
              { key: 'DOWNLOADED', label: 'DOWNLOADED' },
              { key: 'OWNED', label: 'CORE RULES' },
            ] as const
          ).map((pill) => {
            const active = filter === pill.key;
            return (
              <Pressable
                key={pill.key}
                onPress={() => setFilter(pill.key)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {pill.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* SOURCEBOOK CARDS */}
        <View style={styles.booksList}>
            {filteredBooks.map((book) => (
              <Pressable
                key={book.id}
                accessibilityRole="button"
                onPress={() => {
                  setActiveBook(book);
                  setActiveSection(null);
                }}
                style={styles.bookCard}
              >
                {/* Left Book Cover Art Thumbnail */}
                <View style={[styles.bookCover, { backgroundColor: book.secondaryColor, borderColor: book.accentColor }]}>
                  <Text style={styles.bookCoverHeader}>STAR WARS 5E</Text>
                  <Text style={styles.bookCoverGlyph}>{book.coverIcon}</Text>
                  <View style={styles.bookCoverFooterBar}>
                    <Text style={styles.bookCoverSub}>BEYOND</Text>
                    <Text style={styles.bookCoverMainTitle} numberOfLines={2}>
                      {book.title.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Right Book Info */}
                <View style={styles.bookRight}>
                  <View style={styles.bookTopBadgesRow}>
                    <Text style={styles.moreDots}>⋮</Text>
                  </View>

                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookDescription} numberOfLines={2}>
                    {book.description}
                  </Text>

                  <View style={styles.openBookRow}>
                    <Text style={styles.openBookLink}>Open book</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
      </ScrollView>

      {/* BOOK READER MODAL (matches 00:04 - 00:16 in video) */}
      {activeBook ? (
        <Modal
          visible
          animationType="slide"
          onRequestClose={() => {
            if (activeSection) {
              setActiveSection(null);
            } else {
              setActiveBook(null);
            }
          }}
        >
          <View style={styles.readerRoot}>
            {/* Reader Top Toolbar */}
            <View style={styles.readerTopBar}>
              <Pressable
                onPress={() => {
                  if (activeSection) {
                    setActiveSection(null);
                  } else {
                    setActiveBook(null);
                  }
                }}
                style={styles.backBtn}
              >
                <Text style={styles.backGlyph}>‹</Text>
              </Pressable>
              <Text style={styles.readerTopTitle} numberOfLines={1}>
                {activeSection ? activeSection.section.title : activeBook.title}
              </Text>
              <View style={styles.readerTools}>
                <Pressable onPress={() => setTocDrawerOpen((v) => !v)} style={styles.iconBtn}>
                  <Text style={styles.iconBtnText}>☰</Text>
                </Pressable>
                <Text style={styles.iconBtnText}>🔖</Text>
              </View>
            </View>

            {/* Table of Contents Drawer Overlay (matches 00:14 in video) */}
            {tocDrawerOpen ? (
              <View style={styles.tocDrawer}>
                <Pressable
                  onPress={() => setTocDrawerOpen(false)}
                  style={styles.tocDrawerHeader}
                >
                  <Text style={styles.tocDrawerTitle}>‹  Table of contents</Text>
                </Pressable>
                <ScrollView contentContainerStyle={styles.tocDrawerList}>
                  {activeBook.chapters.map((ch) => (
                    <View key={ch.id} style={styles.tocDrawerChapter}>
                      <Text style={styles.tocChapterHeading}>
                        {ch.numberLabel}: {ch.title}
                      </Text>
                      {ch.sections.map((sec) => (
                        <Pressable
                          key={sec.id}
                          onPress={() => {
                            setActiveSection({ chapter: ch, section: sec });
                            setTocDrawerOpen(false);
                          }}
                          style={styles.tocGreenLinkBtn}
                        >
                          <Text style={styles.tocGreenLink}>{sec.title}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Reader Content: Either Book Contents (00:04 - 00:08) OR Section Article (00:12 - 00:16) */}
            {!activeSection ? (
              <ScrollView contentContainerStyle={styles.readerScroll}>
                {/* Cover Art Banner (00:04 in video) */}
                <View
                  style={[
                    styles.readerCoverBanner,
                    { backgroundColor: activeBook.secondaryColor, borderColor: activeBook.accentColor },
                  ]}
                >
                  <Text style={styles.readerCoverGlyph}>{activeBook.coverIcon}</Text>
                  <Text style={styles.readerCoverTitle}>{activeBook.title}</Text>
                  <View style={styles.viewCoverPill}>
                    <Text style={styles.viewCoverText}>VIEW COVER ART</Text>
                  </View>
                </View>

                <View style={styles.taglineBox}>
                  <Text style={styles.taglineText}>{activeBook.tagline}</Text>
                </View>

                <Text style={styles.contentsMainHeading}>Contents</Text>

                {/* Chapters & Green Clickable Section Links (matches 00:04 - 00:08 in video) */}
                {activeBook.chapters.map((ch) => (
                  <View key={ch.id} style={styles.chapterGroup}>
                    <Text style={styles.chapterTitle}>
                      {ch.numberLabel}: {ch.title}
                    </Text>
                    {ch.sections.map((sec) => (
                      <View key={sec.id} style={styles.sectionLinksGroup}>
                        <Pressable
                          onPress={() => setActiveSection({ chapter: ch, section: sec })}
                        >
                          <Text style={styles.tocGreenLink}>{sec.title}</Text>
                        </Pressable>
                        {(sec.subTopics ?? []).map((sub) => (
                          <Pressable
                            key={sub.title}
                            onPress={() => setActiveSection({ chapter: ch, section: sec })}
                            style={{ paddingLeft: 14 }}
                          >
                            <Text style={styles.tocGreenLink}>{sub.title}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            ) : (
              /* Section Article Reader (matches 00:12 - 00:16 in video) */
              <ScrollView contentContainerStyle={styles.readerScroll}>
                <Text style={styles.articleChapterLabel}>
                  {activeSection.chapter.numberLabel} • {activeSection.section.pageRef}
                </Text>
                <Text style={styles.articleMainTitle}>{activeSection.section.title}</Text>

                <FormattedRuleText paragraphs={activeSection.section.paragraphs} variant="dark" />

                {/* Callout Box (matches brown SESSION ZERO box at 00:12 - 00:16 in video) */}
                {activeSection.section.calloutTitle ? (
                  <View style={styles.sessionZeroBox}>
                    <Text style={styles.sessionZeroTitle}>
                      {activeSection.section.calloutTitle}
                    </Text>
                    <Text style={styles.sessionZeroBody}>
                      {activeSection.section.calloutBody}
                    </Text>
                  </View>
                ) : null}

                {(activeSection.section.subTopics ?? []).map((sub) => (
                  <View key={sub.title} style={styles.subTopicBlock}>
                    <Text style={styles.subTopicTitle}>{sub.title}</Text>
                    <FormattedRuleText text={sub.body} variant="dark" />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </Modal>
      ) : null}

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
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 4,
  },
  iconBtnText: {
    color: '#E5E7EB',
    fontSize: 18,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 90,
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
  pillsRow: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222730',
  },
  filterPillActive: {
    backgroundColor: '#DC2626',
  },
  filterPillText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  booksList: {
    gap: 14,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#222730',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 162,
  },
  bookCover: {
    width: 118,
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRightWidth: 2,
  },
  bookCoverHeader: {
    color: '#E2E8F0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bookCoverGlyph: {
    fontSize: 42,
    color: '#FFFFFF',
  },
  bookCoverFooterBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: '100%',
    paddingVertical: 4,
    borderRadius: 4,
  },
  bookCoverSub: {
    color: '#F59E0B',
    fontSize: 8,
    fontWeight: '900',
  },
  bookCoverMainTitle: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  bookRight: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  bookTopBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  moreDots: {
    color: '#D1D5DB',
    fontSize: 18,
    fontWeight: '800',
  },
  bookTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  bookDescription: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 17,
  },
  openBookRow: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  openBookLink: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  readerRoot: {
    flex: 1,
    backgroundColor: '#12151A',
  },
  readerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#181C22',
    borderBottomWidth: 1,
    borderBottomColor: '#2A313C',
  },
  backBtn: {
    paddingRight: 12,
  },
  backGlyph: {
    color: '#FFFFFF',
    fontSize: 28,
  },
  readerTopTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  readerTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tocDrawer: {
    position: 'absolute',
    top: 52,
    right: 0,
    bottom: 0,
    width: '78%',
    backgroundColor: '#181C22',
    borderLeftWidth: 1,
    borderLeftColor: '#374151',
    zIndex: 50,
    padding: spacing.md,
  },
  tocDrawerHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  tocDrawerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  tocDrawerList: {
    paddingVertical: 12,
    gap: 14,
  },
  tocDrawerChapter: {
    gap: 6,
  },
  tocChapterHeading: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  tocGreenLinkBtn: {
    paddingLeft: 10,
    paddingVertical: 2,
  },
  readerScroll: {
    padding: spacing.md,
    gap: 14,
    paddingBottom: 60,
  },
  readerCoverBanner: {
    height: 220,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  readerCoverGlyph: {
    fontSize: 64,
    color: '#FFFFFF',
  },
  readerCoverTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  viewCoverPill: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  viewCoverText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  taglineBox: {
    backgroundColor: '#1C2128',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  taglineText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  contentsMainHeading: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  chapterGroup: {
    gap: 6,
    marginTop: 6,
  },
  chapterTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  sectionLinksGroup: {
    paddingLeft: 10,
    gap: 5,
  },
  tocGreenLink: {
    color: '#4ADE80',
    fontSize: 15,
    fontWeight: '600',
  },
  articleChapterLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  articleMainTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  articleParagraph: {
    color: '#E5E7EB',
    fontSize: 15,
    lineHeight: 24,
  },
  sessionZeroBox: {
    backgroundColor: '#3E2E1E',
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
    padding: 16,
    borderRadius: 6,
    gap: 6,
  },
  sessionZeroTitle: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  sessionZeroBody: {
    color: '#FEF3C7',
    fontSize: 14,
    lineHeight: 22,
  },
  subTopicBlock: {
    gap: 4,
    marginTop: 8,
  },
  subTopicTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
