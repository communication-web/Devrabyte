'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'photographer', label: 'Photographer' },
  { value: 'designer', label: 'Brand Designer' },
  { value: 'content_creator', label: 'Content Creator' },
  { value: 'videographer', label: 'Videographer' },
  { value: 'illustrator', label: 'Illustrator' },
  { value: 'copywriter', label: 'Copywriter' },
  { value: 'social_media_manager', label: 'Social Media Manager' },
  { value: 'other', label: 'Other' },
]

export default function ProfileSettingsPage() {
  const [form, setForm] = useState({ full_name: '', business_name: '', creative_category: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) setForm({ full_name: user.full_name || '', business_name: user.business_name || '', creative_category: user.creative_category || '', phone: user.phone || '' })
      })
      .finally(() => setLoading(false))
  }, [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) showToast('success', 'Profile updated.')
      else showToast('error', data.error || 'Failed to save.')
    } catch {
      showToast('error', 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="p-2 hover:bg-white/[0.06] rounded-lg border border-transparent hover:border-white/[0.07] transition-all">
          <ArrowLeft className="h-4 w-4 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Update your personal and business details</p>
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

      <div className="bg-zinc-900 rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-sm font-semibold text-white">Personal Information</h2>
        </div>
        <div className="px-5 py-5 space-y-4">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-10 bg-zinc-800 rounded-lg animate-pulse" />)
          ) : (
            <>
              <Input label="Full name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" />
              <Input label="Business name" value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} placeholder="Your studio or business name" />
              <Select label="Creative category" value={form.creative_category} onChange={(e) => setForm((f) => ({ ...f, creative_category: e.target.value }))}>
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <Input label="Phone number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+234 800 000 0000" type="tel" />
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} disabled={loading}>Save changes</Button>
      </div>
    </div>
  )
}
