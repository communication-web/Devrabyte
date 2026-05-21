import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Account</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your withdrawal bank account details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Current Bank Account</h2>
          </div>
        </CardHeader>
        <CardContent>
          {hasBankAccount ? (
            <dl className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <dt className="text-sm text-gray-500">Bank</dt>
                <dd className="text-sm font-medium text-gray-900">{profile?.bank_name || '—'}</dd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <dt className="text-sm text-gray-500">Account number</dt>
                <dd className="text-sm font-medium text-gray-900 font-mono tracking-wider">
                  {profile?.bank_account_number
                    ? `•••• •••• ${profile.bank_account_number.slice(-4)}`
                    : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-sm text-gray-500">Account name</dt>
                <dd className="text-sm font-medium text-gray-900">{profile?.bank_account_name || '—'}</dd>
              </div>
            </dl>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No bank account linked yet.</p>
              <p className="text-xs text-gray-400 mt-1">Complete onboarding to add your bank account.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-5">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 text-sm">Want to change your bank account?</h3>
              <p className="text-sm text-amber-800 mt-1">
                To change your bank account, contact our support team. We verify all bank account changes
                manually to protect your funds.
              </p>
              <a
                href="mailto:support@creatorpay.ng"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-amber-900 hover:text-amber-700 underline underline-offset-2"
              >
                <Mail className="h-4 w-4" />
                support@creatorpay.ng
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold text-gray-900">Why manual verification?</h2>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              {
                title: 'Prevent unauthorized changes',
                detail:
                  'Manual review ensures no one can redirect your payouts without your explicit consent and identity confirmation.',
              },
              {
                title: 'Protect against account takeovers',
                detail:
                  'Even if someone gains access to your account, they cannot change bank details without passing our verification process.',
              },
              {
                title: 'Comply with financial regulations',
                detail:
                  'Nigerian financial regulations require us to verify the identity of payout recipients before processing transfers.',
              },
              {
                title: 'Fast turnaround',
                detail:
                  'Our team processes bank change requests within 1-2 business days. You will receive an email confirmation when done.',
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
