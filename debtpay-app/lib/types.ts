export type Strategy = 'snowball' | 'avalanche';

export type Debt = {
  id: string;
  name: string;
  /** Balance when the debt was first added, used to compute "paid off" progress. */
  originalBalance: number;
  /** Current outstanding balance, updated as the user logs payments. */
  currentBalance: number;
  /** Annual percentage rate, e.g. 24.99 for 24.99%. */
  apr: number;
  minPayment: number;
};

export type Snowflake = {
  id: string;
  amount: number;
  note?: string;
  dateISO: string;
  /** Days the payoff date moved up by, snapshotted when this snowflake was logged. */
  daysSaved: number;
};

export type Settings = {
  strategy: Strategy;
  extraMonthly: number;
  notificationsEnabled: boolean;
  /** Hour of day (0-23, local time) for the daily reminder. */
  reminderHour: number;
};

export type Streak = {
  currentStreak: number;
  longestStreak: number;
  /** Local YYYY-MM-DD date of the last logged activity, or null if none yet. */
  lastActiveDateISO: string | null;
};

export type BadgeId =
  | 'streak-3'
  | 'streak-7'
  | 'streak-30'
  | 'progress-25'
  | 'progress-50'
  | 'progress-75'
  | 'debt-free'
  | 'first-snowflake'
  | 'snowflake-5';

export type Badge = {
  id: BadgeId;
  title: string;
  description: string;
};

export type AnalyticsEvent = {
  name: string;
  dateISO: string;
};
