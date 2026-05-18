'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Trash, CalendarClock, GraduationCap, ClipboardList, Video } from 'lucide-react'

interface Event {
  id: string
  title: string
  description: string | null
  event_type: string
  starts_at: string
  ends_at: string | null
}

const TYPES = [
  { value: 'class', label: 'Class', icon: GraduationCap },
  { value: 'task', label: 'Task', icon: ClipboardList },
  { value: 'session', label: 'Live Session', icon: Video },
]

const typeMeta = (t: string) => TYPES.find((x) => x.value === t) || TYPES[0]

/** Admin manages a course's upcoming classes, live sessions and tasks. */
export default function ScheduleManager({
  courseId,
  events: initial,
}: {
  courseId: string
  events: Event[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [events, setEvents] = useState(initial)
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'class',
    starts_at: '',
    ends_at: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Bumped after a successful add to remount (and clear) the date/time pickers.
  const [formKey, setFormKey] = useState(0)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.title.trim() || !form.starts_at) {
      setError('Add a title and a start date/time.')
      return
    }
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: insertError } = await supabase
      .from('calendar_events')
      .insert({
        course_id: courseId,
        owner_student_id: null,
        created_by: user?.id ?? null,
        title: form.title.trim(),
        description: form.description || null,
        event_type: form.event_type,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      })
      .select()
      .single()
    setBusy(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    if (data) {
      setEvents((xs) => [...xs, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
      setForm({ title: '', description: '', event_type: 'class', starts_at: '', ends_at: '' })
      setFormKey((k) => k + 1)
      router.refresh()
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this scheduled item?')) return
    await supabase.from('calendar_events').delete().eq('id', id)
    setEvents((xs) => xs.filter((e) => e.id !== id))
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add to Schedule</CardTitle>
          <CardDescription>
            Classes, live sessions and tasks here appear on every student&apos;s calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, event_type: t.value }))}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-all',
                      form.event_type === t.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title / Topic</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Live class: React Hooks deep dive"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Details (optional)</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What this session covers, prep work, meeting link…"
                className="min-h-20"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Starts</label>
                <DateTimePicker
                  key={`starts-${formKey}`}
                  value={form.starts_at}
                  onChange={(v) => setForm((f) => ({ ...f, starts_at: v }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Ends (optional)</label>
                <DateTimePicker
                  key={`ends-${formKey}`}
                  value={form.ends_at}
                  onChange={(v) => setForm((f) => ({ ...f, ends_at: v }))}
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Adding…' : 'Add to Schedule'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scheduled Items ({events.length})</CardTitle>
          <CardDescription>Upcoming classes, sessions and tasks for this course</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-2">
              {events.map((ev) => {
                const m = typeMeta(ev.event_type)
                return (
                  <div
                    key={ev.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <m.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(ev.starts_at), 'EEE, MMM dd · hh:mm a')}
                        </p>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => remove(ev.id)} title="Delete">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <CalendarClock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
