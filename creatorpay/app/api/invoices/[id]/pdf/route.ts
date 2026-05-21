import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/invoice-pdf'
import { formatDate } from '@/lib/utils'
import { LineItem } from '@/types'
import React, { type JSX } from 'react'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invoice } = await supabase
    .from('cp_invoices')
    .select('*, cp_clients(*)')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 })
  if (!invoice.paystack_payment_link) {
    return Response.json({ error: 'Invoice must be sent before generating PDF' }, { status: 400 })
  }

  const { data: userData } = await supabase
    .from('cp_users')
    .select('full_name, business_name, invoice_default_notes, invoice_default_terms, invoice_brand_color')
    .eq('id', user.id)
    .single()

  const client = invoice.cp_clients as {
    name: string; email: string; company: string | null
  } | null

  const element = React.createElement(InvoicePDF, {
    invoiceNumber: invoice.invoice_number,
    creatorName: userData?.business_name || userData?.full_name || 'Creator',
    clientName: client?.name || 'Client',
    clientEmail: client?.email || '',
    clientCompany: client?.company,
    lineItems: invoice.line_items as LineItem[],
    subtotal: invoice.subtotal,
    platformFee: invoice.platform_fee,
    total: invoice.total,
    dueDate: formatDate(invoice.due_date),
    currency: invoice.currency || 'NGN',
    paymentLink: invoice.paystack_payment_link,
    notes: userData?.invoice_default_notes || undefined,
    terms: userData?.invoice_default_terms || undefined,
    brandColor: userData?.invoice_brand_color || '#7c3aed',
  }) as JSX.Element as React.ReactElement<DocumentProps>

  const pdfBuffer = await renderToBuffer(element)

  const filename = `${invoice.invoice_number}.pdf`

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.byteLength),
    },
  })
}
