import { createClient } from '@/lib/supabase/server'
import NotificationsView from '@/components/notifications-view'

export const dynamic = 'force-dynamic'

export default async function StudentNotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Notifications</h1>
      <div className="max-w-2xl">
        <NotificationsView notifications={notifications || []} />
      </div>
    </div>
  )
}
