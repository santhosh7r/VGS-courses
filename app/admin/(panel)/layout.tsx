export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/admin-nav'
import CommandPalette from '@/components/command-palette'

/**
 * Server-side guard for every /admin page (except /admin/login, which lives
 * outside this route group). A visitor may enter only if they have a row in
 * the `admins` table — that table is the entire admin allow-list.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!admin) {
    redirect('/admin/login')
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminNav email={user.email} name={admin.full_name} />
      <main className="flex-1 overflow-auto">{children}</main>
      <CommandPalette role="admin" />
    </div>
  )
}
