import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  if (!allowed.includes(file.type)) {
    return Response.json({ error: 'File must be JPEG, PNG, WebP, or SVG' }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return Response.json({ error: 'File must be under 2 MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'png'
  const path = `${user.id}/logo.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('invoice-logos')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('invoice-logos')
    .getPublicUrl(path)

  // Bust cache by appending timestamp
  const urlWithBust = `${publicUrl}?t=${Date.now()}`

  const { error: dbError } = await supabase
    .from('cp_users')
    .update({ invoice_logo_url: urlWithBust })
    .eq('id', user.id)

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

  return Response.json({ url: urlWithBust })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Try common extensions
  for (const ext of ['png', 'jpg', 'jpeg', 'webp', 'svg']) {
    await supabase.storage.from('invoice-logos').remove([`${user.id}/logo.${ext}`])
  }

  await supabase.from('cp_users').update({ invoice_logo_url: null }).eq('id', user.id)

  return Response.json({ success: true })
}
