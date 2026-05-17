'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash, Layers } from 'lucide-react'

interface Module {
  id: string
  title: string
  order_index: number
}

/** Create / rename / delete modules — the lesson groupings within a course. */
export default function ModuleManager({
  courseId,
  modules: initial,
}: {
  courseId: string
  modules: Module[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [modules, setModules] = useState(initial)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

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
            .map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-2 font-medium">
                    <Layers className="w-4 h-4 text-primary" />
                    {m.title}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => rename(m)} title="Rename">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(m.id)} title="Delete">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No modules yet. Add modules to group your lessons, then pick a module when creating
          or editing a lesson.
        </p>
      )}
    </div>
  )
}
