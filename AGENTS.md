# AGENTS.md

## Project Goal

Rebuild the openScale app as a cross-platform React Native + Expo application, using this repository's `master` branch as the product reference. Recreate and adapt its UI, user workflows, domain logic, calculations, settings, and data-management features for iOS and Android. This is a port/reimplementation project, not an OKOK-only prototype.

The goal is functional and visual feature parity where practical, while adapting Android-specific patterns to idiomatic React Native/Expo. Do not narrow the product to the user's current scale. Support a growing set of Bluetooth scale protocols through a modular architecture.

## Source of Truth and Porting Approach

- Treat `master` as the reference for existing behavior, screen content, settings, measurements, calculations, and workflows.
- Before implementing a feature, inspect the corresponding master-branch screen, ViewModel/use case, model, repository, and tests where available.
- Maintain a feature inventory mapping each reference feature to its Expo implementation and verification status.
- Recreate the user-facing UI and behavior in TypeScript/React Native; do not mechanically translate Kotlin/Jetpack Compose syntax.
- Preserve the intent, validation rules, measurement semantics, defaults, and edge cases of the original unless a platform difference requires a documented adaptation.
- Do not start by validating or prioritizing OKOK. Build the product foundations and port the general app first; Bluetooth protocols are a separate workstream and should be added in a scalable way.
- Never claim a feature is ported until it has been implemented and verified.

## Core Principles

- **Feature parity:** Use the reference app as the baseline; do not omit major screens or workflows without recording the reason and status.
- **Protocol-agnostic:** Keep Bluetooth transport, protocol adapters, measurement models, storage, domain logic, and UI separate.
- **Extensible:** New scale support should generally be added through isolated protocol adapters rather than brand-specific screen logic.
- **Cross-platform:** Target iOS and Android with Expo where possible. Document features requiring a development build or native module.
- **Privacy first:** Keep data local by default. Do not add analytics, accounts, cloud sync, or external data transmission without an explicit product decision.
- **Maintainable and testable:** Use typed domain models, small modules, reusable components, and tests for calculations, parsing, persistence, and critical workflows.
- **License awareness:** The reference repository is GPL-3.0. Before copying or adapting its source code, review the license and ensure distribution plans comply. UI/behavior reimplementation and direct code reuse must not be treated as the same licensing question.

## Reference Features to Inventory and Port

Inspect `master` and track implementation status for at least the following areas:

1. **Overview and measurements**
   - Measurement overview/list, measurement detail, adding/editing/deleting measurements, comments, dates, units, and measurement-value handling.
   - Configurable measurement types and display of the metrics a user cares about.
   - Goal indicators, evaluation feedback, and differences from previous measurements where supported by the reference.
2. **Charts and analysis**
   - Measurement charts, chart filters/layers/settings, selectable time periods, trends, statistics, comparisons, and insights.
   - Match calculation and aggregation semantics rather than approximating the outputs.
3. **Users and profiles**
   - Multiple users, profile editing, relevant personal attributes, goals, and user-specific measurements.
   - Assisted weighing for babies/pets and support workflows for amputations where present in the reference.
4. **Bluetooth and scale support**
   - Device discovery and management, connection status, scale selection, user interaction flows, diagnostics, and protocol capability handling.
   - Support broadcast-based and GATT-connected scales where technically possible; do not assume all scales share one transport.
   - Build a protocol registry and normalized measurement output. Add and verify adapters independently; do not make OKOK the initial project gate.
5. **Data and settings**
   - Import/export (including CSV where supported), backup/restore behavior, data management, general settings, units, theme, language/localization, chart settings, measurement-type settings, and about/license information.
   - Review reminder, sync, and background behaviors in the reference and decide how each can be implemented safely and appropriately on iOS/Android.
6. **Usability and platform adaptation**
   - Navigation, dialogs, pickers, confirmation flows, empty/loading/error states, accessibility, dark/light themes, and responsive layouts.
   - Recreate the intent of Android widgets only if an equivalent cross-platform feature is practical; document differences.

## Architecture Expectations

- Use Expo + TypeScript.
- Separate at minimum:
  - app navigation and screens;
  - reusable UI components and theme tokens;
  - domain models and measurement types;
  - calculation/evaluation/trend logic;
  - persistence and repositories;
  - import/export and backup logic;
  - Bluetooth manager and protocol adapters;
  - localization and settings.
- Keep screens independent from Bluetooth library APIs and protocol-specific packet formats.
- Keep protocol adapters isolated and register them centrally. Unknown devices must be handled gracefully.
- Normalize measurements with typed units, timestamps, source/device metadata, and explicit availability/provenance for each metric.
- Distinguish values reported by the scale from values derived by formulas. Do not fabricate unavailable measurements.
- Avoid assumptions about device names, manufacturer IDs, packet lengths, units, permissions, or metric availability.
- Choose Expo-compatible dependencies where possible. When native capabilities are needed, document the reason, platform differences, and development-build setup.

## Workflow for Every Ported Feature

1. Inspect the relevant implementation in `master` and identify its UI, domain logic, data model, persistence, settings, and tests.
2. Record expected behavior and edge cases in the feature inventory.
3. Implement the TypeScript domain logic separately from the screen wherever possible.
4. Recreate the UI and interaction flow using reusable React Native components.
5. Add tests for calculations, conversion rules, validation, and critical state transitions.
6. Compare the result against the reference behavior and screenshots where available.
7. Update the inventory and documentation with completed, partial, blocked, or intentionally changed behavior.

Do not port only the visual shell while leaving controls nonfunctional. Likewise, do not implement calculations with placeholder values simply to make a screen look complete.

## Quality and Acceptance Criteria

- The app launches on physical iOS and Android devices using the documented workflow.
- Major reference screens and navigation flows are inventoried; every omission or platform-specific change is documented.
- Unit conversions, derived metrics, trends, evaluations, and aggregation rules have tests against known examples or reference behavior.
- Measurement data persists locally and survives app restarts.
- Import/export validates input and handles malformed files without data loss.
- Bluetooth failures, denied permissions, disconnects, malformed packets, and unsupported devices have clear recovery states.
- No sensitive measurement data is transmitted externally by default.
- No feature is described as supported until it has been implemented and verified.

## Initial Milestones

- [ ] M1: Inspect master and create a reference feature inventory, including screen paths and linked domain logic.
- [ ] M2: Set up the Expo + TypeScript app, navigation, theme, localization foundation, and local persistence.
- [ ] M3: Port the core data model, measurement types, overview, measurement detail, and add/edit flows.
- [ ] M4: Port charts, trends, statistics, comparisons, insights, and their calculation logic.
- [ ] M5: Port users, goals, settings, data management, import/export, and other reference workflows.
- [ ] M6: Implement the cross-platform Bluetooth foundation and extensible protocol adapter registry.
- [ ] M7: Port and verify scale protocols in a planned order, with tests and documented device coverage.
- [ ] M8: Run parity checks on iOS and Android, close gaps, and document known differences and release requirements.
