import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, ArrowLeft, ShieldCheck, AlertCircle, Mail } from 'lucide-react'
import Link from 'next/link'

export default async function BankSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('cp_users')
    .select('bank_name, bank_account_number, bank_account_name')
    .eq('id', user.id)
    .single()

  const hasBankAccount = !!(profile?.bank_name || profile?.bank_account_number)

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-100 transition-all">
          <ArrowLeft className="h-4 w-4 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Account</h1>
          <p className="text-gray-400 text-sm mt-0.5">Your withdrawal bank account details</p>
        </div>
      </div>

      {/* Current account */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
          <Building2 className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900">Current Bank Account</h2>
        </div>
        {hasBankAccount ? (
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Bank', value: profile?.bank_name || '—' },
              { label: 'Account number', value: profile?.bank_account_number ? `•••• •••• ${profile.bank_account_number.slice(-4)}` : '—', mono: true },
              { label: 'Account name', value: profile?.bank_account_name || '—' },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-gray-400">{label}</span>
                <span className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">No bank account linked yet</p>
            <p className="text-xs text-gray-400 mt-1">Complete onboarding to add your bank account</p>
          </div>
        )}
      </div>

      {/* Change warning */}
      <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
        <div className="flex gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Want to change your bank account?</h3>
            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
              To change your bank account, contact our support team. We verify all bank account changes manually to protect your funds.
            </p>
            <a href="mailto:support@creatorpay.ng" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-amber-900 hover:text-amber-700 underline underline-offset-2">
              <Mail className="h-3.5 w-3.5" />
              support@creatorpay.ng
            </a>
          </div>
        </div>
      </div>

      {/* Why manual */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-gray-900">Why manual verification?</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          {[
            { title: 'Prevent unauthorized changes', detail: 'Manual review ensures no one can redirect your payouts without your explicit consent.' },
            { title: 'Protect against account takeovers', detail: 'Even if someone gains access to your account, they cannot change bank details without verification.' },
            { title: 'Comply with financial regulations', detail: 'Nigerian financial regulations require us to verify the identity of payout recipients.' },
            { title: 'Fast turnaround', detail: 'Our team processes bank change requests within 1–2 business days.' },
          ].map(({ title, detail }) => (
            <div key={title} className="flex gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
