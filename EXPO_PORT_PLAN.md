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
| Bluetooth SIG Weight Scale Service + initial OKOK/Chipsea broadcast weight import | Implemented in initial pass; requires physical-device verification |
| Verified scale protocol support | Standard GATT and initial OKOK/Chipsea broadcast parsers implemented; not yet verified on physical hardware |
| Exact derived calculations and unit parity | Not started |
| Full chart/table/statistics/insights parity | Not started |
| Import/export, backup/restore, goals and reminders | Not started |
| Full localization framework and language settings | Not started |
| Physical iOS/Android verification and automated checks | Not run |

## Platform build strategy

This repository intentionally uses different build paths for each platform:

- **iOS: build locally on the Mac with Xcode and a free Apple ID.** Connect the iPhone over USB, add the Apple ID in Xcode Settings > Accounts, and select the automatically created Personal Team under the iOS app target's Signing & Capabilities. Then run `npm run ios:device` (equivalent to `npx expo run:ios --device`). This avoids a paid Apple Developer Program membership, but free Personal Team provisioning is temporary (typically 7 days), so the app may need to be re-signed and reinstalled.
- **Android: use EAS Build in the cloud to produce an installable APK.** Install/login to EAS CLI, configure the project once, then run `eas build --platform android --profile preview`. Download the resulting APK from the EAS build page and install it on an Android device. No Google Play upload is required for local sideloading.
- **Do not use Expo Go for BLE tests.** The app uses `react-native-ble-plx`, which requires a native app build. A preview APK includes the native module and is suitable for device testing; it is not the same as Expo Go.

### iOS local build

Requirements: macOS, Xcode and its iOS platform components, Node.js/npm, CocoaPods, a USB-connected iPhone, and an Apple ID added to Xcode.

```sh
git switch expo
git pull origin expo
npm install
npx expo install --fix
npm run ios:device
```

If signing fails, open the generated `ios` project in Xcode, choose the app target, enable **Automatically manage signing**, and select your **Personal Team**. Trust the Mac on the iPhone and enable Developer Mode if iOS asks. Keep the phone connected until the first install succeeds. Local iOS builds require CocoaPods; resolve `pod --version` first if Expo reports that CocoaPods is missing.

### Android EAS APK

Requirements: an Expo/EAS account and EAS CLI. Run from the repository root:

```sh
npm install
npm install --global eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

The `preview` profile in `eas.json` is configured to create an APK for direct installation. The first build may ask to link the project to an EAS project and configure Android signing credentials; follow the prompts. Download the APK from the completed build page and install it on the Android phone. If you only want a development client with Metro live reload, use `eas build --platform android --profile development` instead.

### Local Android APK (optional)

If Android Studio, Android SDK and a compatible JDK are installed locally, the debug APK can be built with:

```sh
npm run android:local-apk
```

Expected output: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Next work

1. Inspect each relevant master screen, ViewModel/use case, model, repository, and test.
2. Build a feature inventory and port actual master behavior rather than extending the current approximate UI.
3. Audit all user-facing text for Traditional Chinese, including alerts, accessibility labels, date formats, permission prompts, and empty/error states.
4. Test the iOS keyboard accessory and form layout on a real device.
5. Build a custom Expo development client to verify BLE scanning and permissions on iOS and Android.
6. After discovery works, inspect scale advertisements and GATT data and implement protocol adapters one at a time with tests.

## Bluetooth distinction

The current BLE screen is a **device-discovery scaffold**. It can list discovered BLE devices once the native app is built and permissions are granted. It does not yet decode a scale's advertisement/GATT payload, determine a verified brand protocol, or import weight readings. Expo Go does not include this native BLE module.

## Licensing

The master source is GPL-3.0. Review the repository license and obligations before copying/adapting source and before distributing builds. This note is not legal advice.
