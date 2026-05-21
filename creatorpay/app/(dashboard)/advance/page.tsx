import { Zap, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AdvancePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Instant Advance</h1>
        <p className="text-gray-400 text-sm mt-0.5">Get paid upfront on your invoices</p>
      </div>

      {/* Coming soon card */}
      <div className="relative bg-white rounded-xl border border-amber-100 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent pointer-events-none" />
        <div className="relative px-6 py-8 text-center">
          <div className="inline-flex p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-5">
            <Zap className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
            Instant advances are currently in closed beta. You can request an advance directly from any sent invoice while we roll this out.
          </p>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
          >
            View your invoices <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">How it works</p>
        <div className="space-y-3">
          {[
            { icon: Zap, title: 'Request on any sent invoice', desc: 'Open any invoice you\'ve sent and tap "Get advance" to apply.', color: 'bg-violet-50 text-violet-600' },
            { icon: Clock, title: 'We review within 24 hours', desc: 'Our team reviews and approves qualifying invoices — usually same day.', color: 'bg-sky-50 text-sky-600' },
            { icon: CheckCircle, title: 'Money hits your account', desc: 'Receive the invoice total minus a 2.5% fee, straight to your linked bank.', color: 'bg-emerald-50 text-emerald-600' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="flex gap-4 bg-white rounded-xl border border-gray-100 p-5">
              <div className={`p-2.5 rounded-xl h-fit shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
