import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsEvent, BadgeId, Debt, Settings, Snowflake, Streak } from './types';
import { DEFAULT_STREAK } from './streaks';

const KEYS = {
  debts: '@debtpay/debts',
  snowflakes: '@debtpay/snowflakes',
  settings: '@debtpay/settings',
  streak: '@debtpay/streak',
  badges: '@debtpay/badges',
  analytics: '@debtpay/analytics',
};

const MAX_ANALYTICS_EVENTS = 500;

export const DEFAULT_SETTINGS: Settings = {
  strategy: 'avalanche',
  extraMonthly: 0,
  notificationsEnabled: false,
  reminderHour: 19,
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

export async function loadStreak(): Promise<Streak> {
  const raw = await AsyncStorage.getItem(KEYS.streak);
  return raw ? { ...DEFAULT_STREAK, ...JSON.parse(raw) } : DEFAULT_STREAK;
}

export async function saveStreak(streak: Streak): Promise<void> {
  await AsyncStorage.setItem(KEYS.streak, JSON.stringify(streak));
}

export async function loadBadges(): Promise<BadgeId[]> {
  const raw = await AsyncStorage.getItem(KEYS.badges);
  return raw ? JSON.parse(raw) : [];
}

export async function saveBadges(badges: BadgeId[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.badges, JSON.stringify(badges));
}

export async function loadAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const raw = await AsyncStorage.getItem(KEYS.analytics);
  return raw ? JSON.parse(raw) : [];
}

export async function appendAnalyticsEvent(name: string, now: Date = new Date()): Promise<void> {
  const events = await loadAnalyticsEvents();
  events.push({ name, dateISO: now.toISOString() });
  // Cap local history so this never grows unbounded on a long-lived install.
  const trimmed = events.slice(-MAX_ANALYTICS_EVENTS);
  await AsyncStorage.setItem(KEYS.analytics, JSON.stringify(trimmed));
}
