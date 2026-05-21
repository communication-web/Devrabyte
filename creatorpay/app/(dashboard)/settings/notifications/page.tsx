'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface NotifSettings {
  notify_invoice_paid: boolean
  notify_invoice_overdue: boolean
  notify_advance_approved: boolean
  notify_withdrawal_complete: boolean
  notify_email: boolean
  notify_sms: boolean
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${checked ? 'bg-violet-600' : 'bg-zinc-700'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.05] last:border-0">
      <div>
        <p className="text-sm font-medium text-zinc-100">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotifSettings>({
    notify_invoice_paid: true, notify_invoice_overdue: true,
    notify_advance_approved: true, notify_withdrawal_complete: true,
    notify_email: true, notify_sms: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) setSettings({
          notify_invoice_paid: user.notify_invoice_paid ?? true,
          notify_invoice_overdue: user.notify_invoice_overdue ?? true,
          notify_advance_approved: user.notify_advance_approved ?? true,
          notify_withdrawal_complete: user.notify_withdrawal_complete ?? true,
          notify_email: user.notify_email ?? true,
          notify_sms: user.notify_sms ?? false,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  function set(key: keyof NotifSettings) {
    return (value: boolean) => setSettings((s) => ({ ...s, [key]: value }))
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data.success) showToast('success', 'Preferences saved.')
      else showToast('error', data.error || 'Failed to save.')
    } catch {
      showToast('error', 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    {
      title: 'Invoice notifications',
      rows: [
        { key: 'notify_invoice_paid' as const, label: 'Invoice paid', description: 'Get notified when a client pays' },
        { key: 'notify_invoice_overdue' as const, label: 'Invoice overdue', description: 'Get notified when an invoice passes its due date' },
      ],
    },
    {
      title: 'Advance notifications',
      rows: [{ key: 'notify_advance_approved' as const, label: 'Advance approved / rejected', description: 'Decisions on your advance requests' }],
    },
    {
      title: 'Withdrawal notifications',
      rows: [{ key: 'notify_withdrawal_complete' as const, label: 'Withdrawal complete', description: 'When a withdrawal reaches your bank' }],
    },
    {
      title: 'Delivery channels',
      rows: [
        { key: 'notify_email' as const, label: 'Email notifications', description: 'Receive alerts via email' },
        { key: 'notify_sms' as const, label: 'SMS notifications', description: 'Receive alerts via SMS (standard rates apply)' },
      ],
    },
  ]

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="p-2 hover:bg-white/[0.06] rounded-lg border border-transparent hover:border-white/[0.07] transition-all">
          <ArrowLeft className="h-4 w-4 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Control which alerts you receive</p>
        </div>
      </div>

      {toast && (
        <div className={`flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium border ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {loading ? (
        <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="divide-y divide-white/[0.05]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-between items-center px-5 py-4">
                <div className="h-4 bg-zinc-800 rounded w-40 animate-pulse" />
                <div className="h-6 w-11 bg-zinc-800 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.05]">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{section.title}</h2>
              </div>
              {section.rows.map((row) => (
                <ToggleRow
                  key={row.key}
                  label={row.label}
                  description={row.description}
                  checked={settings[row.key]}
                  onChange={set(row.key)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} disabled={loading}>Save preferences</Button>
      </div>
    </div>
  )
}
