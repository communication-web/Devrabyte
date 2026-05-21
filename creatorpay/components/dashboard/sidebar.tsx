'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  ArrowDownToLine,
  Zap,
  LogOut,
  Wallet,
  BarChart2,
  Bell,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Advance', href: '/advance', icon: Zap },
  { label: 'Withdrawals', href: '/withdrawals', icon: ArrowDownToLine },
  { label: 'Analytics', href: '/analytics', icon: BarChart2 },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#0c0c14] flex flex-col border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-violet-900/50">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <span className="text-white font-bold text-[15px] tracking-tight font-display">CreatorPay</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150',
                active
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/40'
                  : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200'
              )}
            >
              <Icon
                className={cn(
                  'h-[15px] w-[15px] shrink-0 transition-colors',
                  active ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-300'
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 pt-2 border-t border-white/[0.05] space-y-0.5">
        {(() => {
          const active = pathname === '/settings' || pathname.startsWith('/settings/')
          return (
            <Link
              href="/settings"
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150',
                active
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/40'
                  : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200'
              )}
            >
              <Settings className={cn('h-[15px] w-[15px] shrink-0 transition-colors', active ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-300')} />
              Settings
            </Link>
          )
        })()}
        <button
          onClick={handleSignOut}
          className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200 transition-all duration-150"
        >
          <LogOut className="h-[15px] w-[15px] shrink-0 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
