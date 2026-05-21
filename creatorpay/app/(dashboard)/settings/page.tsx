import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Building2, Palette, Bell, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('cp_users')
    .select('*')
    .eq('id', user.id)
    .single()

  const categories: Record<string, string> = {
    photographer: 'Photographer',
    designer: 'Brand Designer',
    content_creator: 'Content Creator',
    videographer: 'Videographer',
    other: 'Other',
    illustrator: 'Illustrator',
    copywriter: 'Copywriter',
    social_media_manager: 'Social Media Manager',
    musician: 'Musician',
  }

  const settingCards = [
    { icon: User, title: 'Profile', description: 'Update your name, business info, and creative category', href: '/settings/profile', iconCls: 'text-violet-400', bg: 'bg-violet-500/10' },
    { icon: Building2, title: 'Bank Account', description: 'Manage your withdrawal bank account', href: '/settings/bank', iconCls: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Palette, title: 'Invoice Branding', description: 'Customize your invoice look and feel', href: '/settings/invoice', iconCls: 'text-pink-400', bg: 'bg-pink-500/10' },
    { icon: Bell, title: 'Notifications', description: 'Control which alerts you receive', href: '/settings/notifications', iconCls: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  const profileRows = [
    { label: 'Full name', value: profile?.full_name || '—' },
    { label: 'Email', value: user.email || '—' },
    { label: 'Business name', value: profile?.business_name || '—' },
    { label: 'Creative category', value: profile?.creative_category ? (categories[profile.creative_category] || profile.creative_category) : '—' },
    { label: 'Phone', value: profile?.phone || '—' },
    {
      label: 'Bank account',
      value: profile?.bank_name ? (
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          {profile.bank_name}{profile.bank_account_number ? ` ···${profile.bank_account_number.slice(-4)}` : ''}
        </span>
      ) : <span className="text-zinc-500">Not set</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Manage your account preferences and configuration</p>
      </div>

      {/* Setting links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {settingCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href} className="group bg-zinc-900 rounded-xl border border-white/[0.07] p-5 flex items-start gap-4 hover:border-violet-500/30 hover:bg-zinc-800/80 transition-all">
              <div className={`p-2.5 rounded-xl ${card.bg} shrink-0`}>
                <Icon className={`h-5 w-5 ${card.iconCls}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">{card.title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{card.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-violet-400 transition-colors shrink-0 mt-0.5" />
            </Link>
          )
        })}
      </div>

      {/* Profile summary */}
      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-sm font-semibold text-white">Profile Summary</h2>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {profileRows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-zinc-400">{label}</span>
              <span className="text-sm font-medium text-zinc-100">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
