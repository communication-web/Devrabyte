import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invoice, error } = await supabase
    .from('cp_invoices')
    .select('*, cp_clients(*)')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (error || !invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 })

  return Response.json({ invoice })
}
