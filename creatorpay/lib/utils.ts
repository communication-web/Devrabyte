import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function generateReference(prefix = 'CPY'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export const PLATFORM_FEE_RATE = 0.015 // 1.5%
export const ADVANCE_FEE_RATE = 0.025 // 2.5%

export function calculateFees(subtotal: number) {
  const platform_fee = subtotal * PLATFORM_FEE_RATE
  const total = subtotal + platform_fee
  return { platform_fee, total }
}

export function toKobo(amount: number): number {
  return Math.round(amount * 100)
}

export function fromKobo(kobo: number): number {
  return kobo / 100
}
