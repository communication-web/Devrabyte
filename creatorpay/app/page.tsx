'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
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
import { Cursor } from '@/components/cursor'

gsap.registerPlugin(ScrollTrigger)

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })

    lenis.on('scroll', ScrollTrigger.update)

    const rafId = gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(rafId)
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      heroTl
        .from('.hero-badge', { opacity: 0, y: 24, duration: 0.9 }, 0.15)
        .from('.hero-title', { opacity: 0, y: 36, duration: 1.1 }, 0.32)
        .from('.hero-desc', { opacity: 0, y: 24, duration: 1 }, 0.52)
        .from('.hero-buttons > *', { opacity: 0, y: 16, duration: 0.8, stagger: 0.12 }, 0.72)
        .from('.hero-note', { opacity: 0, duration: 0.7 }, 0.9)
        .from('.hero-visual', { opacity: 0, y: 60, scale: 0.96, duration: 1.3, ease: 'power2.out' }, 0.55)

      gsap.to('.hero-visual', {
        y: -60,
        ease: 'none',
        scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1.8 },
      })
      gsap.to('.hero-visual-inner', {
        scale: 1.06,
        ease: 'none',
        scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 2 },
      })

      gsap.from('.stat-item', {
        opacity: 0, y: 40, duration: 0.9, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.stats-section', start: 'top 82%' },
      })

      gsap.from('.features-heading > *', {
        opacity: 0, y: 36, duration: 1, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: '.features-heading', start: 'top 80%' },
      })
      gsap.from('.feature-card', {
        opacity: 0, y: 48, duration: 0.85, stagger: { amount: 0.6, from: 'start' }, ease: 'power3.out',
        scrollTrigger: { trigger: '.features-grid', start: 'top 78%' },
      })

      gsap.from('.hiw-heading > *', {
        opacity: 0, y: 36, duration: 1, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: '.hiw-heading', start: 'top 80%' },
      })
      gsap.from('.hiw-step', {
        opacity: 0, y: 50, duration: 0.9, stagger: 0.18, ease: 'power3.out',
        scrollTrigger: { trigger: '.hiw-grid', start: 'top 78%' },
      })

      gsap.from('.testimonial-heading > *', {
        opacity: 0, y: 36, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.testimonial-heading', start: 'top 82%' },
      })
      gsap.from('.testimonial-card', {
        opacity: 0, y: 48, duration: 0.9, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: '.testimonials-grid', start: 'top 78%' },
      })

      gsap.from('.pricing-heading > *', {
        opacity: 0, y: 36, duration: 1, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: '.pricing-heading', start: 'top 82%' },
      })
      gsap.from('.pricing-card', {
        opacity: 0, y: 56, scale: 0.97, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.pricing-card', start: 'top 82%' },
      })

      gsap.from('.cta-content > *', {
        opacity: 0, y: 40, duration: 1, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: '.cta-content', start: 'top 82%' },
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.feature-card, .testimonial-card')
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => gsap.to(card, { y: -6, duration: 0.35, ease: 'power2.out' }))
      card.addEventListener('mouseleave', () => gsap.to(card, { y: 0, duration: 0.45, ease: 'power2.inOut' }))
    })
  }, [])

  return (
    <div ref={containerRef} className="bg-[#09090f] text-white antialiased cursor-none">
      <Cursor />

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-[#09090f]/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm shadow-violet-900/50">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg font-display">CreatorPay</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-500">
            <a href="#features" className="hover:text-white transition-colors duration-300">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors duration-300">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-300">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors duration-300 font-medium">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-500 transition-colors duration-300 shadow-sm shadow-violet-900/40"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-section max-w-6xl mx-auto px-6 pt-20 pb-16 text-center overflow-hidden">
        <div className="hero-badge inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-400 text-sm font-medium mb-8">
          <Zap className="h-3.5 w-3.5" />
          Built for African creatives
        </div>
        <h1 className="hero-title font-display text-5xl md:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
          Invoice. Get paid.
          <br />
          <span className="text-violet-400">Same day.</span>
        </h1>
        <p className="hero-desc text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          CreatorPay helps designers, photographers, and content creators send
          professional invoices and access earnings immediately — no more waiting
          30–60 days.
        </p>
        <div className="hero-buttons flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-violet-500 transition-colors duration-300 text-base shadow-sm shadow-violet-900/40"
          >
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 border border-white/[0.1] text-zinc-300 px-7 py-3.5 rounded-xl font-semibold hover:bg-white/[0.05] transition-colors duration-300 text-base"
          >
            Sign in
          </Link>
        </div>
        <p className="hero-note text-sm text-zinc-600 mt-4">No credit card required · Free to get started</p>

        {/* Hero visual — mock dark dashboard */}
        <div className="hero-visual mt-16 max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.07]">
          <div className="hero-visual-inner bg-zinc-900 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-zinc-200 text-sm">CreatorPay Dashboard</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Available', value: '₦142,500', accent: 'text-emerald-400' },
                { label: 'This month', value: '₦380,000', accent: 'text-white' },
                { label: 'Pending', value: '₦55,000', accent: 'text-amber-400' },
              ].map(({ label, value, accent }) => (
                <div key={label} className="bg-zinc-800/60 rounded-xl p-3.5 border border-white/[0.06]">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">{label}</div>
                  <div className={`font-bold text-base font-mono ${accent}`}>{value}</div>
                </div>
              ))}
            </div>

            <div className="bg-zinc-800/60 rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recent invoices</span>
                <span className="text-xs text-violet-400 font-medium">View all</span>
              </div>
              {[
                { client: 'Konga Nigeria', amount: '₦120,000', status: 'Paid', dot: 'bg-emerald-400', statusColor: 'text-emerald-400' },
                { client: 'Flutterwave', amount: '₦85,000', status: 'Sent', dot: 'bg-amber-400', statusColor: 'text-amber-400' },
                { client: 'GTBank Media', amount: '₦200,000', status: 'Paid', dot: 'bg-emerald-400', statusColor: 'text-emerald-400' },
              ].map(({ client, amount, status, dot, statusColor }) => (
                <div key={client} className="px-4 py-3 flex items-center justify-between border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">{client}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{amount}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold ${statusColor}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section border-y border-white/[0.06] bg-zinc-900/40">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '2,400+', label: 'Creators paid' },
            { value: '₦890M+', label: 'Invoices processed' },
            { value: '< 1 day', label: 'Average payout time' },
            { value: '98%', label: 'Payment success rate' },
          ].map(({ value, label }) => (
            <div key={label} className="stat-item text-center">
              <div className="text-3xl font-bold text-white font-display mb-1">{value}</div>
              <div className="text-sm text-zinc-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="features-heading text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to get paid</h2>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Tools built specifically for the realities of creative work in Africa.
          </p>
        </div>
        <div className="features-grid grid md:grid-cols-3 gap-5">
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
              data-cursor
              className="feature-card p-6 rounded-xl bg-zinc-900 border border-white/[0.07] hover:border-violet-500/30 transition-all duration-500 will-change-transform"
            >
              <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-zinc-900/40 border-y border-white/[0.06] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="hiw-heading text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Up and running in minutes</h2>
            <p className="text-zinc-500 text-lg">Three steps from sign-up to paid.</p>
          </div>
          <div className="hiw-grid grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Create your account', desc: 'Sign up free, complete a quick onboarding, and connect your Nigerian bank account.' },
              { step: '02', title: 'Send an invoice', desc: 'Add your client, set the amount and due date, and send a payment link in seconds.' },
              { step: '03', title: 'Get your money', desc: 'Client pays via card or transfer. Funds hit your wallet instantly — withdraw anytime.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="hiw-step">
                <div className="text-6xl font-black text-violet-500/20 mb-4 select-none leading-none font-display">{step}</div>
                <h3 className="font-semibold text-white mb-2 text-lg">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="testimonial-heading text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Loved by creatives across Nigeria</h2>
        </div>
        <div className="testimonials-grid grid md:grid-cols-3 gap-5">
          {[
            { quote: 'I used to wait 45 days to get paid. Now I get my money the same day the client pays. CreatorPay changed my cash flow completely.', name: 'Temi Adeleke', role: 'Freelance Photographer, Lagos', initials: 'TA' },
            { quote: 'The pay advance feature is a lifesaver. I can start new projects without worrying about whether my last invoice has cleared.', name: 'Chidi Okonkwo', role: 'Brand Designer, Abuja', initials: 'CO' },
            { quote: 'My clients finally take me seriously. A proper invoice link looks so much more professional than a WhatsApp message with account details.', name: 'Sade Williams', role: 'Content Creator, Port Harcourt', initials: 'SW' },
          ].map(({ quote, name, role, initials }) => (
            <div key={name} data-cursor className="testimonial-card p-6 rounded-xl bg-zinc-900 border border-white/[0.07] will-change-transform">
              <p className="text-zinc-400 text-sm leading-relaxed mb-5">&ldquo;{quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="font-semibold text-zinc-100 text-sm">{name}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-zinc-900/40 border-y border-white/[0.06] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="pricing-heading text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-zinc-500 text-lg">No monthly fees. You only pay when you get paid.</p>
          </div>
          <div className="pricing-card max-w-md mx-auto bg-zinc-900 rounded-2xl border border-white/[0.1] p-8">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="font-display text-4xl font-bold text-white">1.5%</span>
              <span className="text-zinc-500 text-sm">platform fee</span>
            </div>
            <p className="text-zinc-600 text-sm mb-8">Per invoice paid. Nothing else.</p>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited invoices',
                'Unlimited clients',
                'Instant withdrawals',
                'Payment reminders (SMS + email)',
                'Secure Paystack checkout',
                'Pay advance available (+2.5%)',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle className="h-4 w-4 text-violet-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center bg-violet-600 text-white py-3 rounded-xl font-semibold hover:bg-violet-500 transition-colors duration-300 shadow-sm shadow-violet-900/40"
            >
              Get started free
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="cta-content inline-flex flex-col items-center gap-6">
          <h2 className="font-display text-4xl md:text-5xl font-black text-white leading-tight">Start getting paid on time</h2>
          <p className="text-zinc-500 text-lg max-w-lg">
            Join thousands of creatives who&apos;ve taken control of their cash flow.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-violet-500 transition-colors duration-300 shadow-sm shadow-violet-900/40"
          >
            Create your free account <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-sm text-zinc-600">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded flex items-center justify-center">
              <Wallet className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-white text-sm font-display">CreatorPay</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-600">
            <a href="#" className="hover:text-zinc-300 transition-colors duration-300">Privacy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors duration-300">Terms</a>
            <a href="#" className="hover:text-zinc-300 transition-colors duration-300">Support</a>
          </div>
          <p className="text-sm text-zinc-600">© 2025 Devrabyte. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
