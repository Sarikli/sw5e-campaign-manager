# ADR-0001: Toolchain — Expo SDK 58, Expo Router, expo-sqlite

Status: Proposed (pending approval)
Context: Spec requires latest stable Expo compatible with deps. npm `latest` = expo 58.0.23 (RN 0.88.1, React 19.3.0, expo-sqlite ~58.0.15, expo-router ~58.0.30), verified 2026-11-06.
Decision: Use SDK 58 via `npx expo install`; use development builds; verify with `expo-doctor`.
Consequences: Must read SDK 58 docs before coding (APIs not assumed). Node v26 compatibility to be verified. SDK upgrades handled as dedicated tasks.
