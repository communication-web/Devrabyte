'use client'

import { useState } from 'react'
import { Share2, Download, MessageCircle, Loader2 } from 'lucide-react'

interface ShareInvoiceButtonProps {
  invoiceId: string
  invoiceNumber: string
  clientName: string
  clientPhone?: string | null
  total: number
  currency: string
  paymentLink: string
}

export function ShareInvoiceButton({
  invoiceId,
  invoiceNumber,
  clientName,
  total,
  currency,
  paymentLink,
}: ShareInvoiceButtonProps) {
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const symbol = currency === 'USD' ? '$' : '₦'
  const formattedTotal = `${symbol}${total.toLocaleString('en-NG')}`

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (!res.ok) throw new Error('Failed to generate PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Could not generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  async function handleWhatsApp() {
    setDownloading(true)
    try {
      // Download PDF first so user has it locally to attach
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const pdfUrl = URL.createObjectURL(blob)

      // Save the PDF locally
      const a = document.createElement('a')
      a.href = pdfUrl
      a.download = `${invoiceNumber}.pdf`
      a.click()
      URL.revokeObjectURL(pdfUrl)

      // Then open WhatsApp with a pre-written message containing the payment link
      const message = `Hi ${clientName},\n\nPlease find your invoice *${invoiceNumber}* for *${formattedTotal}*.\n\nYou can pay securely using the link below:\n${paymentLink}\n\nThe PDF invoice has been sent to you separately.\n\n_Powered by CreatorPay_`

      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(waUrl, '_blank')
    } catch (err) {
      console.error(err)
      alert('Could not generate PDF. Please try again.')
    } finally {
      setDownloading(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] px-3 py-2 rounded-lg transition-all active:scale-95"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-zinc-900 border border-white/[0.1] rounded-xl shadow-xl shadow-black/40 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Share invoice</p>
            </div>

            <div className="p-1.5 space-y-1">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                ) : (
                  <Download className="h-4 w-4 text-zinc-500" />
                )}
                <span className="font-medium">Download PDF</span>
              </button>

              <button
                onClick={handleWhatsApp}
                disabled={downloading}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                )}
                <div className="text-left">
                  <p className="font-medium leading-none">Share on WhatsApp</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Downloads PDF + opens WhatsApp</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
