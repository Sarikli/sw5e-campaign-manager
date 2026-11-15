import { useRouter } from 'expo-router';
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
import { FloatingDiceRoller } from '../../components/FloatingDiceRoller';
import { useRepositories } from '../../hooks/DatabaseProvider';
import { useAsync } from '../../hooks/useAsync';
import { spacing } from '../../theme';

export default function CampaignsScreen() {
  const router = useRouter();
  const { campaigns } = useRepositories();
  const [sortAsc, setSortAsc] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [setting, setSetting] = useState('SARIKLI');
  const [description, setDescription] = useState('');

  const listQuery = useAsync(async () => {
    const list = await campaigns.list();
    const counts: Record<string, number> = {};
    for (const c of list) {
      const members = await campaigns.listCharacters(c.id);
      counts[c.id] = members.length;
    }
    return { list, counts };
  }, [campaigns]);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    const created = await campaigns.create({
      name: name.trim(),
      setting: setting.trim() || 'SARIKLI',
      description: description.trim(),
    });
    setName('');
    setDescription('');
    setCreateModalOpen(false);
    await listQuery.reload();
    router.push(`/campaign/${created.id}`);
  }, [campaigns, name, setting, description, listQuery, router]);

  const sortedCampaigns = [...(listQuery.data?.list ?? [])].sort((a, b) =>
    sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  );
  const memberCounts = listQuery.data?.counts ?? {};

  return (
    <View style={styles.root}>
      {/* Top Bar (matches 01:48 & 03:46 in video) */}
      <View style={styles.topBar}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>SW</Text>
          <View style={styles.brandDot} />
        </View>
        <Pressable onPress={() => setSortAsc((v) => !v)} style={styles.centerTitleCol}>
          <Text style={styles.topTitle}>My Campaigns</Text>
          <Text style={styles.sortSubtitle}>
            Name: {sortAsc ? 'A - Z ⌃' : 'Z - A ⌄'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/settings')}
          style={styles.iconBtn}
        >
          <Text style={styles.iconBtnText}>⚙</Text>
        </Pressable>
      </View>

      {/* Campaign Cards List (exact match for 01:48 & 03:46 in video) */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {sortedCampaigns.map((camp) => {
          const count = memberCounts[camp.id] ?? 0;
          const dateStr = new Date(camp.createdAt).toLocaleDateString('en-US');

          return (
            <Pressable
              key={camp.id}
              accessibilityRole="button"
              onPress={() => router.push(`/campaign/${camp.id}`)}
              style={styles.campaignCard}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.campaignTitle}>{camp.name}</Text>
                <Text style={styles.playerCountText}>
                  {count} {count === 1 ? 'player' : 'players'}
                </Text>
              </View>
              <Text style={styles.roleLine}>
                ROLE: GM <Text style={styles.redDot}>•</Text> GM:{' '}
                {(camp.setting || 'SARIKLI').toUpperCase()}
              </Text>
              <Text style={styles.startedLine}>Campaign Started {dateStr}</Text>
            </Pressable>
          );
        })}

        {sortedCampaigns.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No campaigns yet</Text>
            <Text style={styles.emptySub}>
              Tap CREATE CAMPAIGN below to launch a new Star Wars 5e campaign.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom 2-Button Action Bar (matches 01:48 & 03:46 in video) */}
      <View style={styles.bottomActionBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCreateModalOpen(true)}
          style={styles.bottomOutlineBtn}
        >
          <Text style={styles.bottomOutlineBtnText}>CREATE CAMPAIGN</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCreateModalOpen(true)}
          style={styles.bottomOutlineBtn}
        >
          <Text style={styles.bottomOutlineBtnText}>JOIN CAMPAIGN</Text>
        </Pressable>
      </View>

      {/* Create / Join Campaign Modal */}
      <Modal
        visible={createModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create or Join SW5e Campaign</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Campaign Name (e.g. Shadows of Nar Shaddaa)"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
            <TextInput
              value={setting}
              onChangeText={setSetting}
              placeholder="Game Master Name / Era"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Campaign description or invite notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              style={[styles.input, { minHeight: 64 }]}
            />
            <View style={styles.modalBtnsRow}>
              <Pressable
                onPress={() => setCreateModalOpen(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </Pressable>
              <Pressable onPress={handleCreate} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>START CAMPAIGN</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  iconBtn: {
    padding: 4,
  },
  iconBtnText: {
    color: '#E5E7EB',
    fontSize: 18,
  },
  listContent: {
    padding: spacing.md,
    gap: 12,
    paddingBottom: 100,
  },
  campaignCard: {
    backgroundColor: '#222730',
    borderRadius: 6,
    padding: 16,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campaignTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  playerCountText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  roleLine: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  redDot: {
    color: '#EF4444',
  },
  startedLine: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
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
  bottomActionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#12151A',
    borderTopWidth: 1,
    borderTopColor: '#222730',
  },
  bottomOutlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 6,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#181C22',
  },
  bottomOutlineBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#1E242D',
    borderRadius: 8,
    padding: spacing.md,
    gap: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#12151A',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
