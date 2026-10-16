# Expo Port Plan

The `master` branch is the product and behavior reference. This branch is a cross-platform React Native + Expo port, not an OKOK-only prototype.

## Initial implementation

| Area | Status |
|---|---|
| Expo Router + TypeScript foundation | Started |
| Local SQLite schema for users, measurements and metric values | Started |
| Overview and manual weight entry | Initial pass |
| Measurement history and delete | Initial pass |
| Weight trend from saved data | Initial pass |
| Comparison insight | Initial pass |
| Profile fields stored locally | Initial pass |
| Exact derived calculations and unit parity | Not started |
| Measurement type configuration and typed values | Not started |
| Full chart/table/statistics/insights parity | Not started |
| Import/export, backup/restore, goals and reminders | Not started |
| Bluetooth manager and protocol adapter registry | Not started |
| Localization, theme parity and platform review | Not started |

## Porting rules

1. Inspect each relevant master screen, ViewModel/use case, model, repository and tests before implementing its Expo counterpart.
2. Port behavior and calculation semantics, not just the visual shell.
3. Record each feature as complete, partial, blocked or intentionally changed.
4. Do not display fabricated measurements or derived metrics when required inputs are missing.
5. Keep UI independent from BLE libraries and protocol packet formats. OKOK is not a prerequisite for porting the general app.
6. Keep measurement data local by default.

## Run locally

```sh
npm install
npx expo start
```

BLE may require a development build/native module and is a separate workstream from the initial UI/domain port.

## Licensing

The master source is GPL-3.0. Review the repository license and obligations before copying/adapting source and before distributing builds. This note is not legal advice.
