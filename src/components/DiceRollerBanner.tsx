import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AdvantageMode } from '../domain/calculations/dice';
import { SUPPORTED_DICE, useDiceStore } from '../features/dice/diceStore';
import { colors, radius, spacing, typography } from '../theme';

const MODES: { key: AdvantageMode; label: string }[] = [
  { key: 'normal', label: 'Normal' },
  { key: 'advantage', label: 'Advantage' },
  { key: 'disadvantage', label: 'Disadvantage' },
];

export function DiceRollerBanner() {
  const { mode, setMode, history, rollDieQuick, clearHistory } = useDiceStore();
  const latest = history[0];

  return (
    <View style={styles.container}>
      <View style={styles.modeRow}>
        {MODES.map((m) => {
          const active = mode === m.key;
          return (
            <Pressable
              key={m.key}
              accessibilityRole="button"
              onPress={() => setMode(m.key)}
              style={[styles.modeBtn, active && styles.modeBtnActive]}
            >
              <Text style={[styles.modeText, active && styles.modeTextActive]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.diceRow}
      >
        {SUPPORTED_DICE.map((d) => (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={`Roll d${d}`}
            onPress={() => rollDieQuick(d)}
            style={styles.dieBtn}
          >
            <Text style={styles.dieLabel}>d{d}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {latest ? (
        <View style={styles.resultBox}>
          <View style={styles.resultHeader}>
            <Text style={typography.heading}>
              {latest.label}: <Text style={{ color: colors.cyan }}>{latest.outcome.total}</Text>
            </Text>
            <Pressable accessibilityRole="button" onPress={clearHistory}>
              <Text style={styles.clearText}>Clear ({history.length})</Text>
            </Pressable>
          </View>
          <Text style={typography.caption}>
            [{latest.outcome.rolls.join(', ')}] ({latest.outcome.notation}, {latest.outcome.mode})
            {latest.outcome.isNatural20 ? ' • NAT 20!' : ''}
            {latest.outcome.isNatural1 ? ' • NAT 1' : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeBtnActive: {
    borderColor: colors.cyan,
    backgroundColor: colors.surfaceRaised,
  },
  modeText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  modeTextActive: {
    color: colors.cyan,
  },
  diceRow: {
    gap: spacing.xs,
  },
  dieBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dieLabel: {
    color: colors.amber,
    fontWeight: '700',
    fontSize: 14,
  },
  resultBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    gap: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
