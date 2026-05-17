import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Copy, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge, invoiceStatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Invoice, LineItem } from '@/types'
import { SendInvoiceButton } from './send-invoice-button'
import { RequestAdvanceButton } from './request-advance-button'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!invoice) notFound()

  const inv = invoice as Invoice & { clients: { name: string; email: string; company: string | null; phone: string | null } | null }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/invoices" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{inv.invoice_number}</h1>
            <Badge variant={invoiceStatusBadge(inv.status)}>{inv.status}</Badge>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Created {formatDate(inv.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          {inv.status === 'draft' && <SendInvoiceButton invoiceId={inv.id} />}
          {inv.status === 'sent' && !inv.advance_requested && (
            <RequestAdvanceButton invoice={inv} />
          )}
          {inv.advance_requested && (
            <div className="flex items-center gap-1.5 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
              <Zap className="h-3.5 w-3.5" />
              Advance requested
            </div>
          )}
        </div>
      </div>

      {inv.paystack_payment_link && (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-violet-900 text-sm">Payment link ready</p>
              <p className="text-violet-600 text-xs mt-0.5">Share with your client to collect payment</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(inv.paystack_payment_link!)}
                className="flex items-center gap-1.5 text-sm text-violet-700 hover:text-violet-900 font-medium"
              >
                <Copy className="h-4 w-4" />
                Copy link
              </button>
              <a
                href={inv.paystack_payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-violet-700 hover:text-violet-900 font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Client</h2></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-gray-900">{inv.clients?.name || '—'}</p>
            {inv.clients?.company && <p className="text-gray-500">{inv.clients.company}</p>}
            <p className="text-gray-500">{inv.clients?.email}</p>
            {inv.clients?.phone && <p className="text-gray-500">{inv.clients.phone}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Details</h2></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice #</span>
              <span className="font-medium">{inv.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Due date</span>
              <span className="font-medium">{formatDate(inv.due_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <Badge variant={invoiceStatusBadge(inv.status)}>{inv.status}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-[1fr_80px_120px_120px] gap-4 text-xs font-medium text-gray-400 uppercase">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span className="text-right">Amount</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(inv.line_items as LineItem[]).map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_120px_120px] gap-4 items-center px-6 py-3.5 border-t border-gray-50 text-sm">
              <span className="text-gray-900">{item.description}</span>
              <span className="text-gray-600">{item.quantity}</span>
              <span className="text-gray-600">{formatCurrency(item.unit_price)}</span>
              <span className="text-right font-medium">{formatCurrency(item.quantity * item.unit_price)}</span>
            </div>
          ))}
          <div className="px-6 py-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(inv.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Platform fee (1.5%)</span>
              <span>{formatCurrency(inv.platform_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span>
              <span>{formatCurrency(inv.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link
          href={`/invoice/${inv.invoice_number}`}
          target="_blank"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
        >
          <ExternalLink className="h-4 w-4" />
          View public page
        </Link>
      </div>
    </div>
  )
}
