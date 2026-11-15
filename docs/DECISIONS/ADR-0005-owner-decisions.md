# ADR-0005 — Owner decisions after Phase 0 review

Status: Accepted by project owner (2026-11-06). Phase 1 NOT yet approved.

| # | Question | Owner decision | Architectural consequence |
|---|----------|----------------|---------------------------|
| 1 | Official SW5e content | Embed official content directly in the app | Overrides ADR-0003 (user-imported packs). Redistribution rights are still unestablished; see "Open risks". Content stays in versioned packs with provenance so it can be removed or swapped without code changes. |
| 2 | App name | "SW5e Campaign Manager" (revised from "SW5e Beyond") | Avoids the D&D Beyond echo. Owner states the project is community open source and all use is permitted; this is the owner's own assessment and was not independently verified. |
| 3 | iOS builds | EAS cloud builds | Requires an Apple Developer account and an Expo account. No local iOS builds. |
| 4 | Rules scope | All PDFs in the workspace (Player's Handbook, Scum and Villainy, Starships of the Galaxy, Wretched Hives, plus the Character, Starship and Deployment sheets) | Data source is the PDFs, so a PDF extraction pipeline is needed. Starship and deployment content is pulled earlier than Phase 7, as data only. The UI remains in Phase 7. |
| 5 | Characters per campaign | One character can join several campaigns | Keep the many-to-many `campaign_characters` table. |

## Open risks

- Embedding official book text, artwork and Star Wars IP in a store-distributed app may be rejected by the stores or draw a takedown. This was not legally reviewed. Mitigation: keep content packs separable, never bundle artwork, and obtain written permission or legal review before release.
- The name "SW5e Beyond" implies affiliation with SW5e and echoes D&D Beyond branding.
- The PDFs are very large (up to about 250 MB). Extraction accuracy needs a verification process, and no rule is treated as verified until it is checked against the source.
