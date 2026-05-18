'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  ChevronLeft, ChevronRight, Plus, Trash, CalendarDays, GraduationCap, Video,
  ClipboardList, AlertCircle, Sparkles,
} from 'lucide-react'

interface RawEvent {
  id: string
  title: string
  description: string | null
  event_type: string
  starts_at: string
  ends_at?: string | null
  owner_student_id: string | null
}
interface Deadline {
  id: string
  title: string
  due_date: string
}
interface Item {
  id: string
  title: string
  description: string | null
  type: string
  date: Date
  personal: boolean
  href?: string
  canDelete?: boolean
}

const TYPE_META: Record<string, { label: string; color: string; icon: any }> = {
  class: { label: 'Class', color: '#f97316', icon: GraduationCap },
  session: { label: 'Live Session', color: '#3b82f6', icon: Video },
  task: { label: 'Task', color: '#eab308', icon: ClipboardList },
  deadline: { label: 'Deadline', color: '#ef4444', icon: AlertCircle },
  personal: { label: 'Personal', color: '#8b5cf6', icon: Sparkles },
}
const meta = (t: string) => TYPE_META[t] || TYPE_META.class

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export default function CalendarView({
  studentId,
  courseId,
  events,
  deadlines,
}: {
  studentId: string
  courseId: string | null
  events: RawEvent[]
  deadlines: Deadline[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [localEvents, setLocalEvents] = useState<RawEvent[]>(events)
  const now = new Date()
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', starts_at: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = useMemo<Item[]>(() => {
    const list: Item[] = []
    for (const e of localEvents) {
      list.push({
        id: e.id,
        title: e.title,
        description: e.description,
        type: e.event_type,
        date: new Date(e.starts_at),
        personal: !!e.owner_student_id,
        canDelete: !!e.owner_student_id,
      })
    }
    for (const d of deadlines) {
      list.push({
        id: 'due-' + d.id,
        title: d.title,
        description: 'Assignment deadline',
        type: 'deadline',
        date: new Date(d.due_date),
        personal: false,
        href: '/dashboard/assignments/' + d.id,
      })
    }
    return list.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [localEvents, deadlines])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const itemsForDay = (day: number) =>
    items.filter((it) => sameDay(it.date, new Date(year, month, day)))

  const panelItems = selectedDay
    ? items.filter((it) => sameDay(it.date, selectedDay))
    : items.filter((it) => it.date.getTime() >= now.getTime() - 86400000).slice(0, 12)

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!courseId) {
      setError('You need to be assigned to a course first.')
      return
    }
    if (!form.title.trim() || !form.starts_at) {
      setError('Add a title and a date/time.')
      return
    }
    setBusy(true)
    const { data, error: insertError } = await supabase
      .from('calendar_events')
      .insert({
        course_id: courseId,
        owner_student_id: studentId,
        created_by: studentId,
        title: form.title.trim(),
        description: form.description || null,
        event_type: 'personal',
        starts_at: new Date(form.starts_at).toISOString(),
      })
      .select('id, title, description, event_type, starts_at, ends_at, owner_student_id')
      .single()
    setBusy(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    if (data) {
      setLocalEvents((xs) => [...xs, data])
      setForm({ title: '', description: '', starts_at: '' })
      setShowAdd(false)
      router.refresh()
    }
  }

  const removeEvent = async (id: string) => {
    if (!confirm('Remove this from your schedule?')) return
    await supabase.from('calendar_events').delete().eq('id', id)
    setLocalEvents((xs) => xs.filter((e) => e.id !== id))
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Month grid */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{format(cursor, 'MMMM yyyy')}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
                setSelectedDay(null)
              }}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-2 text-center text-[11px] font-medium uppercase text-muted-foreground"
              >
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />
              const date = new Date(year, month, day)
              const dayItems = itemsForDay(day)
              const isToday = sameDay(date, now)
              const isSelected = selectedDay && sameDay(date, selectedDay)
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : date)}
                  className={cn(
                    'min-h-[76px] rounded-xl border p-1.5 text-left align-top transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                      isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                    )}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayItems.slice(0, 2).map((it) => (
                      <div
                        key={it.id}
                        className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                        style={{ background: meta(it.type).color + '22', color: meta(it.type).color }}
                      >
                        {it.title}
                      </div>
                    ))}
                    {dayItems.length > 2 && (
                      <div className="px-1 text-[10px] text-muted-foreground">
                        +{dayItems.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Side panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              {selectedDay ? format(selectedDay, 'EEEE, MMM dd') : 'Upcoming'}
            </CardTitle>
            <CardDescription>
              {selectedDay ? (
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-primary hover:underline"
                >
                  ← Back to upcoming
                </button>
              ) : (
                'Your next classes, sessions and deadlines'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {panelItems.length > 0 ? (
              <div className="space-y-2.5">
                {panelItems.map((it) => {
                  const m = meta(it.type)
                  const body = (
                    <div className="flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: m.color + '22', color: m.color }}
                      >
                        <m.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{it.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(it.date, 'EEE, MMM dd · hh:mm a')}
                        </p>
                        {it.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {it.description}
                          </p>
                        )}
                        <span className="mt-1 inline-block text-[10px] font-medium" style={{ color: m.color }}>
                          {m.label}
                        </span>
                      </div>
                      {it.canDelete && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            removeEvent(it.id)
                          }}
                          className="self-start text-muted-foreground hover:text-destructive"
                          title="Remove"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )
                  return it.href ? (
                    <Link key={it.id} href={it.href}>
                      {body}
                    </Link>
                  ) : (
                    <div key={it.id}>{body}</div>
                  )
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing {selectedDay ? 'on this day' : 'coming up'}.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Add personal event */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Study Plan</CardTitle>
            <CardDescription>Add your own personal schedule items</CardDescription>
          </CardHeader>
          <CardContent>
            {showAdd ? (
              <form onSubmit={addEvent} className="space-y-3">
                <Input
                  placeholder="What are you planning?"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Notes (optional)"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="min-h-16"
                />
                <DateTimePicker
                  value={form.starts_at}
                  onChange={(v) => setForm((f) => ({ ...f, starts_at: v }))}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={busy}>
                    {busy ? 'Saving…' : 'Add'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAdd(false)
                      setError(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAdd(true)}
                disabled={!courseId}
              >
                <Plus className="h-4 w-4 mr-2" />
                {courseId ? 'Add to my plan' : 'Join a course to plan'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
