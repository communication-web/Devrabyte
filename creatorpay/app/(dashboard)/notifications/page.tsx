'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  AlertCircle,
  Zap,
  XCircle,
  CreditCard,
  Bell,
} from 'lucide-react'
import type { Notification, NotificationType } from '@/types'

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

type IconConfig = {
  Icon: React.ElementType
  bgClass: string
  iconClass: string
}

const typeConfig: Record<NotificationType, IconConfig> = {
  invoice_paid: { Icon: CheckCircle2, bgClass: 'bg-emerald-500/10', iconClass: 'text-emerald-400' },
  invoice_overdue: { Icon: AlertCircle, bgClass: 'bg-red-500/10', iconClass: 'text-red-400' },
  advance_approved: { Icon: Zap, bgClass: 'bg-violet-500/10', iconClass: 'text-violet-400' },
  advance_rejected: { Icon: XCircle, bgClass: 'bg-red-500/10', iconClass: 'text-red-400' },
  withdrawal_success: { Icon: CreditCard, bgClass: 'bg-emerald-500/10', iconClass: 'text-emerald-400' },
  withdrawal_failed: { Icon: CreditCard, bgClass: 'bg-red-500/10', iconClass: 'text-red-400' },
  system: { Icon: Bell, bgClass: 'bg-blue-500/10', iconClass: 'text-blue-400' },
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-1',
    creator_id: 'demo',
    type: 'invoice_paid',
    title: 'Invoice paid',
    body: 'Acme Corp paid invoice #INV-0012 of ₦150,000.',
    read: false,
    metadata: {},
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-2',
    creator_id: 'demo',
    type: 'advance_approved',
    title: 'Advance approved',
    body: 'Your advance request of ₦50,000 has been approved and will be disbursed shortly.',
    read: false,
    metadata: {},
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-3',
    creator_id: 'demo',
    type: 'invoice_overdue',
    title: 'Invoice overdue',
    body: 'Invoice #INV-0009 to Bright Media is now 7 days overdue.',
    read: true,
    metadata: {},
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-4',
    creator_id: 'demo',
    type: 'withdrawal_success',
    title: 'Withdrawal successful',
    body: '₦30,000 has been sent to your GTBank account ending in 4521.',
    read: true,
    metadata: {},
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const list: Notification[] = data.notifications ?? []
      if (list.length === 0) {
        setNotifications(DEMO_NOTIFICATIONS)
        setUnreadCount(DEMO_NOTIFICATIONS.filter((n) => !n.read).length)
      } else {
        setNotifications(list)
        setUnreadCount(data.unread_count ?? 0)
      }
    } catch {
      setNotifications(DEMO_NOTIFICATIONS)
      setUnreadCount(DEMO_NOTIFICATIONS.filter((n) => !n.read).length)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      await fetchNotifications()
    } finally {
      setMarkingAll(false)
    }
  }

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {
      fetchNotifications()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-violet-600 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={markingAll}>
            {markingAll ? 'Marking…' : 'Mark all as read'}
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-white/[0.05]">
              {notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} onMarkRead={markRead} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function NotificationRow({
  notification: n,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
}) {
  const cfg = typeConfig[n.type] ?? typeConfig.system
  const { Icon, bgClass, iconClass } = cfg

  return (
    <div
      onClick={() => { if (!n.read) onMarkRead(n.id) }}
      className={[
        'flex items-start gap-4 px-5 py-4 transition-colors',
        n.read
          ? 'hover:bg-white/[0.04]'
          : 'border-l-2 border-violet-500 bg-violet-500/5 hover:bg-violet-500/10 cursor-pointer',
      ].filter(Boolean).join(' ')}
    >
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bgClass}`}>
        <Icon size={18} className={iconClass} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-100 leading-snug">{n.title}</p>
        <p className="mt-0.5 text-sm text-zinc-400 leading-snug">{n.body}</p>
        <p className="mt-1 text-xs text-zinc-600">{timeAgo(n.created_at)}</p>
      </div>
      {!n.read && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10 mb-4">
        <Bell size={28} className="text-violet-400" />
      </div>
      <h3 className="text-base font-semibold text-white">You&apos;re all caught up</h3>
      <p className="mt-1 text-sm text-zinc-500 max-w-xs">
        No notifications yet. We&apos;ll let you know when something important happens.
      </p>
    </div>
  )
}
