'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Megaphone } from 'lucide-react'

/** Send an announcement notification to every student on the platform. */
export default function AnnouncementSender() {
  const supabase = createClient()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<number | null>(null)

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSent(null)
    if (!title.trim()) {
      setError('Add a title for the announcement.')
      return
    }
    setBusy(true)
    try {
      const { data: students } = await supabase.from('students').select('id')
      const recipients = students || []
      if (recipients.length === 0) {
        setError('There are no students to notify yet.')
        return
      }
      const rows = recipients.map((s: any) => ({
        recipient_id: s.id,
        type: 'announcement',
        title: title.trim(),
        body: body.trim() || null,
      }))
      const { error: insertError } = await supabase.from('notifications').insert(rows)
      if (insertError) {
        setError(insertError.message)
        return
      }
      setSent(rows.length)
      setTitle('')
      setBody('')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          Send Announcement
        </CardTitle>
        <CardDescription>Notify every student on the platform at once</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={send} className="space-y-4">
          <Input
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Message (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-24"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {sent != null && (
            <p className="text-sm text-green-600">Sent to {sent} student(s).</p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send to All Students'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
