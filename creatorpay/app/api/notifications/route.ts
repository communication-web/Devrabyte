import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: notifications, error } = await supabase
    .from('cp_notifications')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const list = notifications || []
  const unread_count = list.filter((n) => !n.read).length

  return Response.json({ notifications: list, unread_count })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id, mark_all } = body as { id?: string; mark_all?: boolean }

  if (mark_all) {
    const { error } = await supabase
      .from('cp_notifications')
      .update({ read: true })
      .eq('creator_id', user.id)
      .eq('read', false)

    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else if (id) {
    const { error } = await supabase
      .from('cp_notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('creator_id', user.id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    return Response.json({ error: 'Provide id or mark_all' }, { status: 400 })
  }

  return Response.json({ success: true })
}
