import { NextRequest, NextResponse } from 'next/server'
import { runPipeline } from '@/lib/scraper/pipeline'

const SECRET = process.env.SCRAPE_SECRET ?? ''

export const maxDuration = 300 // Netlify/Vercel: allow up to 5 min

export async function POST(req: NextRequest) {
  // Auth check — require secret header or query param
  const headerSecret = req.headers.get('x-scrape-secret')
  const { searchParams } = new URL(req.url)
  const querySecret = searchParams.get('secret')

  if (SECRET && headerSecret !== SECRET && querySecret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const sources: ('google_maps' | 'instagram')[] = body.sources ?? ['google_maps', 'instagram']

  try {
    const result = await runPipeline(sources)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
