# iOS 本地建置（Xcode 15.4）

此分支 `ios-xcode15` 專門用於在 Xcode 15.4 上進行 iPhone 原生測試。Android 請繼續使用原本的 `expo` 分支；不要把本分支的 SDK 降級合併回 `expo`。

## 版本策略

- Expo SDK 51 / React Native 0.74.5
- React 18.2.0
- `react-native-ble-plx` 固定為 3.1.2（套件資料列出 Expo SDK 51 相容性）
- 關閉 React Native New Architecture，先降低原生模組相容性變數

## 在 Mac 上準備

先確保工作目錄沒有尚未提交的重要變更，再執行：

```bash
git fetch origin
git switch ios-xcode15
git pull origin ios-xcode15
npm install
npx expo install --fix
npx expo-doctor
npm run typecheck
```

`npm install` 會根據此分支的新 `package.json` 更新 `package-lock.json`。請把更新後的 lockfile 提交到 `ios-xcode15` 分支，這一步完成前不要啟動雲端建置。

## 建置到 iPhone

1. 在 Xcode 的 Settings / Accounts 登入 Apple ID。
2. 產生 iOS 原生專案：

   ```bash
   npx expo prebuild --platform ios --clean
   ```

3. 連接 iPhone，並在 Xcode 確認 Signing & Capabilities 使用自己的 Personal Team。
4. 執行：

   ```bash
   npx expo run:ios --device
   ```

免費 Apple ID 的個人簽名通常需要定期重新簽名／安裝。藍牙功能必須在安裝了原生模組的 iPhone App 中測試；Expo Go 不包含此 BLE 原生模組。

## 注意

這是相容性測試分支，尚未代表編譯或藍牙測試已成功。SDK 51 已較舊，不建議把它當作未來 App Store 發佈基線。若 `expo install --fix` 調整套件版本，請先檢查差異再提交。
