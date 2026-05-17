'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, ADVANCE_FEE_RATE } from '@/lib/utils'
import { Invoice } from '@/types'

export function RequestAdvanceButton({ invoice }: { invoice: Invoice }) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const fee = invoice.total * ADVANCE_FEE_RATE
  const advanceAmount = invoice.total - fee

  async function handleRequest() {
    setLoading(true)
    await fetch('/api/advances/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoice.id }),
    })
    setShowModal(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setShowModal(true)}>
        <Zap className="h-4 w-4" />
        Get advance
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <Zap className="h-5 w-5 text-yellow-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Request Pay Advance</h2>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Get paid now instead of waiting. A 2.5% advance fee applies.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice total</span>
                <span className="font-medium">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Advance fee (2.5%)</span>
                <span className="text-red-500">−{formatCurrency(fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>You&apos;ll receive</span>
                <span className="text-green-600">{formatCurrency(advanceAmount)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-6">
              We&apos;ll review your request and contact you within 24 hours. The brand will be required to repay the full invoice amount within 30 days.
            </p>

            <div className="flex gap-3">
              <Button onClick={handleRequest} loading={loading} className="flex-1">
                Request advance
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
