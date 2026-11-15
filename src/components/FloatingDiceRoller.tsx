import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SUPPORTED_DICE, useDiceStore } from '../features/dice/diceStore';
import { colors, radius, spacing } from '../theme';

export function FloatingDiceRoller() {
  const { mode, history, setMode, rollDieQuick, clearHistory } = useDiceStore();
  const [trayOpen, setTrayOpen] = useState(false);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [animatingEntryId, setAnimatingEntryId] = useState<string | null>(null);

  const latest = history[0];
  const previous = history[1];

  useEffect(() => {
    if (!latest) return;
    setDismissedId(null);
    setAnimatingEntryId(latest.id);
    const timer = setTimeout(() => {
      setAnimatingEntryId((curr) => (curr === latest.id ? null : curr));
    }, 1800);
    return () => clearTimeout(timer);
  }, [latest]);

  const showToast = latest && latest.id !== dismissedId;
  const rawRoll = latest ? latest.outcome.keptRolls.reduce((a, b) => a + b, 0) : 0;
  const mod = latest ? latest.outcome.modifier : 0;
  const modText = mod === 0 ? '' : mod > 0 ? `+${mod}` : `${mod}`;

  return (
    <>
      {/* 3D-Styled d20 Roll Overlay (matches 02:52 - 03:02 in video) */}
      {latest && animatingEntryId === latest.id ? (
        <View pointerEvents="none" style={styles.dieOverlayContainer}>
          <View style={styles.die3dHex}>
            <Text style={styles.die3dFacetTop}>▲</Text>
            <Text style={styles.die3dNumber}>{rawRoll}</Text>
            <Text style={styles.die3dFacetBottom}>▼</Text>
          </View>
        </View>
      ) : null}

      {/* Bottom-Left Stacked Roll Result Toast (matches 02:54 - 03:10 in video) */}
      {showToast ? (
        <View style={styles.toastStack}>
          {previous ? (
            <View style={styles.previousChip}>
              <Text style={styles.previousChipLabel} numberOfLines={1}>
                {previous.label.toUpperCase()}
              </Text>
              <View style={styles.previousChipValueBox}>
                <Text style={styles.previousChipValue}>{previous.outcome.total}</Text>
              </View>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => setDismissedId(latest.id)}
            style={styles.toastCard}
          >
            <View style={styles.toastHeaderRow}>
              <Text style={styles.toastTitle} numberOfLines={1}>
                {latest.label.toUpperCase()}
              </Text>
              <Text style={styles.toastDismiss}>✕</Text>
            </View>
            <View style={styles.toastMainRow}>
              <Text style={styles.toastDieGlyph}>⬡</Text>
              <Text style={styles.toastMath}>
                {rawRoll}
                {modText}
              </Text>
              <Text style={styles.toastEquals}>=</Text>
              <Text style={styles.toastTotal}>{latest.outcome.total}</Text>
            </View>
            <Text style={styles.toastNotation}>
              {latest.outcome.notation}
              {latest.outcome.mode !== 'normal' ? ` (${latest.outcome.mode.toUpperCase()})` : ''}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Quick Dice Tray Popup when tapping the floating red d20 button */}
      {trayOpen ? (
        <View style={styles.trayCard}>
          <View style={styles.trayHeader}>
            <Text style={styles.trayTitle}>DICE ROLLER</Text>
            <View style={styles.modeRow}>
              {(['normal', 'advantage', 'disadvantage'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  style={[styles.modeChip, mode === m && styles.modeChipActive]}
                >
                  <Text style={[styles.modeChipText, mode === m && styles.modeChipTextActive]}>
                    {m === 'normal' ? 'NORM' : m === 'advantage' ? 'ADV' : 'DIS'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.diceGrid}>
            {SUPPORTED_DICE.map((sides) => (
              <Pressable
                key={sides}
                onPress={() => {
                  rollDieQuick(sides, 1, 0);
                  setTrayOpen(false);
                }}
                style={styles.dieBtn}
              >
                <Text style={styles.dieBtnGlyph}>⬡</Text>
                <Text style={styles.dieBtnLabel}>d{sides}</Text>
              </Pressable>
            ))}
          </View>
          {history.length > 0 ? (
            <Pressable
              onPress={() => {
                clearHistory();
                setTrayOpen(false);
              }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>Clear Roll Log</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Floating Crimson d20 Action Button (Bottom-Right) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Toggle Dice Roller"
        onPress={() => setTrayOpen((prev) => !prev)}
        style={styles.fab}
      >
        <View style={styles.fabInnerHex}>
          <Text style={styles.fabGlyph}>⬡</Text>
          <Text style={styles.fabNumber}>20</Text>
        </View>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  dieOverlayContainer: {
    position: 'absolute',
    top: '28%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 90,
  },
  die3dHex: {
    width: 108,
    height: 108,
    borderRadius: 24,
    backgroundColor: '#1E1B1E',
    borderWidth: 3,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ rotate: '-8deg' }],
  },
  die3dFacetTop: {
    color: '#7F1D1D',
    fontSize: 12,
    marginBottom: -4,
  },
  die3dNumber: {
    color: '#EF4444',
    fontSize: 38,
    fontWeight: '900',
  },
  die3dFacetBottom: {
    color: '#7F1D1D',
    fontSize: 12,
    marginTop: -4,
  },
  toastStack: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    width: 245,
    gap: 6,
    zIndex: 80,
  },
  previousChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#121820',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: radius.sm,
    paddingLeft: spacing.sm,
    paddingVertical: 4,
    paddingRight: 4,
    gap: spacing.sm,
  },
  previousChipLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 140,
  },
  previousChipValueBox: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previousChipValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
  },
  toastCard: {
    backgroundColor: '#11161D',
    borderWidth: 2,
    borderColor: '#0284C7',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 10,
  },
  toastHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toastTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
  },
  toastDismiss: {
    color: '#64748B',
    fontSize: 11,
    marginLeft: 6,
  },
  toastMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  toastDieGlyph: {
    color: '#CBD5E1',
    fontSize: 18,
    marginRight: 6,
  },
  toastMath: {
    color: '#E2E8F0',
    fontSize: 19,
    fontWeight: '700',
    flex: 1,
  },
  toastEquals: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  toastTotal: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  toastNotation: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  trayCard: {
    position: 'absolute',
    right: spacing.md,
    bottom: 76,
    width: 268,
    backgroundColor: '#131A24',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    zIndex: 85,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  trayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trayTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  modeChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeChipActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  modeChipText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  modeChipTextActive: {
    color: '#F87171',
  },
  diceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dieBtn: {
    width: 54,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieBtnGlyph: {
    color: '#EF4444',
    fontSize: 13,
  },
  dieBtnLabel: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  clearBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  clearBtnText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 82,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  fabInnerHex: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGlyph: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 28,
  },
  fabNumber: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
