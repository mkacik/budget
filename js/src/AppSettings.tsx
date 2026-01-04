import { createContext, useContext } from "react";

import { VersionedSettings } from "./SettingsProvider";

export enum Tab {
  Budget,
  Accounts,
  Expenses,
  Analyze,
}

export interface AppSettings extends VersionedSettings {
  tab: Tab;
  year: number;
  stickyHeaders: boolean;
}

export function getDefaultAppSettings(): AppSettings {
  return {
    version: 3,
    tab: Tab.Budget,
    year: new Date().getFullYear(),
    stickyHeaders: true,
  } as AppSettings;
}

export const AppSettingsContext = createContext<AppSettings | null>(null);

export const useAppSettingsContext = (): AppSettings => {
  const appSettings = useContext(AppSettingsContext);
  if (appSettings === null) {
    throw new Error("AppSettingsContext requested but not provided");
  }
  return appSettings;
};
