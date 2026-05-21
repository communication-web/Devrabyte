import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { full_name?: string; business_name?: string; creative_category?: string; phone?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, string | undefined> = {}
  if (body.full_name !== undefined) updates.full_name = body.full_name
  if (body.business_name !== undefined) updates.business_name = body.business_name
  if (body.creative_category !== undefined) updates.creative_category = body.creative_category
  if (body.phone !== undefined) updates.phone = body.phone

  const { error } = await supabase
    .from('cp_users')
    .update(updates)
    .eq('id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
