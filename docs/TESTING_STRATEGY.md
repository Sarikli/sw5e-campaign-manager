# Testing Strategy

Status: Phase 0 plan. No tests exist yet. **No feature is complete without passing tests; never report unrun tests as passing.**

## 1. Pyramid
| Level | Tooling | Scope |
|---|---|---|
| Unit — domain | Jest (node env) | Rules, calculations, dice, validation. Highest coverage (target ≥ 90% lines in `src/domain`). Pure functions, table-driven, rule-cited |
| Integration — persistence | Jest + SQLite (see note) | Migrations (fresh + upgrade from each prior version fixture), repositories, transactions/rollback, outbox writes, privacy filtering, export/import round trip |
| Application | Jest with in-memory fakes of ports | Use-case workflows (create character, level up, link to campaign, run encounter) |
| Component/UI | jest-expo + React Native Testing Library | Wizard steps, sheet interactions, empty/error/loading states, accessibility labels |
| E2E (critical journeys) | Maestro (preferred, works on Android+iOS; to verify in Phase 1) or Detox | create character → restart → reopen; create campaign → link → run encounter; export/import |
| Manual device matrix | Android phone+tablet, iPhone, offline/airplane mode | Phase gates |

Note: expo-sqlite is native; for Jest-node integration tests we need a SQLite engine in node (e.g. better-sqlite3 or sql.js) behind the same `Database` adapter interface. Decide in Phase 1 spike; real-device/emulator tests cover native behaviour. Inability to run native SQLite in Jest is a known limitation, mitigated by the adapter and on-device smoke tests.

## 2. Rules testing
Fixtures derived only from verified SW5e text, each with `ruleRef`. Golden characters hand-computed and reviewed. Unverified rules → `it.todo`. Dice: bounds, distribution sanity (chi-square tolerance), advantage/disadvantage logic with seeded RNG, notation parser fuzzing.

## 3. Quality gate checklist (per feature)
- [ ] Workflow works end-to-end
- [ ] Persisted & reloaded after restart
- [ ] Validation (valid + invalid cases)
- [ ] Error/empty/loading states
- [ ] Tests written and **actually run** (record command + result)
- [ ] No regression (full suite green)
- [ ] Android checked (device/emulator)
- [ ] iOS checked (EAS sim/device) or explicitly marked "untested"
- [ ] Docs + status report updated

## 4. Specialized suites
- **Privacy:** player-view/export/sync responses never contain `gm_only` data (property-style tests over seeded data).
- **Migration:** upgrade from every historical schema fixture; interrupted-migration simulation.
- **Offline:** airplane-mode journeys; outbox accumulation; (Phase 6) reconnect and idempotent replay.
- **Sync (Phase 6):** two-device simulations, conflict scenarios, RLS policy tests with multiple users.
- **Performance:** startup time, large compendium search (FTS), sheet render with many items.
- **Accessibility:** screen reader labels, dynamic type, contrast, touch targets.

## 5. CI (Phase 1)
Typecheck (`tsc --noEmit`, strict), lint (incl. layer-boundary rules), unit+integration tests, `expo-doctor`, `npm audit` report. EAS builds for Android/iOS on milestone tags. CI provider TBD.

## 6. Status reporting
`docs/ROADMAP.md` maintains Completed / In progress / Blocked / Untested / Known issues / Technical debt / Next milestone.
