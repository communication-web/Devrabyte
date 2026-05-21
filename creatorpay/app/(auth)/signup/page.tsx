'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wallet, CheckCircle, Zap, Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const perks = [
  { icon: Zap, text: 'Same-day payouts to any Nigerian bank' },
  { icon: CheckCircle, text: 'Professional invoices in under a minute' },
  { icon: Shield, text: 'Paystack-secured payments, always' },
]

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) {
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          setError('Check your email for a confirmation link, then sign in.')
        } else {
          setError(signInError.message)
        }
        return
      }

      router.push('/onboarding')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#09090f]">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[46%] bg-[#0c0c14] flex-col justify-between p-12 relative overflow-hidden border-r border-white/[0.06]">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-800/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-900/50">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight font-display">CreatorPay</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-snug mb-3 font-display">
            Built for African<br />creatives.
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
            Send professional invoices and get paid before the brand even thinks about it.
          </p>
          <div className="mt-8 space-y-3.5">
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <span className="text-zinc-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-10 relative z-10">
          {[
            { value: '2,400+', label: 'Creators paid' },
            { value: '₦890M+', label: 'Processed' },
            { value: '< 1 day', label: 'Avg payout' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg font-display">CreatorPay</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-zinc-500 text-sm mb-8">Start getting paid like a professional</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              placeholder="Tunde Adeyemi"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              required
            />
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              minLength={8}
              required
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-zinc-500">
            No credit card required · Free to get started
          </p>

          <p className="mt-4 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 font-medium hover:text-violet-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
