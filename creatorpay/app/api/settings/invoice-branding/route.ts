import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { invoice_brand_color?: string; invoice_default_notes?: string; invoice_default_terms?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, string | undefined> = {}
  if (body.invoice_brand_color !== undefined) updates.invoice_brand_color = body.invoice_brand_color
  if (body.invoice_default_notes !== undefined) updates.invoice_default_notes = body.invoice_default_notes
  if (body.invoice_default_terms !== undefined) updates.invoice_default_terms = body.invoice_default_terms
  // invoice_logo_url is managed by /api/settings/invoice-logo

  const { error } = await supabase
    .from('cp_users')
    .update(updates)
    .eq('id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
