import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Debt, Settings, Snowflake, Strategy } from './types';
import {
  DEFAULT_SETTINGS,
  loadDebts,
  loadSettings,
  loadSnowflakes,
  saveDebts,
  saveSettings,
  saveSnowflakes,
} from './storage';
import { daysBetween, simulatePayoff } from './payoff';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

type DebtsContextValue = {
  isLoaded: boolean;
  debts: Debt[];
  snowflakes: Snowflake[];
  settings: Settings;
  addDebt: (input: { name: string; balance: number; apr: number; minPayment: number }) => void;
  updateDebt: (id: string, updates: Partial<Pick<Debt, 'name' | 'apr' | 'minPayment'>>) => void;
  logPayment: (id: string, amount: number) => void;
  deleteDebt: (id: string) => void;
  addSnowflake: (amount: number, note?: string) => void;
  setStrategy: (strategy: Strategy) => void;
  setExtraMonthly: (extraMonthly: number) => void;
};

const DebtsContext = createContext<DebtsContextValue | undefined>(undefined);

export function DebtsProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      const [loadedDebts, loadedSnowflakes, loadedSettings] = await Promise.all([
        loadDebts(),
        loadSnowflakes(),
        loadSettings(),
      ]);
      setDebts(loadedDebts);
      setSnowflakes(loadedSnowflakes);
      setSettings(loadedSettings);
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

  const value = useMemo<DebtsContextValue>(
    () => ({
      isLoaded,
      debts,
      snowflakes,
      settings,
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
      },
      setStrategy: (strategy) => setSettings((prev) => ({ ...prev, strategy })),
      setExtraMonthly: (extraMonthly) => setSettings((prev) => ({ ...prev, extraMonthly })),
    }),
    [isLoaded, debts, snowflakes, settings]
  );

  return <DebtsContext.Provider value={value}>{children}</DebtsContext.Provider>;
}

export function useDebts(): DebtsContextValue {
  const ctx = useContext(DebtsContext);
  if (!ctx) throw new Error('useDebts must be used within a DebtsProvider');
  return ctx;
}
