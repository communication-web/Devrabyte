/**
 * Netlify Scheduled Function — triggers the FreeMe lead scraper daily.
 *
 * Schedule: 05:00 UTC = 06:00 WAT, Monday–Friday
 *
 * Required env vars (set in Netlify dashboard):
 *   SCRAPE_SECRET          — shared secret to authenticate the trigger call
 *   NEXT_PUBLIC_APP_URL    — e.g. https://your-app.netlify.app
 *   SCRAPE_REPORT_EMAIL    — recipient for the daily summary email
 */

import type { Config } from '@netlify/functions'

export default async function handler(): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const secret = process.env.SCRAPE_SECRET ?? ''

  if (!appUrl) {
    console.error('[daily-scrape] NEXT_PUBLIC_APP_URL is not set')
    return
  }

  console.log('[daily-scrape] Starting daily lead scrape run…')

  try {
    const res = await fetch(`${appUrl}/api/scrape/trigger`, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-scrape-secret': secret,
      },
      body: JSON.stringify({ sources: ['google_maps', 'instagram'] }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`[daily-scrape] Trigger failed (${res.status}): ${text}`)
      return
    }

    const result = await res.json()
    console.log(
      `[daily-scrape] Completed. Inserted: ${result.total_inserted}, ` +
      `Duplicates: ${result.total_duplicates}, ` +
      `Tier1: ${result.tier1_found}, Tier2: ${result.tier2_found}, Tier3: ${result.tier3_found}`
    )
  } catch (err) {
    console.error('[daily-scrape] Fatal error:', err)
  }
}

// 05:00 UTC = 06:00 WAT, Monday–Friday
export const config: Config = {
  schedule: '0 5 * * 1-5',
}
