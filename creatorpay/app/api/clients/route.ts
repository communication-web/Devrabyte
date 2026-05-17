import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('creator_id', user.id)
    .order('name')

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ clients })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, phone, company } = await request.json()
  if (!name || !email) return Response.json({ error: 'Name and email are required' }, { status: 400 })

  const { data, error } = await supabase
    .from('clients')
    .insert({ creator_id: user.id, name, email, phone: phone || null, company: company || null })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ client: data }, { status: 201 })
}
