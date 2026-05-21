import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { full_name, email, password } = await request.json()

  if (!full_name || !email || !password) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const supabase = await createClient()

  // Pass full_name as metadata so the DB trigger can create the cp_users row
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  })

  if (authError) {
    return Response.json({ error: authError.message }, { status: 400 })
  }

  return Response.json({ success: true })
}
