import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.FREEME_SUPABASE_URL  ?? 'https://umuehznvqmokqwnycnty.supabase.co'
const SUPABASE_KEY  = process.env.FREEME_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdWVoem52cW1va3F3bnljbnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDc0NjQsImV4cCI6MjA5MzMyMzQ2NH0.i2DWNDLrOeXenzFIzK_XGULW796_hQ8NBtkHLJ-WfkQ'

export const leadsDb = createClient(SUPABASE_URL, SUPABASE_KEY)
