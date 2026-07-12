import { Streak } from './types';

export const DEFAULT_STREAK: Streak = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDateISO: null,
};

/** Local (device timezone) calendar date as YYYY-MM-DD — deliberately not UTC, so a
 * streak breaks according to the day the user actually experiences, not UTC's day. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysBetweenLocalDates(a: string, b: string): number {
  // Both are YYYY-MM-DD local date keys; parse as local midnight so DST shifts
  // within a single day don't register as a day boundary.
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / msPerDay);
}

/**
 * Records a day of activity (logging a payment or snowflake). Calling this more than
 * once on the same local day is a no-op for streak length — only the first action of
 * the day advances it. Skipping a day resets the current streak to 1 (today counts).
 */
export function recordActivity(streak: Streak, now: Date = new Date()): Streak {
  const today = localDateKey(now);

  if (streak.lastActiveDateISO === today) {
    return streak; // already logged today, no change
  }

  const gap = streak.lastActiveDateISO
    ? daysBetweenLocalDates(today, streak.lastActiveDateISO)
    : null;

  const currentStreak = gap === 1 ? streak.currentStreak + 1 : 1;

  return {
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    lastActiveDateISO: today,
  };
}

/** Whether the streak has already lapsed as of `now`, without recording new activity — used to show "streak at risk" state. */
export function isStreakActiveToday(streak: Streak, now: Date = new Date()): boolean {
  return streak.lastActiveDateISO === localDateKey(now);
}
