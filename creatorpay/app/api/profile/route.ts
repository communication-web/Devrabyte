import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase
    .from('cp_users')
    .select('*')
    .eq('id', user.id)
    .single()

  return Response.json({ user: userData })
}
