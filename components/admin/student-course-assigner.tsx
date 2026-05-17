'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Course {
  id: string
  title: string
}

/**
 * Per-student course picker shown on the admin Students page.
 *
 * Changing the dropdown immediately writes `students.course_id` — that single
 * value is what grants the student access to exactly one course. Setting it
 * back to "— No course —" revokes their access entirely.
 */
export default function StudentCourseAssigner({
  studentId,
  currentCourseId,
  courses,
}: {
  studentId: string
  currentCourseId: string | null
  courses: Course[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [courseId, setCourseId] = useState<string>(currentCourseId ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value
    setCourseId(next)
    setStatus('saving')

    const { error } = await supabase
      .from('students')
      .update({ course_id: next === '' ? null : next })
      .eq('id', studentId)

    if (error) {
      setStatus('error')
      return
    }

    setStatus('saved')
    router.refresh()
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="flex items-center gap-3 sm:justify-end">
      <select
        value={courseId}
        onChange={handleChange}
        disabled={status === 'saving'}
        className="w-full sm:w-64 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
      >
        <option value="">— No course (no access) —</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title}
          </option>
        ))}
      </select>
      <span className="text-xs w-16 shrink-0">
        {status === 'saving' && <span className="text-muted-foreground">Saving…</span>}
        {status === 'saved' && <span className="text-green-600">Saved ✓</span>}
        {status === 'error' && <span className="text-destructive">Failed</span>}
      </span>
    </div>
  )
}
