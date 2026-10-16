# AGENTS.md

## Project Goal

Build a cross-platform, ad-free smart-scale companion app using React Native and Expo. The app should be designed to support multiple Bluetooth scale brands and protocols, rather than being hard-coded for one OKOK device.

Use the existing openScale codebase as a protocol and compatibility reference. Before copying or adapting code, review its GPL-3.0 license and document any licensing implications.

## Core Principles

- **Protocol-agnostic app:** Keep Bluetooth transport, protocol detection/parsing, measurement models, storage, and UI separate.
- **Extensible by design:** Add support for a scale through an isolated protocol adapter whenever possible; avoid brand-specific logic in screens.
- **Evidence before claims:** Do not claim a scale or metric is supported until its data path and parsing have been verified on real devices or reliable protocol documentation.
- **Cross-platform:** Target iOS and Android with Expo where possible. Clearly document any feature that requires a custom development build or native module.
- **Privacy first:** Store measurements locally by default. Do not add analytics, accounts, cloud sync, or external data transmission without an explicit product decision.
- **Maintainable and testable:** Prefer small modules, explicit types, reusable code, and tests for protocol parsing.

## Main Work Items

1. **Project foundation**
   - Create and configure the Expo + TypeScript application.
   - Establish a clear source layout, linting, formatting, and basic tests.
   - Confirm the app can run on a physical iPhone and Android device.

2. **Bluetooth foundation**
   - Implement scanning, device discovery, permission handling, connection lifecycle, and useful diagnostics.
   - Support both advertisement/broadcast-based scales and GATT-connected scales where technically possible.
   - Capture raw advertisement data during development to help investigate unknown devices.
   - Check and document iOS/Android differences rather than assuming identical Bluetooth behavior.

3. **Protocol adapter system**
   - Define shared interfaces for protocol detection, parsing, optional connection/setup, and supported capabilities.
   - Build a registry for protocol adapters and a safe fallback for unknown devices.
   - Start with the user's OKOK scale as the first verified adapter.
   - Add other brands only after their protocol behavior has been investigated and tested.

4. **Measurement model**
   - Define a normalized, typed measurement format for weight, impedance, and optional body-composition metrics.
   - Track units, timestamps, data provenance, and which metrics are unavailable.
   - Distinguish values received directly from a scale from values estimated by formulas.
   - Validate units, checksums, stable-weight flags, and edge cases where applicable.

5. **App features**
   - Create device discovery and device-management screens.
   - Show live/stable measurements and clear connection/error states.
   - Add local measurement history, trend charts, user profile settings, and data export.
   - Make unsupported metrics and unknown devices understandable to users.

6. **Validation and release**
   - Add unit tests with captured, anonymized protocol samples and malformed-packet cases.
   - Test on physical iOS and Android devices and record known limitations per adapter.
   - Document setup, supported devices/protocols, privacy behavior, and build/release steps.
   - Review open-source license obligations before distributing the app.

## Implementation Rules

- Keep UI components independent from Bluetooth libraries and protocol-specific packet formats.
- Keep each protocol adapter isolated; do not create a single large file containing all brand-specific logic.
- Avoid hard-coded assumptions about device names, manufacturer IDs, packet lengths, units, or metric availability.
- Do not fabricate measurement values or infer support from a device name alone.
- Handle scan failures, permission denial, disconnects, malformed packets, and unsupported devices gracefully.
- Prefer Expo-compatible dependencies. If a native capability is needed, document why and provide the required development-build instructions.
- Update documentation and tests when changing protocol behavior or measurement semantics.

## Initial Milestones

- [ ] M1: Expo + TypeScript app skeleton runs on a physical iPhone.
- [ ] M2: Bluetooth scanner displays discovered devices and diagnostic advertisement data.
- [ ] M3: Confirm the current OKOK scale's protocol and capture representative packets.
- [ ] M4: Implement and test the first OKOK adapter.
- [ ] M5: Add the normalized measurement model and local history.
- [ ] M6: Establish a repeatable process for researching and adding other scale protocols.
