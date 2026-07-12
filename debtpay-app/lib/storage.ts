import AsyncStorage from '@react-native-async-storage/async-storage';
import { Debt, Settings, Snowflake } from './types';

const KEYS = {
  debts: '@debtpay/debts',
  snowflakes: '@debtpay/snowflakes',
  settings: '@debtpay/settings',
};

export const DEFAULT_SETTINGS: Settings = {
  strategy: 'avalanche',
  extraMonthly: 0,
};

export async function loadDebts(): Promise<Debt[]> {
  const raw = await AsyncStorage.getItem(KEYS.debts);
  return raw ? JSON.parse(raw) : [];
}

export async function saveDebts(debts: Debt[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.debts, JSON.stringify(debts));
}

export async function loadSnowflakes(): Promise<Snowflake[]> {
  const raw = await AsyncStorage.getItem(KEYS.snowflakes);
  return raw ? JSON.parse(raw) : [];
}

export async function saveSnowflakes(snowflakes: Snowflake[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.snowflakes, JSON.stringify(snowflakes));
}

export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(KEYS.settings);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
}
