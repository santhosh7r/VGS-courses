import { createClient } from '@/lib/supabase/server'
import CalendarView from '@/components/dashboard/calendar-view'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('course_id')
    .eq('id', user.id)
    .maybeSingle()

  // RLS returns course-wide events for the student's course + their own
  // personal events. Assignment due dates are merged in as deadlines.
  const [{ data: events }, { data: assignments }] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, description, event_type, starts_at, ends_at, owner_student_id')
      .order('starts_at', { ascending: true }),
    supabase
      .from('assignments')
      .select('id, title, due_date')
      .not('due_date', 'is', null),
  ])

  return (
    <div className="p-6 md:p-8 animate-fade-rise">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground mt-1">
          Upcoming classes, deadlines and your personal study plan
        </p>
      </div>
      <CalendarView
        studentId={user.id}
        courseId={student?.course_id ?? null}
        events={events || []}
        deadlines={assignments || []}
      />
    </div>
  )
}
