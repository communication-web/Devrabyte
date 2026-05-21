'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  ArrowDownToLine,
  ShieldAlert,
  ArrowLeft,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { label: 'Overview',    href: '/admin',             icon: LayoutDashboard, exact: true },
  { label: 'Users',       href: '/admin/users',        icon: Users },
  { label: 'Invoices',    href: '/admin/invoices',     icon: FileText },
  { label: 'Withdrawals', href: '/admin/withdrawals',  icon: ArrowDownToLine },
  { label: 'Disputes',    href: '/admin/disputes',     icon: ShieldAlert },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#0c0c14] flex flex-col border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-violet-900/50">
          <Wallet className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <span className="text-white font-bold text-[15px] tracking-tight font-display block leading-none">CreatorPay</span>
          <span className="text-[9px] font-bold text-violet-400 uppercase tracking-[0.14em]">Admin</span>
        </div>
      </div>

      {/* Back to app */}
      <div className="px-3 pb-2">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300 transition-all duration-150"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
          Back to app
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-5 mb-2 border-t border-white/[0.05]" />

      {/* Main nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
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
    </aside>
  )
}
