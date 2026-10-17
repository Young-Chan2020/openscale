import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, useColorScheme } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { colorsFor, type Palette } from "@/theme";
import { translate, type AppLanguage, type ThemePreference, type TranslationKey } from "@/i18n/translations";

type Preferences = {
  language: AppLanguage;
  themePreference: ThemePreference;
  resolvedTheme: "light" | "dark";
  colors: Palette;
  setLanguage: (value: AppLanguage) => Promise<void>;
  setThemePreference: (value: ThemePreference) => Promise<void>;
  t: (key: TranslationKey) => string;
};
const Context = createContext<Preferences | null>(null);

function systemLanguage(): AppLanguage {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  if (locale.startsWith("zh")) return /hans|cn|sg|my/.test(locale) ? "zh-Hans" : "zh-Hant";
  return "en";
}

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const systemScheme = useColorScheme();
  const [language, setLanguageState] = useState<AppLanguage>(systemLanguage());
  const [themePreference, setThemeState] = useState<ThemePreference>("system");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const rows = await db.getAllAsync<{ key: string; value: string }>("SELECT key, value FROM app_settings WHERE key IN ('language','theme')");
        if (!alive) return;
        for (const row of rows) {
          if (row.key === "language" && ["zh-Hant", "zh-Hans", "en"].includes(row.value)) setLanguageState(row.value as AppLanguage);
          if (row.key === "theme" && ["system", "light", "dark"].includes(row.value)) setThemeState(row.value as ThemePreference);
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, [db]);

  const setLanguage = useCallback(async (value: AppLanguage) => {
    setLanguageState(value);
    await db.runAsync("INSERT INTO app_settings(key,value) VALUES('language',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", value);
  }, [db]);
  const setThemePreference = useCallback(async (value: ThemePreference) => {
    setThemeState(value);
    await db.runAsync("INSERT INTO app_settings(key,value) VALUES('theme',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", value);
  }, [db]);

  const resolvedTheme = themePreference === "system" ? (systemScheme === "dark" ? "dark" : "light") : themePreference;
  const value = useMemo<Preferences>(() => ({
    language, themePreference, resolvedTheme, colors: colorsFor(resolvedTheme),
    setLanguage, setThemePreference, t: (key) => translate(language, key),
  }), [language, themePreference, resolvedTheme, setLanguage, setThemePreference]);

  useEffect(() => { Appearance.setColorScheme(themePreference === "system" ? null : themePreference); }, [themePreference]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAppPreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("useAppPreferences must be used inside AppPreferencesProvider");
  return value;
}
