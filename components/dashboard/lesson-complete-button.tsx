'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

/**
 * Marks a lesson complete for the current student. The lesson_progress insert
 * triggers a +10 XP award and an activity-log entry in the database.
 */
export default function LessonCompleteButton({
  lessonId,
  studentId,
  completed,
}: {
  lessonId: string
  studentId: string
  completed: boolean
}) {
  const supabase = createClient()
  const router = useRouter()
  const [done, setDone] = useState(completed)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markComplete = async () => {
    setBusy(true)
    setError(null)
    const { error: insertError } = await supabase
      .from('lesson_progress')
      .insert({ student_id: studentId, lesson_id: lessonId })

    setBusy(false)
    if (insertError) {
      // Unique-violation just means it was already completed — treat as done.
      if (insertError.code === '23505') {
        setDone(true)
        return
      }
      setError(insertError.message)
      return
    }
    setDone(true)
    router.refresh()
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
        <CheckCircle2 className="w-5 h-5" />
        Lesson completed
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button onClick={markComplete} disabled={busy} className="w-full">
        <CheckCircle2 className="w-4 h-4 mr-2" />
        {busy ? 'Saving…' : 'Mark Lesson Complete (+10 XP)'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
