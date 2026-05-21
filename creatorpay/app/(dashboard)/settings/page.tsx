import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
    {
      icon: User,
      title: 'Profile',
      description: 'Update your name, business info, and creative category',
      href: '/settings/profile',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      icon: Building2,
      title: 'Bank Account',
      description: 'Manage your withdrawal bank account',
      href: '/settings/bank',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Palette,
      title: 'Invoice Branding',
      description: 'Customize your invoice look and feel',
      href: '/settings/invoice',
      color: 'text-pink-600',
      bg: 'bg-pink-50',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Control which alerts you receive',
      href: '/settings/notifications',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account preferences and configuration</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {settingCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
                <CardContent className="flex items-start gap-4 py-5">
                  <div className={`p-2.5 rounded-lg ${card.bg} flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{card.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-violet-600 transition-colors flex-shrink-0 mt-0.5" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Profile Summary</h2>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <dt className="text-sm text-gray-500">Full name</dt>
              <dd className="text-sm font-medium text-gray-900">{profile?.full_name || '—'}</dd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-sm font-medium text-gray-900">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <dt className="text-sm text-gray-500">Business name</dt>
              <dd className="text-sm font-medium text-gray-900">{profile?.business_name || '—'}</dd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <dt className="text-sm text-gray-500">Creative category</dt>
              <dd className="text-sm font-medium text-gray-900">
                {profile?.creative_category ? categories[profile.creative_category] || profile.creative_category : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <dt className="text-sm text-gray-500">Phone</dt>
              <dd className="text-sm font-medium text-gray-900">{profile?.phone || '—'}</dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-sm text-gray-500">Bank account</dt>
              <dd className="text-sm font-medium text-gray-900">
                {profile?.bank_name ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {profile.bank_name}
                    {profile.bank_account_number
                      ? ` ···${profile.bank_account_number.slice(-4)}`
                      : ''}
                  </span>
                ) : (
                  <span className="text-gray-400">Not set</span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
