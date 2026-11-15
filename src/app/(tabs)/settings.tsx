import Constants from 'expo-constants';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { useRepositories } from '../../hooks/DatabaseProvider';
import { useAsync } from '../../hooks/useAsync';
import { t } from '../../localization';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '../../theme';

export default function SettingsScreen() {
  const { characters, campaigns, starships, sync } = useRepositories();
  const [portableJson, setPortableJson] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const syncStatus = useAsync(async () => {
    const [outbox, conflicts] = await Promise.all([
      sync.getPendingOutboxCount(),
      sync.listOpenConflicts(),
    ]);
    return { outbox, conflicts };
  }, []);

  async function handleExport() {
    const [chars, camps, ships] = await Promise.all([
      characters.list(),
      campaigns.list(),
      starships.list(),
    ]);
    const bundle = await sync.exportPortableBundle(chars, camps, ships);
    setPortableJson(JSON.stringify(bundle, null, 2));
    setNotice(
      `Exported ${chars.length} character(s), ${camps.length} campaign(s), ${ships.length} starship(s).`,
    );
  }

  async function handleImport() {
    try {
      const parsed = JSON.parse(portableJson);
      const res = await sync.importPortableBundle(parsed);
      setNotice(
        `Imported ${res.importedCharacters} character(s), ${res.importedCampaigns} campaign(s). Conflicts detected: ${res.conflictsDetected}.`,
      );
      syncStatus.reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Invalid portable JSON');
    }
  }

  return (
    <Screen title={t('settings.title')}>
      <Card>
        <Text style={typography.heading}>Local-First & Cloud Sync Status</Text>
        <Text style={typography.caption}>
          Pending Outbox Operations: {syncStatus.data?.outbox ?? 0} • Open Conflicts:{' '}
          {syncStatus.data?.conflicts.length ?? 0}
        </Text>
        {syncStatus.data?.conflicts.map((conf) => (
          <View key={conf.id} style={styles.conflictBox}>
            <Text style={{ color: colors.amber, fontWeight: '700' }}>
              Conflict on {conf.entityTable} ({conf.entityId})
            </Text>
            <View style={styles.rowWrap}>
              <Button
                label="Keep Local Version"
                variant="secondary"
                onPress={async () => {
                  await sync.resolveConflict(conf.id, 'keep_local');
                  syncStatus.reload();
                }}
              />
              <Button
                label="Accept Incoming Version"
                onPress={async () => {
                  await sync.resolveConflict(conf.id, 'accept_remote');
                  syncStatus.reload();
                }}
              />
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={typography.heading}>Portable Data Backup & Restore (sw5e-portable-v1)</Text>
        <View style={styles.rowWrap}>
          <Button label="Export All Data to JSON" onPress={handleExport} />
          <Button
            label="Import JSON Bundle"
            variant="secondary"
            onPress={handleImport}
            disabled={!portableJson.trim()}
          />
        </View>
        {notice ? <Text style={{ color: colors.cyan }}>{notice}</Text> : null}
        <TextInput
          style={styles.jsonBox}
          multiline
          value={portableJson}
          onChangeText={setPortableJson}
          placeholder="Exported JSON will appear here, or paste a sw5e-portable-v1 bundle to import…"
          placeholderTextColor={colors.textMuted}
        />
      </Card>

      <Card>
        <Text style={typography.heading}>{t('settings.about')}</Text>
        <Text style={typography.caption}>
          {t('settings.version')}: {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
        <Text style={typography.caption}>{t('settings.disclaimer')}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  conflictBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
    gap: 4,
  },
  jsonBox: {
    minHeight: TOUCH_TARGET * 2.5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    padding: spacing.sm,
    fontSize: 12,
  },
});
