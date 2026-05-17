'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'

const TAGS = [
  'High performer',
  'Needs attention',
  'Consistent',
  'Inactive',
  'Placement ready',
  'At risk',
]

/**
 * Internal admin notes + tags for a student. Private — students never see this.
 */
export default function StudentNotes({
  studentId,
  notes: initialNotes,
  tags: initialTags,
}: {
  studentId: string
  notes: string | null
  tags: string[] | null
}) {
  const supabase = createClient()
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [tags, setTags] = useState<string[]>(initialTags ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTag = async (tag: string) => {
    const nextTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    setTags(nextTags)
    await supabase.from('students').update({ tags: nextTags }).eq('id', studentId)
    router.refresh()
  }

  const saveNotes = async () => {
    setError(null)
    setSaving(true)
    const { error: updateError } = await supabase
      .from('students')
      .update({ admin_notes: notes })
      .eq('id', studentId)
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-4 w-4 text-primary" />
          Internal Notes
        </CardTitle>
        <CardDescription>
          Private to admins — placement readiness, mentorship comments, warnings. The student
          never sees this.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => {
              const active = tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Notes</p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations, feedback, mentorship notes, warnings…"
            className="min-h-40"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3">
          <Button onClick={saveNotes} disabled={saving}>
            {saving ? 'Saving…' : 'Save Notes'}
          </Button>
          {saved && <span className="text-sm text-green-600">Saved ✓</span>}
        </div>
      </CardContent>
    </Card>
  )
}
