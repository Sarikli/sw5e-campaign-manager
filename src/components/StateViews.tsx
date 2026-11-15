import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { t } from '../localization';
import { colors, spacing } from '../theme';
import { Button } from './Button';

export function LoadingState() {
  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.cyan} />
      <Text style={styles.text}>{t('common.loading')}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={[styles.text, { color: colors.danger }]}>{message ?? t('common.error')}</Text>
      {onRetry ? <Button label={t('common.retry')} variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  text: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
});
