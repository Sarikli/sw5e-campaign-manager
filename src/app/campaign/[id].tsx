import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { DiceRollerBanner } from '../../components/DiceRollerBanner';
import { FloatingDiceRoller } from '../../components/FloatingDiceRoller';
import { Screen } from '../../components/Screen';
import { ErrorState, LoadingState } from '../../components/StateViews';
import { rollNotation } from '../../domain/calculations/dice';
import type { ViewerRole, Visibility } from '../../domain/models/campaignWorkspace';
import { CLASS_SPECS } from '../../domain/sw5e/constants';
import { useDiceStore } from '../../features/dice/diceStore';
import { useRepositories } from '../../hooks/DatabaseProvider';
import { useAsync } from '../../hooks/useAsync';
import { colors, radius, spacing, TOUCH_TARGET, typography } from '../../theme';

type WorkspaceTab = 'gamelog' | 'roster' | 'sessions' | 'npcs' | 'encounters';

const TABS: { key: WorkspaceTab; label: string }[] = [
  { key: 'gamelog', label: 'GAME LOG' },
  { key: 'roster', label: 'CHARACTERS' },
  { key: 'encounters', label: 'ENCOUNTERS' },
  { key: 'npcs', label: 'NPCS & CREATURES' },
  { key: 'sessions', label: 'NOTES & SESSIONS' },
];

const CREATURE_PRESETS = [
  { name: 'B1 Battle Droid', role: 'Droid CR 1/4 (S&V p.51)', ac: 13, hp: 13, initBonus: 2 },
  { name: 'B2 Super Battle Droid', role: 'Droid CR 2 (S&V p.52)', ac: 16, hp: 45, initBonus: 0 },
  { name: 'Droideka', role: 'Droid CR 4 (S&V p.55)', ac: 15, hp: 68, initBonus: 1 },
  { name: 'Imperial Stormtrooper', role: 'Humanoid CR 1/2 (S&V p.203)', ac: 16, hp: 22, initBonus: 1 },
  { name: 'Mandalorian Warrior', role: 'Humanoid CR 3 (S&V p.191)', ac: 17, hp: 65, initBonus: 3 },
  { name: 'Sith Acolyte', role: 'Humanoid CR 2 (S&V p.176)', ac: 14, hp: 39, initBonus: 2 },
  { name: 'Rancor', role: 'Beast CR 6 (S&V p.34)', ac: 15, hp: 126, initBonus: 0 },
];

