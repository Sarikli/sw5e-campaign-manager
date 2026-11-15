# Roadmap & Project Status

## Status report (updated 2026-11-06)
| Category | Items |
|---|---|
| **Completed** | **Phase 0:** Architecture, schema, rules, sync & security docs.<br>**Phase 1:** Expo SDK 58 + strict TypeScript + Expo Router + dark sci-fi design system + i18n + versioned SQLite migrator.<br>**Phase 2:** Verified SW5e rules engine (PHB p. 15, 172–178, 191–192, 209–214, 233–235, 305–306), dice roller, canonical content pack (`sw5eCorePack.ts` from PHB, S&V, SotG, WH), and Compendium search.<br>**Phase 3:** Guided Character Creation Wizard (`CharacterBuilderModal.tsx`) with authentic PHB Ch. 2 species traits (all 30 species: speeds, climb/swim, senses, inherent skills, languages), class proficiencies & restricted skill lists, background benefits (all 20 backgrounds), starting equipment auto-equipping, and power level filtering.<br>**Phase 4:** Interactive Character Sheet (`src/app/character/[id].tsx`) with single-tap Level Up (1–20), full discrete level 1–20 class features (`FULL_CLASS_LEVEL_FEATURES`), archetype specialization features at level 3+, species traits, background features, dynamic AC/HP/Speed, equipped weapons/shields, Force & Tech point pools, Short/Long rest recovery, and conditions tracking.<br>**Phase 5:** Campaign & GM Workspace (`src/app/campaign/[id].tsx`) with party roster, session logs, notes, S&V creatures/NPCs, encounter & initiative turn tracker, and strict GM-only privacy isolation.<br>**Phase 6:** Revision-aware sync outbox, conflict detection & resolution UI, and `sw5e-portable-v1` JSON export/import.<br>**Phase 7:** Starships of the Galaxy hangar & shield/hull tracker, plus homebrew pack namespace isolation.<br>**Phase 8:** EAS build configuration (`eas.json`), full unit/integration test suite (7 suites, 68 tests), and Android/iOS production bundle verification. |
| **In progress** | — |
| **Blocked** | Physical device / store submission requires Apple Developer & Expo EAS credentials |
| **Untested** | Physical iOS/Android device interactive run (verified via Jest + RNTL + `node:sqlite` + Hermes bundle export) |
| **Verified** | `tsc --noEmit` (0 errors), `eslint src` (0 errors), `jest` (8 suites, 82 passed), `expo export` (Android & iOS Hermes bundles built cleanly) |
| **Known issues** | `npm audit` reports 5 moderate upstream advisories in dev tooling |
| **Technical debt** | Live Supabase project credentials to be wired into `RemoteSyncAdapter` when cloud project is provisioned |
| **Next milestone** | EAS Cloud Build & TestFlight / Internal Track distribution |

## Phases Summary

| Phase | Goal | Status |
|---|---|---|
| **0 Research & architecture** | Architecture, DB schema, rules & sync design | ✔ Complete |
| **1 Mobile foundation** | Expo SDK 58, strict TS, Expo Router, theme, SQLite migrations | ✔ Complete |
| **2 Content & rules foundation** | Verified SW5e rules engine, dice roller, canonical pack, compendium | ✔ Complete |
| **3 Character creation** | 4-step wizard, prerequisite checks, persistence | ✔ Complete |
| **4 Character management** | Interactive character sheet, powers, inventory, rests, progression | ✔ Complete |
| **5 Campaign & GM workspace** | Campaigns, rosters, sessions, notes, NPCs, encounters, GM privacy | ✔ Complete |
| **6 Cloud & shared campaigns** | Outbox flush adapter, conflict detection/resolution, portable export/import | ✔ Complete |
| **7 Advanced SW5e** | Starships of the Galaxy sheets, homebrew isolation | ✔ Complete |
| **8 Testing & release** | EAS build profiles, 42 automated tests, Android & iOS production bundles | ✔ Complete |
