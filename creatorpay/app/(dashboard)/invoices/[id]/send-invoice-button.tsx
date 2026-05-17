'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSend() {
    setLoading(true)
    const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: 'POST' })
    if (res.ok) {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Button onClick={handleSend} loading={loading}>
      <Send className="h-4 w-4" />
      Send invoice
    </Button>
  )
}
