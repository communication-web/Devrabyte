'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
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

interface FormState {
  full_name: string
  business_name: string
  creative_category: string
  phone: string
}

export default function ProfileSettingsPage() {
  const [form, setForm] = useState<FormState>({
    full_name: '',
    business_name: '',
    creative_category: '',
    phone: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) {
          setForm({
            full_name: user.full_name || '',
            business_name: user.business_name || '',
            creative_category: user.creative_category || '',
            phone: user.phone || '',
          })
        }
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
      if (data.success) {
        showToast('success', 'Profile updated successfully.')
      } else {
        showToast('error', data.error || 'Failed to save profile.')
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
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">Update your personal and business details</p>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Personal Information</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <Input
                label="Full name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Your full name"
              />
              <Input
                label="Business name"
                value={form.business_name}
                onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                placeholder="Your studio or business name"
              />
              <Select
                label="Creative category"
                value={form.creative_category}
                onChange={(e) => setForm((f) => ({ ...f, creative_category: e.target.value }))}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
              <Input
                label="Phone number"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+234 800 000 0000"
                type="tel"
              />
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} disabled={loading}>
          Save changes
        </Button>
      </div>
    </div>
  )
}
