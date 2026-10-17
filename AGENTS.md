# AGENTS.md

## Project Goal

Rebuild openScale as a cross-platform React Native + Expo app, using `master` as the product reference. Prioritize faithful UI, workflows, domain logic, calculations, settings, and data-management parity before protocol-specific Bluetooth work.

## Current Priorities

1. Keep every user-facing screen and message in Traditional Chinese (zh-TW) unless the user explicitly requests another language.
2. Fix platform usability issues, especially iOS keyboard dismissal, safe-area behavior, and form scrolling.
3. Port the reference app's existing screens and business logic accurately.
4. Deliver a one-tap weigh-in session that handles permissions, scanning, connection, notifications, timeouts, cancellation and local persistence.
5. Expand the protocol adapter registry using the reference branch's broadcast and GATT handlers; never claim a protocol is hardware-verified until tested on real devices.

## Source of Truth and Porting Approach

- Treat `master` as the reference for screens, settings, measurement semantics, calculations, and workflows.
- Inspect the matching screen, ViewModel/use case, model, repository, and tests before implementing a feature.
- Maintain a feature inventory mapping reference features to Expo files and verification status.
- Port behavior, validation, units, defaults, and edge cases—not only the visual shell.
- Do not prioritize or assume OKOK support. The architecture must allow multiple scale brands and transports.

## Architecture

- Use Expo + TypeScript and keep UI, domain logic, persistence, localization, Bluetooth transport, and protocol parsing separate.
- Keep measurements local by default. Do not add accounts, cloud sync, analytics, or external transmission without an explicit decision.
- Keep protocol adapters isolated behind shared typed interfaces; do not place brand-specific packet parsing in screens.
- Distinguish scale-reported metrics from derived estimates. Never fabricate missing values.
- Use `zh-TW` for user-facing date formatting where a fixed locale is appropriate; keep translation strings centralized as localization expands.
- Prefer Expo-compatible dependencies. If a feature requires native modules or a development build, document that clearly.
- Handle permission denial, Bluetooth-off states, scan failures, disconnects, malformed packets, and unsupported devices gracefully.
- The reference project is GPL-3.0. Review obligations before copying/adapting source and before distributing builds.

## Platform Build Strategy

Keep platform build workflows separate:

- **iOS:** local build on macOS with Xcode and the user's free Apple ID / Personal Team. Do not make EAS iOS builds a requirement. Document the temporary provisioning limit (typically 7 days) and signing setup. Use `npm run ios:device` for local device builds.
- **Android:** use EAS cloud builds for APK distribution. The `preview` profile should produce an installable APK via `eas build --platform android --profile preview`.
- **BLE:** never direct the user to test `react-native-ble-plx` in Expo Go or a simulator. Verify on a physical device using a native build.
- Keep `eas.json`, package scripts, and `EXPO_PORT_PLAN.md` aligned when build workflows change.

## Bluetooth Truthfulness

- A scan result means only that a Bluetooth advertisement/device was discovered.
- Do not describe a scale as supported until its manufacturer data or GATT payload has been parsed and the resulting measurement path verified.
- Support broadcast/advertisement-based and GATT-connected devices where technically possible.
- Document iOS/Android differences and require physical-device verification for Bluetooth behavior.
- Expo Go cannot run arbitrary native BLE modules; use an appropriate custom development build.

## Keyboard and Form Requirements

- Numeric iOS keyboards must provide an obvious dismissal action when the keyboard does not include a Return key.
- Forms should remain usable while the keyboard is open and allow scrolling to obscured controls.
- Prefer accessible labels, explicit validation, and recoverable error messages in Traditional Chinese.

## Porting Workflow

1. Inspect the master implementation and its models, domain rules, storage, and tests.
2. Update the feature inventory before implementation.
3. Implement typed domain logic independently from UI.
4. Recreate UI and interactions using reusable React Native components.
5. Add tests for calculations, conversion, validation, persistence, and critical transitions.
6. Verify on iOS and Android and compare against the reference.
7. Mark features complete, partial, blocked, or intentionally changed. Never claim unverified features are complete.

## Acceptance Criteria

- The app starts using documented instructions on physical iOS and Android devices.
- Main UI and navigation are available in Traditional Chinese.
- iOS numeric forms have a visible keyboard-dismiss control.
- Local measurements persist across restarts.
- Ported calculations match known reference examples and have tests.
- Bluetooth scanning shows permission, radio state, and scan errors clearly.
- BLE discovery is not confused with verified scale-protocol support.
- No sensitive measurement data is sent externally by default.

## Milestones

- [x] Expo + TypeScript foundation and initial local storage.
- [x] Initial Traditional Chinese UI pass for main tabs and measurement form.
- [x] BLE discovery screen and native-module configuration added (not yet verified on device).
- [x] Initial one-tap weigh-in screen, Bluetooth SIG Weight Scale Service GATT adapter, and partial OKOK/Chipsea broadcast parser added (hardware verification pending).
- [ ] Inspect master comprehensively and finish the reference feature inventory.
- [ ] Verify iOS keyboard behavior and run TypeScript/build checks.
- [ ] Port the reference measurement model, calculation rules, charts, statistics, and settings.
- [ ] Port broadcast-only and vendor-specific GATT adapters from the reference implementation, with parser tests.
- [ ] Validate on physical iOS and Android devices and document remaining gaps.
