import Link from 'next/link'
import { Wallet, Zap, Shield, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-violet-950 to-gray-900 flex flex-col">
      <header className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-violet-400" />
          <span className="text-white font-bold text-xl">CreatorPay</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-300 hover:text-white text-sm transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-300 text-sm mb-8">
            <Zap className="h-3.5 w-3.5" />
            Built for African creatives
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Send invoices.
            <br />
            <span className="text-violet-400">Get paid instantly.</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
            Stop waiting 30–60 days for brands to pay. CreatorPay helps designers,
            photographers, and content creators invoice professionally and access
            earnings the same day.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-violet-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-violet-700 transition-colors text-base"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-colors text-base"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
          {[
            { icon: Wallet, title: 'Instant payouts', desc: 'Withdraw earned money to your bank account immediately after payment.' },
            { icon: Zap, title: 'Pay advance', desc: 'Get paid upfront on approved invoices. Brand repays within 30 days.' },
            { icon: Shield, title: 'Secure payments', desc: 'Powered by Paystack. Every transaction is encrypted and verified.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-6 text-left">
              <Icon className="h-6 w-6 text-violet-400 mb-3" />
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-gray-600 text-sm">
        © 2025 CreatorPay. Built for African creatives.
      </footer>
    </div>
  )
}
