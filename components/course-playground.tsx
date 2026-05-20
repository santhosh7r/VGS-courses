'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  Send, ClipboardList, Megaphone, CheckCircle2, Trash2, Wifi, WifiOff,
  ExternalLink, Users, Loader2,
} from 'lucide-react'

type MessageKind = 'message' | 'task' | 'announcement'

interface CourseMessage {
  id: string
  course_id: string
  sender_id: string
  sender_role: 'admin' | 'student'
  sender_name: string | null
  body: string
  kind: MessageKind
  metadata: { link?: string; title?: string } | Record<string, unknown>
  created_at: string
}

interface Completion {
  id: string
  message_id: string
  student_id: string
  response: string | null
  completed_at: string
  students?: { full_name: string | null } | null
}

interface Props {
  courseId: string
  role: 'admin' | 'student'
  userId: string
  userName: string
}

/**
 * Live per-course chat used during a class.
 *   - Anyone in the course can post a plain message.
 *   - Admins can also broadcast a Task (students mark Done / paste a response)
 *     or an Announcement (visually highlighted).
 *   - New messages, deletes and task completions stream in over Supabase
 *     Realtime — no page refresh needed.
 *
 * The component is intentionally shared by the admin and student panels; the
 * `role` prop only changes which UI affordances are visible.
 */
