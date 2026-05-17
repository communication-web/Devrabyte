'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, ChevronRight } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wallet className="h-7 w-7 text-violet-600" />
          <span className="text-2xl font-bold text-gray-900">CreatorPay</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    s <= step ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {s < 2 && <div className={`flex-1 h-px w-8 ${step > s ? 'bg-violet-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">About your business</h1>
              <p className="text-gray-500 text-sm mb-6">Tell us about what you do</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Bank account details</h1>
              <p className="text-gray-500 text-sm mb-6">Where should we send your payments?</p>
            </>
          )}

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
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {step === 1 ? (
                <span className="flex items-center gap-2">Continue <ChevronRight className="h-4 w-4" /></span>
              ) : (
                'Complete setup'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
