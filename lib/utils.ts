import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export function randomToken(bytes = 32) {
  // Edge-compatible random token generation
  const arr = new Uint8Array(bytes);
  (globalThis.crypto || require('crypto').webcrypto).getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatRelative(d: Date | string | null | undefined) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = date.getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(mins) < 60) return rtf.format(mins, 'minute');
  const hrs = Math.round(mins / 60);
  if (Math.abs(hrs) < 48) return rtf.format(hrs, 'hour');
  const days = Math.round(hrs / 24);
  return rtf.format(days, 'day');
}

export function assertDefined<T>(v: T | undefined | null, msg = 'value missing'): T {
  if (v === undefined || v === null) throw new Error(msg);
  return v;
}
