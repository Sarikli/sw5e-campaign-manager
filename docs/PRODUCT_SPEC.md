# Product Specification (PRD)

Status: Phase 0 draft · Version 1.0-draft

## 1. Vision
A polished, offline-first tabletop companion for Star Wars 5e (SW5e) for Players and Game Masters, with a cloud-ready architecture for shared campaigns. Functionally comparable in scope to major digital character/campaign tools; original identity.

Unofficial fan tool. Not affiliated with or endorsed by SW5e, Lucasfilm, Disney, or Wizards of the Coast.

## 2. Users and jobs-to-be-done
| User | Needs |
|---|---|
| Player | Build a legal character; run it at the table (HP, resources, powers, rolls); level up; join a campaign (later online). |
| Game Master | Create a campaign; track party; prep NPCs/encounters; run initiative and combat; keep private notes; share selected info. |

## 3. Locked decisions
Android + iOS (one codebase), English-only with i18n structure, local-first SQLite, no account required, Supabase deferred to Phase 6, scope = characters + campaigns + GM tools integrated.

## 4. Functional requirements
Priority: **P0** = initial release, **P1** = after core, **P2** = expansion.

### 4.1 Characters
- P0 Creation wizard: identity → species → class → archetype → background → ability scores → skills → saves → proficiencies → equipment → features → powers → summary.
- P0 Validation against SW5e prerequisites; invalid combinations rejected (unless a campaign house rule permits).
- P0 Interactive sheet: portrait, identity, level, class/archetype, species/background, abilities, saves, skills, AC, HP, temp HP, initiative, speed, proficiency bonus, attacks/damage, inventory, credits, conditions, features, force/tech powers, maneuvers, resource tracking.
- P0 Level-up workflow with explicit user choices; never auto-assumes choices.
- P0 Edit, duplicate, archive/delete (confirmed), export/import.

### 4.2 Force & Tech powers
- P0 Separate systems (not spells). Selection, details, casting time, range, duration, level, point cost, known/prepared where applicable, usage tracking, recovery. Rule specifics verified in Phase 2 (see RULES_ENGINE.md).

### 4.3 Inventory & equipment
- P0 Weapons, armor, equipment, enhanced items, consumables, ammunition, credits, slots, equipped state, search/filter/sort, quantities. Equipping updates stats via the domain layer.

### 4.4 Dice
- P0 d4/d6/d8/d10/d12/d20/d100, multi-dice, modifiers, advantage/disadvantage, attack/damage/skill/save rolls launched from the sheet, history. CSPRNG-backed RNG behind an interface.

### 4.5 Campaigns
- P0 Create campaign (name, description, setting, notes, house rules, party info, sessions, status).
- P0 Workspace: overview, player roster, character roster, session notes, encounters, NPCs, creatures, shared info, private GM info.
- P0 Link characters to campaigns by reference (no duplication); unlinking preserves the character.
- P0 Sessions: date, summary, objectives, notes, important events.
- P0 Permission *model* (GM, Player, owner, member) defined and enforced in the local application layer; remote enforcement in Phase 6.

### 4.6 GM tools
- P0 Encounters (creatures + NPCs, templates), initiative, turn order, HP, conditions, participant management.
- P0 NPC/creature records and campaign-specific NPCs.
- P0 Visibility per note/info: `gm_only` vs `shared`. Private data never leaves GM context.

### 4.7 Compendium
- P0 Data-driven browser/search over installed content packs. Pack contents depend on licensing outcome (DATA_SOURCES.md). The app must be fully functional with user-supplied/original content.

### 4.8 Data
- P0 Works offline without account. Export/import in a documented portable format (`sw5e-companion-export` v1). Backup/restore.

### 4.9 Later
- P1 Cloud (Supabase auth, sync, invitations, roles, realtime) — Phase 6.
- P2 Starships/vehicles (Phase 7), homebrew authoring & content packs, expanded options.

## 5. Non-functional requirements
- Cold start to usable < 2.5 s on mid-range device (target, to be measured).
- Sheet interactions < 100 ms perceived.
- No data loss on crash/kill: all writes transactional.
- Accessibility: dynamic type, screen-reader labels, contrast ≥ WCAG AA, touch targets ≥ 44pt.
- Offline for everything in P0.
- Deterministic rules across platforms.

## 6. Navigation & UX
See ARCHITECTURE.md §8 (screen map). Tabs: Home, Characters, Campaigns, Compendium, Settings. Contextual navigation in character and campaign detail. Clear loading/error/empty states; destructive actions confirmed.

## 7. Visual identity
Original brand. Dark navy/charcoal surfaces, subtle metallic edges, restrained cyan (primary) and amber (warnings/highlights). Original icons and typography (open-licensed fonts only). No third-party franchise art.

## 8. Out of scope for initial release
Cloud sync, starships, vehicles, homebrew authoring UI, Turkish or other localizations, VTT/map features.

## 9. Success criteria (initial release)
A new user can, offline: create a character, play a session with it (HP, powers, rolls), create a campaign, link the character, and as GM run an encounter with initiative — then restart the app and find all data intact, and export it.

## 10. Open product questions
1. Final app name/bundle ID (trademark risk with "SW5e"/"Star Wars" in store listings) — see DATA_SOURCES.md §7.
2. Content strategy: user-imported content packs vs. bundled content after permission.
3. Monetization (none assumed).
