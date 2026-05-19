'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Pencil, Trash, Layers, ChevronRight, BookOpen } from 'lucide-react'

interface Module {
  id: string
  title: string
  order_index: number
}

interface Lesson {
  id: string
  title: string
  is_published: boolean
  order_index: number
  module_id: string | null
}

/**
 * Create / rename / delete modules — the lesson groupings within a course.
 * Each module expands to show the lessons it contains.
 */
export default function ModuleManager({
  courseId,
  modules: initial,
  lessons = [],
}: {
  courseId: string
  modules: Module[]
  lessons?: Lesson[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [modules, setModules] = useState(initial)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  const lessonsFor = (moduleId: string) =>
    lessons
      .filter((l) => l.module_id === moduleId)
      .sort((a, b) => a.order_index - b.order_index)

  const ungrouped = lessons
    .filter((l) => !l.module_id || !modules.some((m) => m.id === l.module_id))
    .sort((a, b) => a.order_index - b.order_index)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    const nextOrder = modules.length
      ? Math.max(...modules.map(m => m.order_index)) + 1
      : 0
    const { data, error } = await supabase
      .from('modules')
      .insert({ course_id: courseId, title: title.trim(), order_index: nextOrder })
      .select()
      .single()
    setBusy(false)
    if (!error && data) {
      setModules([...modules, data])
      setTitle('')
      router.refresh()
    }
  }

  const rename = async (m: Module) => {
    const next = prompt('Rename module', m.title)
    if (!next || next.trim() === m.title) return
    await supabase.from('modules').update({ title: next.trim() }).eq('id', m.id)
    setModules(modules.map(x => (x.id === m.id ? { ...x, title: next.trim() } : x)))
    router.refresh()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this module? Its lessons stay but become ungrouped.')) return
    await supabase.from('modules').delete().eq('id', id)
    setModules(modules.filter(m => m.id !== id))
    router.refresh()
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <form onSubmit={add} className="flex gap-2">
        <Input
          placeholder="New module name (e.g. Module 1: Foundations)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          Add Module
        </Button>
      </form>

      {modules.length > 0 ? (
        <div className="space-y-2">
          {modules
            .slice()
            .sort((a, b) => a.order_index - b.order_index)
            .map((m) => {
              const moduleLessons = lessonsFor(m.id)
              const isOpen = expanded.has(m.id)
              return (
                <Card key={m.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggle(m.id)}
                        className="flex items-center gap-2 font-medium text-left"
                      >
                        <ChevronRight
                          className={`w-4 h-4 text-muted-foreground transition-transform ${
                            isOpen ? 'rotate-90' : ''
                          }`}
                        />
                        <Layers className="w-4 h-4 text-primary" />
                        {m.title}
                        <Badge variant="secondary" className="ml-1">
                          {moduleLessons.length} lesson
                          {moduleLessons.length !== 1 ? 's' : ''}
                        </Badge>
                      </button>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => rename(m)} title="Rename">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(m.id)} title="Delete">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 pl-6 space-y-1.5">
                        {moduleLessons.length > 0 ? (
                          moduleLessons.map((l, i) => (
                            <Link
                              key={l.id}
                              href={`/admin/lessons/${l.id}`}
                              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                                Lesson {i + 1}: {l.title}
                              </span>
                              <Badge variant={l.is_published ? 'default' : 'outline'}>
                                {l.is_published ? 'Published' : 'Draft'}
                              </Badge>
                            </Link>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No lessons in this module yet — assign one from a lesson&apos;s
                            edit page.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No modules yet. Add modules to group your lessons, then pick a module when creating
          or editing a lesson.
        </p>
      )}

      {ungrouped.length > 0 && (
        <Card>
          <CardContent className="py-3 space-y-1.5">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layers className="w-4 h-4" />
              Ungrouped lessons ({ungrouped.length})
            </p>
            {ungrouped.map((l) => (
              <Link
                key={l.id}
                href={`/admin/lessons/${l.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                  {l.title}
                </span>
                <Badge variant={l.is_published ? 'default' : 'outline'}>
                  {l.is_published ? 'Published' : 'Draft'}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
