import Link from 'next/link'
import {
  Wallet,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="bg-white text-gray-900 antialiased">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">CreatorPay</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-full px-4 py-1.5 text-violet-700 text-sm font-medium mb-8">
          <Zap className="h-3.5 w-3.5" />
          Built for African creatives
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
          Invoice. Get paid.
          <br />
          <span className="text-violet-600">Same day.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          CreatorPay helps designers, photographers, and content creators send
          professional invoices and access earnings immediately — no more waiting
          30–60 days.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-violet-700 transition-colors text-base"
          >
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-7 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-base"
          >
            Sign in
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">No credit card required · Free to get started</p>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '2,400+', label: 'Creators paid' },
            { value: '₦890M+', label: 'Invoices processed' },
            { value: '< 1 day', label: 'Average payout time' },
            { value: '98%', label: 'Payment success rate' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to get paid</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Tools built specifically for the realities of creative work in Africa.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: FileText,
              title: 'Professional invoicing',
              desc: 'Create and send branded invoices in seconds. Clients pay directly from a secure payment link — no back-and-forth emails.',
            },
            {
              icon: Zap,
              title: 'Pay advance',
              desc: 'Need cash before the brand pays? Get an advance on approved invoices. We collect from the client; you get the money now.',
            },
            {
              icon: TrendingUp,
              title: 'Instant withdrawals',
              desc: 'Once an invoice is paid, transfer to your Nigerian bank account in minutes — not days.',
            },
            {
              icon: Shield,
              title: 'Fraud protection',
              desc: 'Every payment is verified by Paystack. We screen clients and flag suspicious activity before your money is at risk.',
            },
            {
              icon: Clock,
              title: 'Payment reminders',
              desc: 'Automatic SMS and email follow-ups keep clients accountable without you having to chase.',
            },
            {
              icon: CheckCircle,
              title: 'Client management',
              desc: 'Keep a clean record of every client, invoice, and payment. Know exactly who owes you what at a glance.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-xl border border-gray-100 hover:border-violet-100 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Up and running in minutes</h2>
            <p className="text-gray-500 text-lg">Three steps from sign-up to paid.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Create your account',
                desc: 'Sign up free, complete a quick onboarding, and connect your Nigerian bank account.',
              },
              {
                step: '02',
                title: 'Send an invoice',
                desc: 'Add your client, set the amount and due date, and send a payment link in seconds.',
              },
              {
                step: '03',
                title: 'Get your money',
                desc: 'Client pays via card or transfer. Funds hit your wallet instantly — withdraw anytime.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <div className="text-5xl font-black text-violet-100 mb-4 select-none">{step}</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Loved by creatives across Nigeria</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote:
                'I used to wait 45 days to get paid. Now I get my money the same day the client pays. CreatorPay changed my cash flow completely.',
              name: 'Temi Adeleke',
              role: 'Freelance Photographer, Lagos',
            },
            {
              quote:
                'The pay advance feature is a lifesaver. I can start new projects without worrying about whether my last invoice has cleared.',
              name: 'Chidi Okonkwo',
              role: 'Brand Designer, Abuja',
            },
            {
              quote:
                'My clients finally take me seriously. A proper invoice link looks so much more professional than a WhatsApp message with account details.',
              name: 'Sade Williams',
              role: 'Content Creator, Port Harcourt',
            },
          ].map(({ quote, name, role }) => (
            <div key={name} className="p-6 rounded-xl border border-gray-100 bg-white">
              <p className="text-gray-600 text-sm leading-relaxed mb-5">&ldquo;{quote}&rdquo;</p>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{name}</div>
                <div className="text-gray-400 text-xs mt-0.5">{role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-lg">No monthly fees. You only pay when you get paid.</p>
          </div>
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-4xl font-bold text-gray-900">1.5%</span>
              <span className="text-gray-500 text-sm">platform fee</span>
            </div>
            <p className="text-gray-400 text-sm mb-8">Per invoice paid. Nothing else.</p>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited invoices',
                'Unlimited clients',
                'Instant withdrawals',
                'Payment reminders (SMS + email)',
                'Secure Paystack checkout',
                'Pay advance available (+2.5%)',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-violet-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center bg-violet-600 text-white py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Start getting paid on time</h2>
        <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
          Join thousands of creatives who've taken control of their cash flow.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-violet-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-violet-700 transition-colors"
        >
          Create your free account <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded flex items-center justify-center">
              <Wallet className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">CreatorPay</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Support</a>
          </div>
          <p className="text-sm text-gray-400">© 2025 Devrabyte. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
