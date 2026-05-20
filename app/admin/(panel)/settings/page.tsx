import { createClient } from '@/lib/supabase/server'
import AdminSettingsForm from '@/components/admin/admin-settings-form'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: admin } = await supabase
    .from('admins')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-rise">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your admin account
        </p>
      </div>
      <AdminSettingsForm email={user.email || ''} fullName={admin?.full_name || ''} />
    </div>
  )
}
