# Expo Port Plan

The `master` branch is the product and behavior reference. This is a cross-platform React Native + Expo port, not an OKOK-only prototype.

## Current status

| Area | Status |
|---|---|
| Expo Router + TypeScript foundation | Started |
| Local SQLite schema for users, measurements and metric values | Initial pass |
| Overview, manual entry, history, charts, insights, profile | Initial pass; not yet at master parity |
| Main tabs and form copy in Traditional Chinese | Initial translation pass; needs a full language audit |
| iOS keyboard dismissal accessory | Added to measurement and profile forms; device verification pending |
| Bluetooth device discovery screen | Implemented using `react-native-ble-plx`; native build and physical-device test pending |
| Bluetooth scale packet parsing / weight import | Not implemented |
| Verified scale protocol support | None claimed |
| Exact derived calculations and unit parity | Not started |
| Full chart/table/statistics/insights parity | Not started |
| Import/export, backup/restore, goals and reminders | Not started |
| Full localization framework and language settings | Not started |
| Physical iOS/Android verification and automated checks | Not run |

## Next work

1. Inspect each relevant master screen, ViewModel/use case, model, repository, and test.
2. Build a feature inventory and port actual master behavior rather than extending the current approximate UI.
3. Audit all user-facing text for Traditional Chinese, including alerts, accessibility labels, date formats, permission prompts, and empty/error states.
4. Test the iOS keyboard accessory and form layout on a real device.
5. Build a custom Expo development client to verify BLE scanning and permissions on iOS and Android.
6. After discovery works, inspect scale advertisements and GATT data and implement protocol adapters one at a time with tests.

## Bluetooth distinction

The current BLE screen is a **device-discovery scaffold**. It can list discovered BLE devices once the native app is built and permissions are granted. It does not yet decode a scale's advertisement/GATT payload, determine a verified brand protocol, or import weight readings. Expo Go does not include this native BLE module.

## Run locally

```sh
npm install
npx expo start
```

For Bluetooth testing, create and install an appropriate custom development build; a normal Expo Go session is insufficient.

## Licensing

The master source is GPL-3.0. Review the repository license and obligations before copying/adapting source and before distributing builds. This note is not legal advice.
