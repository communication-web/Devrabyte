import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { full_name, email, password } = await request.json()

  if (!full_name || !email || !password) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
  if (authError) {
    return Response.json({ error: authError.message }, { status: 400 })
  }

  const userId = authData.user?.id
  if (!userId) {
    return Response.json({ error: 'Failed to create user' }, { status: 500 })
  }

  // Use admin client to bypass RLS — user has no session cookie yet at signup time
  const admin = createAdminClient()
  const { error: insertError } = await admin.from('cp_users').insert({
    id: userId,
    email,
    full_name,
  })

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
