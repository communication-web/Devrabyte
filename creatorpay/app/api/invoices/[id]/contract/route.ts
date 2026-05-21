import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { ContractPDF } from '@/components/contract-pdf'
import { formatDate } from '@/lib/utils'
import React, { type JSX } from 'react'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: invoice, error } = await supabase
    .from('cp_invoices')
    .select('*, cp_clients(name, email, company), cp_users(business_name, full_name)')
    .eq('id', id)
    .single()

  if (error || !invoice) {
    return Response.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const client = (Array.isArray(invoice.cp_clients) ? invoice.cp_clients[0] : invoice.cp_clients) as { name?: string; email?: string; company?: string } | null
  const creator = (Array.isArray(invoice.cp_users) ? invoice.cp_users[0] : invoice.cp_users) as { business_name?: string; full_name?: string } | null

  const creatorName = creator?.business_name || creator?.full_name || 'Creator'
  const clientName = client?.name || 'Client'
  const clientEmail = client?.email || ''

  const generatedDate = new Date().toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const element = React.createElement(ContractPDF, {
    invoiceNumber: invoice.invoice_number,
    creatorName,
    clientName,
    clientEmail,
    lineItems: invoice.line_items || [],
    total: invoice.total || 0,
    advancePercentage: invoice.advance_percentage ?? 70,
    dueDate: formatDate(invoice.due_date),
    currency: invoice.currency || 'NGN',
    generatedDate,
  }) as JSX.Element as React.ReactElement<DocumentProps>

  const pdfBuffer = await renderToBuffer(element)

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contract-${invoice.invoice_number}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
