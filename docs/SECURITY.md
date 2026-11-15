# Security Risk Assessment

Status: Phase 0. Threat model for local-first now, cloud later.

## 1. Assets
User-generated data (characters, campaigns), **GM-private notes**, account credentials/tokens (Phase 6), content packs with attribution, export files.

## 2. Principles
Validate everything at boundaries (Zod); least privilege; server-side authorization only (RLS) when cloud arrives; no secrets in client or repo; fail safe; never silently discard user data; privacy by default (no analytics/crash upload without explicit approval).

## 3. Risk register
| ID | Threat | Impact | Mitigation | Phase |
|---|---|---|---|---|
| S1 | Private GM data leaks through player views, exports, or sync | High | `visibility` column; single player-view query layer; player export excludes `gm_only`; tests; RLS + views server-side; never client-side filtering for remote | 1,5,6 |
| S2 | Malicious/corrupt import file (oversized, crafted JSON, ID collisions overwriting canonical data) | High | Size limits, Zod strict schemas, namespaced IDs, canonical packs read-only, dry-run preview, transactional import | 2,3 |
| S3 | Malicious content pack (HTML/script in descriptions, huge payloads) | Med | Treat descriptions as plain/limited markup, sanitize/whitelist, render with RN `Text` (no WebView/HTML eval) | 2 |
| S4 | SQL injection | High | Parameterized queries only; no string-built SQL; lint rule/review | 1 |
| S5 | Data corruption by failed migration | Critical | Transactions, pre-migration backup, fixture tests, checksum | 1 |
| S6 | Data loss (crash, device loss) | High | WAL + transactions; export/backup; cloud backup later | 1,6 |
| S7 | Secrets in repo/client (Supabase service key, API keys) | Critical | Only anon key + RLS in client; `.env` git-ignored; secret scanning pre-commit; EAS secrets | 1,6 |
| S8 | Auth token theft | High | `expo-secure-store` for tokens; short-lived JWT + refresh; no tokens in logs | 6 |
| S9 | Broken access control (player edits GM data, joins uninvited) | High | RLS per table, RPCs for membership, invitation tokens single-use/expiring, policy tests with multiple users | 6 |
| S10 | Logs expose private data | Med | Redacting logger; no note bodies/credentials logged | 1 |
| S11 | Insecure local storage of exports (files shared to other apps) | Low–Med | User-initiated share only; warn that exports contain GM notes when included; optional exclusion | 3 |
| S12 | Dependency supply-chain/vulnerabilities | Med | Minimal deps, lockfile, `npm audit`, Dependabot-style review before releases | all |
| S13 | Third-party IP / store compliance issues | High | See DATA_SOURCES.md; original assets; disclaimers | all |
| S14 | Deep-link/URL injection via Expo Router | Med | Validate route params with Zod; avoid arbitrary URL handlers; invitation links verified server-side | 1,6 |
| S15 | Device-level privacy (screenshots, backups) | Low | Document; optional app lock later; Android `allowBackup` decision | 8 |

## 4. Local encryption stance
SQLite file is protected by OS app sandbox. No app-level encryption in v1 (no highly sensitive PII; GM notes are game data). Revisit (SQLCipher) if requirements change; decision recorded here. Tokens (not game data) go in SecureStore.

## 5. Permission model (local, enforced in application layer; mirrored by RLS later)
| Action | Owner/GM | Player (member) |
|---|---|---|
| Edit campaign settings, roster | ✔ | ✖ |
| Read `gm_only` notes/NPC secrets/hidden participants | ✔ | ✖ |
| Read `shared` content | ✔ | ✔ |
| Edit own characters | ✔ (own) | ✔ |
| Edit other players' characters | per campaign setting (default ✖) | ✖ |
| Run encounter | ✔ | ✖ (submit own initiative later) |
Local-only campaigns: the device user is owner+GM; the model still exists so Phase 6 maps directly.

## 6. Security review checkpoints
End of each phase: dependency audit, secrets scan, privacy-leak tests (Phase 5/6), RLS test suite (Phase 6), full review in Phase 8.
