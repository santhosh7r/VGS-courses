import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Zap, Flame, Award, Activity, BookOpen } from 'lucide-react'
import StudentCourseAssigner from '@/components/admin/student-course-assigner'
import StudentStatusToggle from '@/components/admin/student-status-toggle'
import StudentNotes from '@/components/admin/student-notes'
import ExecutionScore from '@/components/execution-score'
import { computeExecutionScore } from '@/lib/execution-score'

interface PageProps {
  params: Promise<{ studentId: string }>
}

const ACTIVITY_LABEL: Record<string, string> = {
  login: 'Logged in',
  lesson_completed: 'Completed a lesson',
  assignment_submitted: 'Submitted an assignment',
  assignment_approved: 'Assignment approved',
}

export default async function AdminStudentDetailPage({ params }: PageProps) {
  const { studentId } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, email, status, xp, streak, longest_streak, last_active_at, last_login_at, course_id, created_at, admin_notes, tags, courses (id, title)')
    .eq('id', studentId)
    .maybeSingle()

  if (!student) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/admin/students">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Link>
        </Button>
        <p>Student not found.</p>
      </div>
    )
  }

  const [{ data: courses }, { data: activity }, { data: submissions }, { data: earned }, { data: progress }] =
    await Promise.all([
      supabase.from('courses').select('id, title').order('order_index'),
      supabase
        .from('activity_log')
        .select('id, type, detail, xp_delta, created_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('submissions')
        .select('id, status, points_earned, submitted_at, assignments (title)')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false }),
      supabase
        .from('student_achievements')
        .select('earned_at, achievements (title, description)')
        .eq('student_id', studentId),
      supabase.from('lesson_progress').select('lesson_id').eq('student_id', studentId),
    ])

  let totalLessons = 0
  if (student.course_id) {
    const { count } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', student.course_id)
    totalLessons = count || 0
  }

  const acts = activity || []
  const subs = submissions || []
  const lessonsDone = progress?.length || 0
  const completion = totalLessons > 0 ? Math.round((lessonsDone / totalLessons) * 100) : 0
  const approved = subs.filter((s: any) => s.status === 'approved').length
  const logins = acts.filter((a: any) => a.type === 'login')

  // Consistency: distinct active days within the last 30 days.
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const activeDays = new Set(
    acts
      .filter((a: any) => new Date(a.created_at).getTime() >= cutoff)
      .map((a: any) => new Date(a.created_at).toISOString().slice(0, 10))
  ).size
  const consistency = Math.round((activeDays / 30) * 100)

  const assignmentRate = subs.length > 0 ? approved / subs.length : 1
  const executionScore = computeExecutionScore({
    completionPct: completion,
    assignmentRate,
    streak: student.streak,
    consistency,
  })

  const course: any = student.courses

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-4 sm:mb-6">
        <Link href="/admin/students">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Link>
      </Button>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6 sm:mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
              {student.full_name || 'Unnamed student'}
            </h1>
            <span
              className={`text-xs uppercase tracking-wide px-2 py-1 rounded ${
                student.status === 'suspended'
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-green-600/15 text-green-600'
              }`}
            >
              {student.status}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 break-all">{student.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Joined {format(new Date(student.created_at), 'MMM dd, yyyy')} ·{' '}
            {student.last_active_at
              ? `last active ${format(new Date(student.last_active_at), 'MMM dd, yyyy')}`
              : 'never active'}
          </p>
        </div>
        <StudentStatusToggle studentId={student.id} status={student.status} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard icon={<Zap className="w-5 h-5 text-yellow-500" />} label="Total XP" value={student.xp} />
        <StatCard icon={<Flame className="w-5 h-5 text-orange-500" />} label="Current Streak" value={`${student.streak}d`} />
        <StatCard icon={<Flame className="w-5 h-5 text-muted-foreground" />} label="Longest Streak" value={`${student.longest_streak}d`} />
        <StatCard icon={<BookOpen className="w-5 h-5 text-primary" />} label="Course Progress" value={`${completion}%`} />
        <StatCard icon={<Activity className="w-5 h-5 text-blue-500" />} label="Consistency" value={`${consistency}%`} />
      </div>

      {/* Execution Score */}
      <div className="mb-6 sm:mb-8">
        <ExecutionScore
          score={executionScore}
          factors={[
            { label: 'Course completion', value: completion },
            { label: 'Assignment performance', value: assignmentRate * 100 },
            { label: 'Consistency (30d)', value: consistency },
          ]}
        />
      </div>

      {/* Course assignment */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Course Assignment</CardTitle>
          <CardDescription>
            {course ? `Currently assigned to: ${course.title}` : 'Not assigned to any course'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentCourseAssigner
            studentId={student.id}
            currentCourseId={student.course_id}
            courses={courses || []}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="space-y-4 sm:space-y-6">
        <div className="-mx-4 sm:mx-0 overflow-x-auto px-4 sm:px-0">
          <TabsList className="w-max">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="logins">Logins ({logins.length})</TabsTrigger>
            <TabsTrigger value="assignments">Assignments ({subs.length})</TabsTrigger>
            <TabsTrigger value="badges">Badges ({earned?.length || 0})</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>{lessonsDone}/{totalLessons} lessons · {approved} approved submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {acts.length > 0 ? (
                <div className="space-y-2">
                  {acts.map((a: any) => (
                    <div
                      key={a.id}
                      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3 text-sm border-b border-border last:border-0 py-2"
                    >
                      <span>{ACTIVITY_LABEL[a.type] || a.type}</span>
                      <span className="flex items-center gap-3 text-muted-foreground text-xs sm:text-sm">
                        {a.xp_delta > 0 && (
                          <span className="text-yellow-600">+{a.xp_delta} XP</span>
                        )}
                        {format(new Date(a.created_at), 'MMM dd, hh:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logins">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Login History</CardTitle>
            </CardHeader>
            <CardContent>
              {logins.length > 0 ? (
                <div className="space-y-2">
                  {logins.map((a: any) => (
                    <div
                      key={a.id}
                      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3 text-sm border-b border-border last:border-0 py-2"
                    >
                      <span>{format(new Date(a.created_at), 'EEE, MMM dd yyyy · hh:mm a')}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {a.detail?.device || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No logins recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {subs.length > 0 ? (
                <div className="space-y-2">
                  {subs.map((s: any) => (
                    <div
                      key={s.id}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 text-sm border-b border-border last:border-0 py-2"
                    >
                      <span className="min-w-0 break-words">
                        {s.assignments?.title || 'Assignment'}
                      </span>
                      <span className="flex items-center gap-3 shrink-0">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(s.submitted_at), 'MMM dd, yyyy')}
                        </span>
                        <span
                          className={`text-xs uppercase px-1.5 py-0.5 rounded ${
                            s.status === 'approved'
                              ? 'bg-green-600/15 text-green-600'
                              : s.status === 'rejected'
                                ? 'bg-destructive/15 text-destructive'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {s.status}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {earned && earned.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {earned.map((e: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <Award className="w-6 h-6 text-yellow-500 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{e.achievements?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.achievements?.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No badges earned yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <StudentNotes
            studentId={student.id}
            notes={student.admin_notes}
            tags={student.tags}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
