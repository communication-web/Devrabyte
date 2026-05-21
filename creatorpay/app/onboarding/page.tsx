'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, ChevronRight, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const BANKS = [
  'Access Bank', 'GTBank', 'First Bank', 'UBA', 'Zenith Bank',
  'Kuda Bank', 'Opay', 'PalmPay', 'Moniepoint', 'Stanbic IBTC',
  'Sterling Bank', 'Wema Bank', 'Union Bank', 'Fidelity Bank',
  'FCMB', 'Ecobank', 'Polaris Bank',
]

const CATEGORIES = [
  { value: 'designer', label: 'Designer' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'content_creator', label: 'Content Creator' },
  { value: 'musician', label: 'Musician' },
  { value: 'videographer', label: 'Videographer' },
  { value: 'other', label: 'Other' },
]

const steps = [
  { label: 'Your business', desc: 'Tell us what you do' },
  { label: 'Bank details', desc: 'Where to send your money' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    business_name: '',
    creative_category: '',
    phone: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
  })

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) {
      setStep(2)
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Onboarding failed. Please try again.')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090f] flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm shadow-violet-900/50">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white font-display">CreatorPay</span>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-white/[0.07] overflow-hidden">
          {/* Step header */}
          <div className="px-7 pt-7 pb-6 border-b border-white/[0.05]">
            {/* Stepper */}
            <div className="flex items-center gap-3 mb-6">
              {steps.map((s, i) => {
                const n = i + 1
                const done = n < step
                const active = n === step
                return (
                  <div key={n} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done
                        ? 'bg-violet-600 text-white'
                        : active
                        ? 'bg-violet-600 text-white ring-4 ring-violet-500/20'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {done ? <Check className="h-3.5 w-3.5" /> : n}
                    </div>
                    {n < steps.length && (
                      <div className={`h-px w-10 transition-colors ${n < step ? 'bg-violet-600' : 'bg-zinc-800'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            <h1 className="text-xl font-bold text-white">{steps[step - 1].label}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{steps[step - 1].desc}</p>
          </div>

          {/* Form */}
          <div className="px-7 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <Input
                    label="Business name"
                    placeholder="e.g. Tunde Creative Studio"
                    value={form.business_name}
                    onChange={(e) => update('business_name', e.target.value)}
                    required
                  />
                  <Select
                    label="Creative category"
                    value={form.creative_category}
                    onChange={(e) => update('creative_category', e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                  <Input
                    label="Phone number"
                    type="tel"
                    placeholder="+234 801 234 5678"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    required
                  />
                </>
              ) : (
                <>
                  <Select
                    label="Bank name"
                    value={form.bank_name}
                    onChange={(e) => update('bank_name', e.target.value)}
                    required
                  >
                    <option value="">Select your bank</option>
                    {BANKS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </Select>
                  <Input
                    label="Account number"
                    placeholder="10-digit NUBAN"
                    value={form.bank_account_number}
                    onChange={(e) => update('bank_account_number', e.target.value)}
                    maxLength={10}
                    minLength={10}
                    required
                  />
                  <Input
                    label="Account name"
                    placeholder="As it appears on your bank statement"
                    value={form.bank_account_name}
                    onChange={(e) => update('bank_account_name', e.target.value)}
                    required
                  />
                </>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-lg border border-white/[0.1] bg-zinc-800 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    Back
                  </button>
                )}
                <Button type="submit" className="flex-1" size="lg" loading={loading}>
                  {step === 1 ? (
                    <span className="flex items-center gap-2">Continue <ChevronRight className="h-4 w-4" /></span>
                  ) : (
                    'Complete setup'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
