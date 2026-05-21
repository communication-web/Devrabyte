'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
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
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
        checked ? 'bg-violet-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotifSettings>({
    notify_invoice_paid: true,
    notify_invoice_overdue: true,
    notify_advance_approved: true,
    notify_withdrawal_complete: true,
    notify_email: true,
    notify_sms: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) {
          setSettings({
            notify_invoice_paid: user.notify_invoice_paid ?? true,
            notify_invoice_overdue: user.notify_invoice_overdue ?? true,
            notify_advance_approved: user.notify_advance_approved ?? true,
            notify_withdrawal_complete: user.notify_withdrawal_complete ?? true,
            notify_email: user.notify_email ?? true,
            notify_sms: user.notify_sms ?? false,
          })
        }
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
      if (data.success) {
        showToast('success', 'Notification preferences saved.')
      } else {
        showToast('error', data.error || 'Failed to save preferences.')
      }
    } catch {
      showToast('error', 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-0.5">Control which alerts you receive</p>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="space-y-4 py-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-100 rounded w-40 animate-pulse" />
                <div className="h-6 w-11 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Invoice notifications</h2>
            </CardHeader>
            <CardContent className="py-0">
              <ToggleRow
                label="Invoice paid"
                description="Get notified when a client pays an invoice"
                checked={settings.notify_invoice_paid}
                onChange={set('notify_invoice_paid')}
              />
              <ToggleRow
                label="Invoice overdue"
                description="Get notified when an invoice passes its due date"
                checked={settings.notify_invoice_overdue}
                onChange={set('notify_invoice_overdue')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Advance notifications</h2>
            </CardHeader>
            <CardContent className="py-0">
              <ToggleRow
                label="Advance approved / rejected"
                description="Get notified of decisions on your advance requests"
                checked={settings.notify_advance_approved}
                onChange={set('notify_advance_approved')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Withdrawal notifications</h2>
            </CardHeader>
            <CardContent className="py-0">
              <ToggleRow
                label="Withdrawal complete"
                description="Get notified when a withdrawal reaches your bank"
                checked={settings.notify_withdrawal_complete}
                onChange={set('notify_withdrawal_complete')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Delivery channels</h2>
            </CardHeader>
            <CardContent className="py-0">
              <ToggleRow
                label="Email notifications"
                description="Receive alerts via email"
                checked={settings.notify_email}
                onChange={set('notify_email')}
              />
              <ToggleRow
                label="SMS notifications"
                description="Receive alerts via SMS (standard rates apply)"
                checked={settings.notify_sms}
                onChange={set('notify_sms')}
              />
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} disabled={loading}>
          Save preferences
        </Button>
      </div>
    </div>
  )
}
