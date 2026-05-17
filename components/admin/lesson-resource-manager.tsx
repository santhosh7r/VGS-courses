'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash, FileText } from 'lucide-react'

interface Resource {
  id: string
  title: string
  resource_type: string
  file_url: string | null
}

const TYPES = ['link', 'pdf', 'video', 'document', 'presentation', 'code']

/** Attach links to PDFs, videos and other resources to a lesson. */
export default function LessonResourceManager({
  lessonId,
  resources: initial,
}: {
  lessonId: string
  resources: Resource[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [resources, setResources] = useState(initial)
  const [form, setForm] = useState({ title: '', type: 'link', url: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.title.trim() || !form.url.trim()) {
      setError('Give the resource a title and a URL.')
      return
    }
    setBusy(true)
    const { data, error: insertError } = await supabase
      .from('lesson_resources')
      .insert({
        lesson_id: lessonId,
        title: form.title.trim(),
        resource_type: form.type,
        file_url: form.url.trim(),
      })
      .select()
      .single()
    setBusy(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    if (data) {
      setResources([...resources, data])
      setForm({ title: '', type: 'link', url: '' })
      router.refresh()
    }
  }

  const remove = async (id: string) => {
    await supabase.from('lesson_resources').delete().eq('id', id)
    setResources(resources.filter(r => r.id !== id))
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resources</CardTitle>
        <CardDescription>Attach PDFs, videos, slides and other links</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.length > 0 && (
          <div className="space-y-2">
            {resources.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 border border-border rounded-lg"
              >
                <span className="flex items-center gap-2 text-sm min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{r.title}</span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {r.resource_type}
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => remove(r.id)} title="Remove">
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={add} className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              placeholder="Resource title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              {TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Input
              type="url"
              placeholder="https://…"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? 'Adding…' : 'Add Resource'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
