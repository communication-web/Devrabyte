import { Badge, BadgeId, Debt, Snowflake, Streak } from './types';

export const BADGE_CATALOG: Badge[] = [
  { id: 'first-snowflake', title: 'First Snowflake', description: 'Logged your first windfall' },
  { id: 'streak-3', title: '3-Day Streak', description: 'Logged activity 3 days in a row' },
  { id: 'snowflake-5', title: 'Snowflake Collector', description: 'Logged 5 snowflakes' },
  { id: 'streak-7', title: '7-Day Streak', description: 'Logged activity 7 days in a row' },
  { id: 'progress-25', title: 'Quarter Crushed', description: 'Paid off 25% of your total debt' },
  { id: 'progress-50', title: 'Halfway There', description: 'Paid off 50% of your total debt' },
  { id: 'progress-75', title: 'Almost Free', description: 'Paid off 75% of your total debt' },
  { id: 'streak-30', title: '30-Day Streak', description: 'Logged activity 30 days in a row' },
  { id: 'debt-free', title: 'Debt Free', description: 'Paid off every debt you tracked' },
];

type BadgeCheckInput = {
  streak: Streak;
  debts: Debt[];
  snowflakes: Snowflake[];
};

/** Badges are permanent once earned — this only ever adds to `earned`, never removes. */
export function computeNewlyEarnedBadges(
  { streak, debts, snowflakes }: BadgeCheckInput,
  earned: Set<BadgeId>
): BadgeId[] {
  const totalOriginal = debts.reduce((sum, d) => sum + d.originalBalance, 0);
  const totalCurrent = debts.reduce((sum, d) => sum + d.currentBalance, 0);
  const progress = totalOriginal > 0 ? (totalOriginal - totalCurrent) / totalOriginal : 0;

  const candidates: Array<[BadgeId, boolean]> = [
    ['first-snowflake', snowflakes.length >= 1],
    ['snowflake-5', snowflakes.length >= 5],
    ['streak-3', streak.longestStreak >= 3],
    ['streak-7', streak.longestStreak >= 7],
    ['streak-30', streak.longestStreak >= 30],
    ['progress-25', progress >= 0.25],
    ['progress-50', progress >= 0.5],
    ['progress-75', progress >= 0.75],
    ['debt-free', totalOriginal > 0 && totalCurrent <= 0.01],
  ];

  return candidates.filter(([id, met]) => met && !earned.has(id)).map(([id]) => id);
}
