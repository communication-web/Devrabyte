import { NextRequest, NextResponse } from 'next/server'
import { runPipeline } from '@/lib/scraper/pipeline'

// Vercel Cron: fires Mon–Fri at 05:00 UTC (06:00 WAT)
// Vercel automatically sets Authorization: Bearer <CRON_SECRET>
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runPipeline(['google_maps', 'instagram', 'leads_db'])
    console.log('[cron] daily-scrape complete', result)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[cron] daily-scrape failed', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
