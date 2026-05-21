import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

export default async function AdminDisputesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email || !isAdminEmail(user.email)) redirect('/dashboard')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.16em]">Admin</p>
        <h1 className="text-base font-semibold text-white mt-0.5 font-display">Disputes</h1>
      </div>

      {/* Placeholder */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] px-6 py-16 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
          <ShieldAlert className="h-6 w-6 text-zinc-600" />
        </div>
        <h2 className="text-sm font-semibold text-zinc-300 mb-2">No disputes yet</h2>
        <p className="text-[12px] text-zinc-600 max-w-sm leading-relaxed">
          Disputes will appear here once the escrow system goes live. Creators and clients
          will be able to raise disputes on held payments, which admins can review and resolve
          from this panel.
        </p>
        <div className="mt-5 px-4 py-2 rounded-lg bg-zinc-800 border border-white/[0.05]">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Coming soon — escrow system</p>
        </div>
      </div>
    </div>
  )
}