export default function CampaignWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { campaigns, characters } = useRepositories();
  const { history: rollHistory } = useDiceStore();

  const [viewerRole, setViewerRole] = useState<ViewerRole>('gm');
  const [tab, setTab] = useState<WorkspaceTab>('gamelog');

  // Forms
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionSummary, setSessionSummary] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteVis, setNoteVis] = useState<Visibility>('shared');

  const [npcName, setNpcName] = useState('');
  const [npcSecret, setNpcSecret] = useState('');
  const [npcVis, setNpcVis] = useState<Visibility>('shared');

  const [encName, setEncName] = useState('');
  const [activeEncId, setActiveEncId] = useState<string | null>(null);

  const campState = useAsync(() => campaigns.get(id), [id]);
  const allCharacters = useAsync(() => characters.list(), []);
  const roster = useAsync(() => campaigns.listCharacters(id), [id]);
  const sessions = useAsync(() => campaigns.listSessions(id, viewerRole), [id, viewerRole]);
  const notes = useAsync(() => campaigns.listNotes(id, viewerRole), [id, viewerRole]);
  const npcs = useAsync(() => campaigns.listNpcs(id, viewerRole), [id, viewerRole]);
  const encounters = useAsync(() => campaigns.listEncounters(id, viewerRole), [id, viewerRole]);

  const currentEncounterId = activeEncId ?? encounters.data?.[0]?.id ?? null;
  const participants = useAsync(
    () =>
      currentEncounterId
        ? campaigns.listParticipants(currentEncounterId, viewerRole)
        : Promise.resolve([]),
    [currentEncounterId, viewerRole],
  );

  if (campState.loading && !campState.data) return <LoadingState />;
  if (campState.error) return <ErrorState message={campState.error.message} onRetry={campState.reload} />;
  const campaign = campState.data;
  if (!campaign) return <ErrorState message="Campaign not found" onRetry={() => router.back()} />;

  const rosterIds = new Set(roster.data?.map((c) => c.id) ?? []);
  const activeEncounter = encounters.data?.find((e) => e.id === currentEncounterId) ?? null;

  async function addSessionRecord() {
    if (!sessionTitle.trim()) return;
    const nextNum = (sessions.data?.length ?? 0) + 1;
    await campaigns.addSession({
      campaignId: id,
      sessionNumber: nextNum,
      title: sessionTitle,
      summary: sessionSummary,
      visibility: 'shared',
    });
    setSessionTitle('');
    setSessionSummary('');
    sessions.reload();
  }

  async function addNoteRecord() {
    if (!noteTitle.trim()) return;
    await campaigns.addNote({
      campaignId: id,
      title: noteTitle,
      body: noteBody,
      visibility: noteVis,
    });
    setNoteTitle('');
    setNoteBody('');
    notes.reload();
  }

  async function addCustomNpc() {
    if (!npcName.trim()) return;
    await campaigns.addNpc({
      campaignId: id,
      name: npcName,
      notesGm: npcSecret,
      visibility: npcVis,
    });
    setNpcName('');
    setNpcSecret('');
    npcs.reload();
  }

  async function addPresetCreature(preset: (typeof CREATURE_PRESETS)[number]) {
    await campaigns.addNpc({
      campaignId: id,
      name: preset.name,
      roleOrType: preset.role,
      ac: preset.ac,
      hpMax: preset.hp,
      initiativeBonus: preset.initBonus,
      isCreature: true,
      visibility: 'shared',
    });
    npcs.reload();
  }

  async function createNewEncounter() {
    if (!encName.trim()) return;
    const created = await campaigns.createEncounter({
      campaignId: id,
      name: encName,
      visibility: 'shared',
    });
    setEncName('');
    setActiveEncId(created.id);
    encounters.reload();
  }

  async function populateEncounterFromRosterAndNpcs(encounterId: string) {
    for (const ch of roster.data ?? []) {
      const initRoll = rollNotation('1d20').total;
      await campaigns.addParticipant({
        encounterId,
        kind: 'character',
        refId: ch.id,
        name: ch.name,
        initiative: initRoll,
        hpMax: Math.max(10, ch.details.hpCurrent),
        ac: 14,
      });
    }
    for (const npc of npcs.data ?? []) {
      const initRoll = rollNotation(`1d20+${npc.initiativeBonus}`).total;
      await campaigns.addParticipant({
        encounterId,
        kind: npc.isCreature ? 'creature' : 'npc',
        refId: npc.id,
        name: npc.name,
        initiative: initRoll,
        initiativeBonus: npc.initiativeBonus,
        hpMax: npc.hpMax,
        ac: npc.ac,
        isHiddenFromPlayers: npc.visibility === 'gm_only',
      });
    }
    participants.reload();
  }

  return (
    <Screen title={campaign.name}>
      <View style={styles.topRow}>
        <Button label="← Campaigns" variant="secondary" onPress={() => router.back()} />
        <Pressable
          accessibilityRole="button"
          onPress={() => setViewerRole(viewerRole === 'gm' ? 'player' : 'gm')}
          style={[styles.roleToggle, viewerRole === 'player' && styles.roleTogglePlayer]}
        >
          <Text style={styles.roleText}>
            Viewing as: {viewerRole === 'gm' ? 'Game Master (Full)' : 'Player (GM Info Hidden)'}
          </Text>
        </Pressable>
      </View>

      <DiceRollerBanner />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {TABS.map((tItem) => (
          <Pressable
            key={tItem.key}
            onPress={() => setTab(tItem.key)}
            style={[styles.tabBtn, tab === tItem.key && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === tItem.key && styles.tabTextActive]}>
              {tItem.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {tab === 'gamelog' ? (
        <View style={styles.section}>
          <Card>
            <Text style={typography.heading}>Campaign Game Log (Live Dice Rolls)</Text>
            {rollHistory.length === 0 ? (
              <Text style={typography.caption}>
                No dice rolls recorded yet in this session. Roll from any Character Sheet or the floating d20 button to log checks, saves, and attacks here.
              </Text>
            ) : (
              rollHistory.map((entry) => (
                <View key={entry.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.body}>{entry.label}</Text>
                    <Text style={typography.caption}>
                      {entry.outcome.notation} • Rolls: [{entry.outcome.keptRolls.join(', ')}]
                    </Text>
                  </View>
                  <Text style={[typography.heading, { color: colors.cyan }]}>
                    = {entry.outcome.total}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </View>
      ) : null}

      {tab === 'roster' ? (
        <View style={styles.section}>
          <Card>
            <Text style={typography.heading}>Active Party Character Roster</Text>
            {roster.data?.length === 0 ? (
              <Text style={typography.caption}>
                No characters assigned yet. Assign characters below without duplicating their records.
              </Text>
            ) : null}
            {roster.data?.map((ch) => (
              <View key={ch.id} style={styles.itemRow}>
                <Pressable onPress={() => router.push(`/character/${ch.id}`)} style={{ flex: 1 }}>
                  <Text style={typography.body}>
                    {ch.name} — Lv {ch.levelTotal} {CLASS_SPECS[ch.details.classKey].name}
                  </Text>
                  <Text style={typography.caption}>
                    {ch.details.speciesName} • HP {ch.details.hpCurrent} • Tap to open sheet
                  </Text>
                </Pressable>
                <Button
                  label="Remove"
                  variant="danger"
                  onPress={async () => {
                    await campaigns.removeCharacter(id, ch.id);
                    roster.reload();
                  }}
                />
              </View>
            ))}
          </Card>

          <Card>
            <Text style={typography.heading}>Assign Existing Characters to Campaign</Text>
            {allCharacters.data
              ?.filter((c) => !rosterIds.has(c.id))
              .map((c) => (
                <View key={c.id} style={styles.itemRow}>
                  <Text style={[typography.body, { flex: 1 }]}>
                    {c.name} (Lv {c.levelTotal} {CLASS_SPECS[c.details.classKey].name})
                  </Text>
                  <Button
                    label="Assign to Party"
                    variant="secondary"
                    onPress={async () => {
                      await campaigns.addCharacter(id, c.id);
                      roster.reload();
                    }}
                  />
                </View>
              ))}
          </Card>
        </View>
      ) : null}

      {tab === 'sessions' ? (
        <View style={styles.section}>
          <Card>
            <Text style={typography.heading}>Session Log</Text>
            {viewerRole === 'gm' ? (
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  value={sessionTitle}
                  onChangeText={setSessionTitle}
                  placeholder="Session title (e.g. Escape from Nar Shaddaa)"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  value={sessionSummary}
                  onChangeText={setSessionSummary}
                  placeholder="Session summary & objectives"
                  placeholderTextColor={colors.textMuted}
                />
                <Button
                  label="Log Session"
                  onPress={addSessionRecord}
                  disabled={!sessionTitle.trim()}
                />
              </View>
            ) : null}
            {sessions.data?.map((s) => (
              <View key={s.id} style={styles.noteBox}>
                <Text style={typography.body}>
                  Session #{s.sessionNumber}: {s.title} ({s.playedOn})
                </Text>
                <Text style={typography.caption}>{s.summary}</Text>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={typography.heading}>Campaign & GM Notes</Text>
            {viewerRole === 'gm' ? (
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                  placeholder="Note title"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  value={noteBody}
                  onChangeText={setNoteBody}
                  placeholder="Note content"
                  placeholderTextColor={colors.textMuted}
                />
                <View style={styles.rowWrap}>
                  <Button
                    label={noteVis === 'gm_only' ? 'Visibility: GM Only 🔒' : 'Visibility: Shared'}
                    variant="secondary"
                    onPress={() => setNoteVis(noteVis === 'gm_only' ? 'shared' : 'gm_only')}
                  />
                  <Button label="Save Note" onPress={addNoteRecord} disabled={!noteTitle.trim()} />
                </View>
              </View>
            ) : null}

            {notes.data?.map((n) => (
              <View key={n.id} style={styles.noteBox}>
                <Text style={typography.body}>
                  {n.visibility === 'gm_only' ? '🔒 [GM ONLY] ' : ''}
                  {n.title}
                </Text>
                <Text style={typography.caption}>{n.body}</Text>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {tab === 'npcs' ? (
        <View style={styles.section}>
          {viewerRole === 'gm' ? (
            <Card>
              <Text style={typography.heading}>Add Scum & Villainy Creature or Custom NPC</Text>
              <View style={styles.rowWrap}>
                {CREATURE_PRESETS.map((p) => (
                  <Button
                    key={p.name}
                    label={`+ ${p.name}`}
                    variant="secondary"
                    onPress={() => addPresetCreature(p)}
                  />
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={npcName}
                onChangeText={setNpcName}
                placeholder="Custom NPC name"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={styles.input}
                value={npcSecret}
                onChangeText={setNpcSecret}
                placeholder="Private GM secret notes (never visible to players)"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.rowWrap}>
                <Button
                  label={npcVis === 'gm_only' ? 'NPC: GM Only 🔒' : 'NPC: Shared'}
                  variant="secondary"
                  onPress={() => setNpcVis(npcVis === 'gm_only' ? 'shared' : 'gm_only')}
                />
                <Button label="Add NPC" onPress={addCustomNpc} disabled={!npcName.trim()} />
              </View>
            </Card>
          ) : null}

          <Card>
            <Text style={typography.heading}>Campaign NPCs & Creatures</Text>
            {npcs.data?.map((npc) => (
              <View key={npc.id} style={styles.noteBox}>
                <Text style={typography.body}>
                  {npc.visibility === 'gm_only' ? '🔒 ' : ''}
                  {npc.name} — {npc.roleOrType} (AC {npc.ac}, HP {npc.hpMax})
                </Text>
                {npc.notesGm ? (
                  <Text style={{ color: colors.amber, fontSize: 13 }}>
                    GM Secret: {npc.notesGm}
                  </Text>
                ) : null}
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {tab === 'encounters' ? (
        <View style={styles.section}>
          {viewerRole === 'gm' ? (
            <Card>
              <Text style={typography.heading}>Create Encounter</Text>
              <View style={styles.rowWrap}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={encName}
                  onChangeText={setEncName}
                  placeholder="Encounter name (e.g. Docking Bay 94 Ambush)"
                  placeholderTextColor={colors.textMuted}
                />
                <Button
                  label="Create"
                  onPress={createNewEncounter}
                  disabled={!encName.trim()}
                />
              </View>
            </Card>
          ) : null}

          {activeEncounter ? (
            <Card>
              <View style={styles.topRow}>
                <View>
                  <Text style={typography.heading}>{activeEncounter.name}</Text>
                  <Text style={typography.caption}>
                    Round {activeEncounter.round} • Turn #{activeEncounter.activeIndex + 1}
                  </Text>
                </View>
                {viewerRole === 'gm' ? (
                  <View style={styles.rowWrap}>
                    <Button
                      label="Roll Party & NPCs"
                      variant="secondary"
                      onPress={() => populateEncounterFromRosterAndNpcs(activeEncounter.id)}
                    />
                    <Button
                      label="Next Turn →"
                      onPress={async () => {
                        await campaigns.advanceTurn(activeEncounter.id);
                        encounters.reload();
                      }}
                    />
                  </View>
                ) : null}
              </View>

              {participants.data?.map((p, idx) => {
                const isTurn = idx === activeEncounter.activeIndex;
                return (
                  <View
                    key={p.id}
                    style={[styles.participantRow, isTurn && styles.participantActive]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={typography.body}>
                        {isTurn ? '▶ ' : ''}
                        [{p.initiative}] {p.name} {p.isHiddenFromPlayers ? '🔒' : ''}
                      </Text>
                      <Text style={typography.caption}>
                        AC {p.ac} • HP {p.hpCurrent}/{p.hpMax}
                      </Text>
                    </View>
                    {viewerRole === 'gm' ? (
                      <View style={styles.rowWrap}>
                        <Button
                          label="-5"
                          variant="danger"
                          onPress={async () => {
                            await campaigns.updateParticipant(p.id, {
                              hpCurrent: p.hpCurrent - 5,
                            });
                            participants.reload();
                          }}
                        />
                        <Button
                          label="+5"
                          variant="secondary"
                          onPress={async () => {
                            await campaigns.updateParticipant(p.id, {
                              hpCurrent: p.hpCurrent + 5,
                            });
                            participants.reload();
                          }}
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </Card>
          ) : null}
        </View>
      ) : null}
      <FloatingDiceRoller />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  roleToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  roleTogglePlayer: {
    borderColor: colors.cyan,
  },
  roleText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  tabRow: {
    gap: spacing.xs,
  },
  tabBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    borderColor: colors.cyan,
    backgroundColor: colors.surfaceRaised,
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.cyan,
  },
  section: {
    gap: spacing.md,
  },
  form: {
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteBox: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  participantActive: {
    borderColor: colors.cyan,
    backgroundColor: colors.surfaceRaised,
  },
  input: {
    minHeight: TOUCH_TARGET,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
});