export default function CoursePlayground({ courseId, role, userId, userName }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [messages, setMessages] = useState<CourseMessage[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [loaded, setLoaded] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true)

  // Initial fetch — last 100 messages + their completions.
  useEffect(() => {
    let active = true
    const load = async () => {
      const { data: msgs, error: msgErr } = await supabase
        .from('course_messages')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true })
        .limit(100)
      if (!active) return
      if (msgErr) {
        setError(msgErr.message)
        setLoaded(true)
        return
      }
      const rows = (msgs as CourseMessage[]) || []
      setMessages(rows)

      const taskIds = rows.filter((m) => m.kind === 'task').map((m) => m.id)
      if (taskIds.length > 0) {
        const { data: comps } = await supabase
          .from('course_task_completions')
          .select('id, message_id, student_id, response, completed_at, students (full_name)')
          .in('message_id', taskIds)
        if (!active) return
        setCompletions((comps as unknown as Completion[]) || [])
      }
      setLoaded(true)
    }
    load()
    return () => {
      active = false
    }
  }, [supabase, courseId])

  // Realtime — push new messages / deletions / completions into local state.
  useEffect(() => {
    const channel = supabase
      .channel(`course-playground-${courseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'course_messages',
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          const row = payload.new as CourseMessage
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'course_messages',
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          const id = (payload.old as { id: string }).id
          setMessages((prev) => prev.filter((m) => m.id !== id))
          setCompletions((prev) => prev.filter((c) => c.message_id !== id))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'course_task_completions' },
        (payload) => {
          const row = payload.new as Completion
          // Realtime payload has no joined student name — patch the row with
          // what we know locally (own name) and let the next refetch fill in.
          const patched: Completion =
            row.student_id === userId
              ? { ...row, students: { full_name: userName } }
              : row
          setCompletions((prev) =>
            prev.some((c) => c.id === row.id) ? prev : [...prev, patched]
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'course_task_completions' },
        (payload) => {
          const id = (payload.old as { id: string }).id
          setCompletions((prev) => prev.filter((c) => c.id !== id))
        }
      )
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, courseId, userId, userName])

  // Track whether the user is pinned to the latest message — only then
  // do we auto-scroll on new messages, so we don't yank them mid-read.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => {
      const slack = 80
      wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < slack
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!loaded) return
    const el = scrollerRef.current
    if (!el) return
    if (wasAtBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, loaded])

  const completionsByMessage = useMemo(() => {
    const map = new Map<string, Completion[]>()
    for (const c of completions) {
      const list = map.get(c.message_id) || []
      list.push(c)
      map.set(c.message_id, list)
    }
    return map
  }, [completions])

  return (
    <Card className="flex flex-col h-[calc(100vh-16rem)] min-h-[480px] overflow-hidden">
      <CardHeader className="border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Live Playground
              <ConnectionBadge connected={connected} />
            </CardTitle>
            <CardDescription>
              {role === 'admin'
                ? 'Broadcast tasks or announcements to everyone in the course in real time.'
                : 'Live chat with your instructor and classmates during a class.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3"
        >
          {!loaded ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {role === 'admin'
                  ? 'Send the first message or post a quick task to kick things off.'
                  : 'The playground is quiet — once your instructor posts something it will appear here.'}
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                role={role}
                userId={userId}
                userName={userName}
                completions={completionsByMessage.get(m.id) || []}
              />
            ))
          )}
        </div>

        {error && (
          <div className="px-4 py-2 text-xs text-destructive border-t border-border">
            {error}
          </div>
        )}

        <Composer
          courseId={courseId}
          role={role}
          userId={userId}
          userName={userName}
        />
      </CardContent>
    </Card>
  )
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-600/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-green-600">
      <Wifi className="w-3 h-3" />
      Live
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      <WifiOff className="w-3 h-3" />
      Connecting…
    </span>
  )
}

function MessageRow({
  message,
  role,
  userId,
  userName,
  completions,
}: {
  message: CourseMessage
  role: 'admin' | 'student'
  userId: string
  userName: string
  completions: Completion[]
}) {
  const supabase = useMemo(() => createClient(), [])
  const isMine = message.sender_id === userId
  const isAdmin = message.sender_role === 'admin'
  const senderLabel = message.sender_name || (isAdmin ? 'Instructor' : 'Student')

  // Task-specific local state.
  const myCompletion = completions.find((c) => c.student_id === userId)
  const [taskResponse, setTaskResponse] = useState('')
  const [taskBusy, setTaskBusy] = useState(false)
  const [taskErr, setTaskErr] = useState<string | null>(null)

  const markDone = async () => {
    setTaskErr(null)
    setTaskBusy(true)
    const { error } = await supabase
      .from('course_task_completions')
      .insert({
        message_id: message.id,
        student_id: userId,
        response: taskResponse.trim() || null,
      })
    setTaskBusy(false)
    if (error) setTaskErr(error.message)
    else setTaskResponse('')
  }

  const undoDone = async () => {
    if (!myCompletion) return
    setTaskErr(null)
    setTaskBusy(true)
    const { error } = await supabase
      .from('course_task_completions')
      .delete()
      .eq('id', myCompletion.id)
    setTaskBusy(false)
    if (error) setTaskErr(error.message)
  }

  const deleteMessage = async () => {
    if (!confirm('Delete this message? This cannot be undone.')) return
    await supabase.from('course_messages').delete().eq('id', message.id)
  }

  if (message.kind === 'announcement') {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Megaphone className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Announcement · {senderLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <span>{format(new Date(message.created_at), 'h:mm a')}</span>
            {(role === 'admin' || isMine) && (
              <button
                onClick={deleteMessage}
                className="rounded p-1 hover:bg-amber-500/20"
                aria-label="Delete announcement"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-sm whitespace-pre-wrap break-words">{message.body}</p>
      </div>
    )
  }

  if (message.kind === 'task') {
    const link = typeof message.metadata?.link === 'string' ? message.metadata.link : null
    const title = typeof message.metadata?.title === 'string' ? message.metadata.title : null

    return (
      <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-primary">
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Task · {senderLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <span>{format(new Date(message.created_at), 'h:mm a')}</span>
            {(role === 'admin' || isMine) && (
              <button
                onClick={deleteMessage}
                className="rounded p-1 hover:bg-primary/10"
                aria-label="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {title && <p className="mt-2 text-sm font-semibold break-words">{title}</p>}
        <p className="mt-1 text-sm whitespace-pre-wrap break-words">{message.body}</p>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline break-all"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            {link}
          </a>
        )}

        {/* Student task controls */}
        {role === 'student' && (
          <div className="mt-3 space-y-2">
            {myCompletion ? (
              <div className="flex items-start justify-between gap-2 rounded-md border border-green-600/40 bg-green-600/10 p-2 text-sm">
                <span className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Marked done at{' '}
                    {format(new Date(myCompletion.completed_at), 'h:mm a')}
                    {myCompletion.response && (
                      <span className="block text-xs text-muted-foreground mt-1 break-words">
                        “{myCompletion.response}”
                      </span>
                    )}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={undoDone}
                  disabled={taskBusy}
                >
                  Undo
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Optional response or link…"
                  value={taskResponse}
                  onChange={(e) => setTaskResponse(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={markDone}
                  disabled={taskBusy}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {taskBusy ? 'Saving…' : 'Mark Done'}
                </Button>
              </>
            )}
            {taskErr && <p className="text-xs text-destructive">{taskErr}</p>}
          </div>
        )}

        {/* Completions visible to everyone */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          {completions.length} completed
        </div>

        {role === 'admin' && completions.length > 0 && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              View responses
            </summary>
            <ul className="mt-2 space-y-1 pl-1">
              {completions.map((c) => (
                <li key={c.id} className="border-l-2 border-primary/40 pl-2">
                  <span className="font-medium">
                    {c.students?.full_name || 'Student'}
                  </span>
                  <span className="text-muted-foreground">
                    {' · '}
                    {format(new Date(c.completed_at), 'h:mm a')}
                  </span>
                  {c.response && (
                    <p className="break-words text-foreground/90">{c.response}</p>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    )
  }

  // Plain message
  return (
    <div className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2',
          isAdmin && !isMine
            ? 'bg-primary/10 border border-primary/30'
            : isMine
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 text-[11px] mb-0.5',
            isMine ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}
        >
          <span className="font-medium">{isMine ? 'You' : senderLabel}</span>
          {isAdmin && !isMine && (
            <Badge variant="outline" className="h-4 px-1 text-[9px] uppercase">
              Admin
            </Badge>
          )}
          <span>{format(new Date(message.created_at), 'h:mm a')}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
      </div>
      {(role === 'admin' || isMine) && (
        <button
          onClick={deleteMessage}
          className="mt-0.5 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-destructive"
        >
          Delete
        </button>
      )}
    </div>
  )
}

function Composer({
  courseId,
  role,
  userId,
  userName,
}: {
  courseId: string
  role: 'admin' | 'student'
  userId: string
  userName: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [kind, setKind] = useState<MessageKind>('message')
  const [body, setBody] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskLink, setTaskLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setBody('')
    setTaskTitle('')
    setTaskLink('')
  }

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    const text = body.trim()
    if (!text) return
    setBusy(true)

    const metadata: Record<string, string> = {}
    if (kind === 'task') {
      if (taskTitle.trim()) metadata.title = taskTitle.trim()
      if (taskLink.trim()) metadata.link = taskLink.trim()
    }

    const { error: insertErr } = await supabase.from('course_messages').insert({
      course_id: courseId,
      sender_id: userId,
      sender_role: role,
      sender_name: userName,
      body: text,
      kind: role === 'admin' ? kind : 'message',
      metadata,
    })

    setBusy(false)
    if (insertErr) {
      setError(insertErr.message)
      return
    }
    reset()
    if (role === 'admin') setKind('message')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && kind === 'message') {
      e.preventDefault()
      send()
    }
  }

  return (
    <form
      onSubmit={send}
      className="border-t border-border bg-card p-3 space-y-2 shrink-0"
    >
      {role === 'admin' && (
        <div className="flex flex-wrap gap-1">
          <ComposerTab active={kind === 'message'} onClick={() => setKind('message')}>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Message
          </ComposerTab>
          <ComposerTab active={kind === 'task'} onClick={() => setKind('task')}>
            <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
            Task
          </ComposerTab>
          <ComposerTab active={kind === 'announcement'} onClick={() => setKind('announcement')}>
            <Megaphone className="w-3.5 h-3.5 mr-1.5" />
            Announcement
          </ComposerTab>
        </div>
      )}

      {role === 'admin' && kind === 'task' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            placeholder="Task title (optional)"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
          <Input
            type="url"
            placeholder="Link / resource (optional)"
            value={taskLink}
            onChange={(e) => setTaskLink(e.target.value)}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            kind === 'task'
              ? 'Describe what students should do…'
              : kind === 'announcement'
                ? 'Announcement to everyone in the course…'
                : 'Type a message…  (Enter to send, Shift+Enter for new line)'
          }
          className="flex-1 min-h-[44px] max-h-40 resize-none"
          rows={1}
        />
        <Button type="submit" disabled={busy || !body.trim()} className="shrink-0">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="sr-only">Send</span>
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}

function ComposerTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/70'
      )}
    >
      {children}
    </button>
  )
}
