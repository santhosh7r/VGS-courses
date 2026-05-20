import { createClient } from '@/lib/supabase/server'
import NotificationsView from '@/components/notifications-view'
import AnnouncementSender from '@/components/admin/announcement-sender'

export const dynamic = 'force-dynamic'

export default async function AdminNotificationsPage() {
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
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">
        Notifications
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <NotificationsView notifications={notifications || []} />
        <AnnouncementSender />
      </div>
    </div>
  )
}
