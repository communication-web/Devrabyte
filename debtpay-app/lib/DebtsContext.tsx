import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BadgeId, Debt, Settings, Snowflake, Strategy, Streak } from './types';
import {
  DEFAULT_SETTINGS,
  appendAnalyticsEvent,
  loadBadges,
  loadDebts,
  loadSettings,
  loadSnowflakes,
  loadStreak,
  saveBadges,
  saveDebts,
  saveSettings,
  saveSnowflakes,
  saveStreak,
} from './storage';
import { daysBetween, simulatePayoff } from './payoff';
import { DEFAULT_STREAK, recordActivity } from './streaks';
import { computeNewlyEarnedBadges } from './badges';
import {
  cancelDailyReminder,
  requestNotificationPermission,
  scheduleDailyReminder,
} from './notifications';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

type DebtsContextValue = {
  isLoaded: boolean;
  debts: Debt[];
  snowflakes: Snowflake[];
  settings: Settings;
  streak: Streak;
  badges: BadgeId[];
  newlyEarnedBadges: BadgeId[];
  clearNewlyEarnedBadges: () => void;
  addDebt: (input: { name: string; balance: number; apr: number; minPayment: number }) => void;
  updateDebt: (id: string, updates: Partial<Pick<Debt, 'name' | 'apr' | 'minPayment'>>) => void;
  logPayment: (id: string, amount: number) => void;
  deleteDebt: (id: string) => void;
  addSnowflake: (amount: number, note?: string) => void;
  setStrategy: (strategy: Strategy) => void;
  setExtraMonthly: (extraMonthly: number) => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
  setReminderHour: (hour: number) => void;
};

const DebtsContext = createContext<DebtsContextValue | undefined>(undefined);

export function DebtsProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [streak, setStreak] = useState<Streak>(DEFAULT_STREAK);
  const [badges, setBadges] = useState<BadgeId[]>([]);
  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<BadgeId[]>([]);
  const badgesRef = useRef<BadgeId[]>([]);
  badgesRef.current = badges;

  useEffect(() => {
    (async () => {
      const [loadedDebts, loadedSnowflakes, loadedSettings, loadedStreak, loadedBadges] =
        await Promise.all([
          loadDebts(),
          loadSnowflakes(),
          loadSettings(),
          loadStreak(),
          loadBadges(),
        ]);
      setDebts(loadedDebts);
      setSnowflakes(loadedSnowflakes);
      setSettings(loadedSettings);
      setStreak(loadedStreak);
      setBadges(loadedBadges);
      setIsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (isLoaded) saveDebts(debts);
  }, [isLoaded, debts]);

  useEffect(() => {
    if (isLoaded) saveSnowflakes(snowflakes);
  }, [isLoaded, snowflakes]);

  useEffect(() => {
    if (isLoaded) saveSettings(settings);
  }, [isLoaded, settings]);

  useEffect(() => {
    if (isLoaded) saveStreak(streak);
  }, [isLoaded, streak]);

  // Re-check every badge whenever the underlying stats change, rather than trying to
  // predict which action could unlock which badge — badges only ever get added, never removed.
  useEffect(() => {
    if (!isLoaded) return;
    const earnedSet = new Set(badgesRef.current);
    const newlyEarned = computeNewlyEarnedBadges({ streak, debts, snowflakes }, earnedSet);
    if (newlyEarned.length > 0) {
      const updated = [...badgesRef.current, ...newlyEarned];
      setBadges(updated);
      saveBadges(updated);
      setNewlyEarnedBadges((prev) => [...prev, ...newlyEarned]);
    }
  }, [isLoaded, streak, debts, snowflakes]);

  const value = useMemo<DebtsContextValue>(
    () => ({
      isLoaded,
      debts,
      snowflakes,
      settings,
      streak,
      badges,
      newlyEarnedBadges,
      clearNewlyEarnedBadges: () => setNewlyEarnedBadges([]),
      addDebt: ({ name, balance, apr, minPayment }) => {
        setDebts((prev) => [
          ...prev,
          {
            id: generateId(),
            name,
            originalBalance: balance,
            currentBalance: balance,
            apr,
            minPayment,
          },
        ]);
        appendAnalyticsEvent('add_debt');
      },
      updateDebt: (id, updates) => {
        setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
      },
      logPayment: (id, amount) => {
        setDebts((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, currentBalance: Math.max(0, d.currentBalance - amount) } : d
          )
        );
        setStreak((prev) => recordActivity(prev));
        appendAnalyticsEvent('log_payment');
      },
      deleteDebt: (id) => {
        setDebts((prev) => prev.filter((d) => d.id !== id));
      },
      addSnowflake: (amount, note) => {
        const before = simulatePayoff(debts, settings.strategy, settings.extraMonthly);

        // Apply the windfall as a one-time extra payment to the top-priority active debt.
        const active = debts.filter((d) => d.currentBalance > 0.01);
        const target =
          settings.strategy === 'snowball'
            ? [...active].sort((a, b) => a.currentBalance - b.currentBalance)[0]
            : [...active].sort((a, b) => b.apr - a.apr)[0];

        const updatedDebts = target
          ? debts.map((d) =>
              d.id === target.id
                ? { ...d, currentBalance: Math.max(0, d.currentBalance - amount) }
                : d
            )
          : debts;

        const after = simulatePayoff(updatedDebts, settings.strategy, settings.extraMonthly);
        const daysSaved =
          before && after ? daysBetween(before.payoffDate, after.payoffDate) : 0;

        setDebts(updatedDebts);
        setSnowflakes((prev) => [
          { id: generateId(), amount, note, dateISO: new Date().toISOString(), daysSaved },
          ...prev,
        ]);
        setStreak((prev) => recordActivity(prev));
        appendAnalyticsEvent('add_snowflake');
      },
      setStrategy: (strategy) => {
        setSettings((prev) => ({ ...prev, strategy }));
        appendAnalyticsEvent('set_strategy');
      },
      setExtraMonthly: (extraMonthly) => setSettings((prev) => ({ ...prev, extraMonthly })),
      setNotificationsEnabled: async (enabled) => {
        if (!enabled) {
          await cancelDailyReminder();
          setSettings((prev) => ({ ...prev, notificationsEnabled: false }));
          appendAnalyticsEvent('notifications_disabled');
          return true;
        }
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleDailyReminder(settings.reminderHour);
          setSettings((prev) => ({ ...prev, notificationsEnabled: true }));
        }
        appendAnalyticsEvent(granted ? 'notifications_enabled' : 'notifications_denied');
        return granted;
      },
      setReminderHour: (reminderHour) => {
        setSettings((prev) => ({ ...prev, reminderHour }));
        if (settings.notificationsEnabled) scheduleDailyReminder(reminderHour);
      },
    }),
    [isLoaded, debts, snowflakes, settings, streak, badges, newlyEarnedBadges]
  );

  return <DebtsContext.Provider value={value}>{children}</DebtsContext.Provider>;
}

export function useDebts(): DebtsContextValue {
  const ctx = useContext(DebtsContext);
  if (!ctx) throw new Error('useDebts must be used within a DebtsProvider');
  return ctx;
}
