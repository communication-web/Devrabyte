import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email || !isAdminEmail(user.email)) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-[#09090f]">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8 min-w-0">{children}</main>
    </div>
  )
}
