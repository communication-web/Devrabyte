'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, CheckCircle2 } from 'lucide-react'

interface DeliverButtonProps {
  invoiceId: string
}

export function DeliverButton({ invoiceId }: DeliverButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleDeliver() {
    if (!confirm('Mark this invoice as delivered? Your client will be asked to confirm receipt and pay the remaining balance.')) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/deliver`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to mark as delivered')
        return
      }

      setDone(true)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Marked as delivered
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleDeliver}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 border border-emerald-500 px-3 py-2 rounded-lg transition-colors shadow-sm shadow-emerald-900/30"
      >
        <Truck className="h-3.5 w-3.5" />
        {loading ? 'Updating…' : 'Mark as Delivered'}
      </button>
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
}
