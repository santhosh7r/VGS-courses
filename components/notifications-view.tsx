'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export default function NotificationsView({
  notifications: initial,
}: {
  notifications: Notification[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [busy, setBusy] = useState(false)

  const unread = items.filter(n => !n.is_read)

  const markAllRead = async () => {
    if (unread.length === 0) return
    setBusy(true)
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unread.map(n => n.id))
    setItems(items.map(n => ({ ...n, is_read: true })))
    setBusy(false)
    router.refresh()
  }

  const open = async (n: Notification) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      setItems(items.map(x => (x.id === n.id ? { ...x, is_read: true } : x)))
      router.refresh()
    }
    if (n.link) router.push(n.link)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            {unread.length > 0 ? `${unread.length} unread` : 'You are all caught up'}
          </CardDescription>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={busy}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`w-full text-left flex gap-3 p-3 rounded-lg border transition-colors ${
                  n.is_read
                    ? 'border-border'
                    : 'border-primary/40 bg-primary/5'
                } ${n.link ? 'hover:bg-muted cursor-pointer' : ''}`}
              >
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    n.is_read ? 'bg-transparent' : 'bg-primary'
                  }`}
                />
                <div className="min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  {n.body && (
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
