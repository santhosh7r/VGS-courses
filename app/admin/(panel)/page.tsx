import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  formatISTShortDateTimeNoPad,
  formatISTWeekday,
  getISTDateKey,
  istStartOfDayDaysAgo,
} from '@/lib/date-utils'
import {
  Users, UserCheck, BookOpen, ClipboardCheck, Activity, Zap, Trophy, Plus,
} from 'lucide-react'
import { CourseEngagementChart, ActivityTrendChart } from '@/components/admin/analytics-charts'

export const dynamic = 'force-dynamic'

const ACTIVITY_LABEL: Record<string, string> = {
  login: 'logged in',
  lesson_completed: 'completed a lesson',
  assignment_submitted: 'submitted an assignment',
  assignment_approved: 'had an assignment approved',
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  // 7-day window anchored to the start of today in IST (00:00 IST six days ago).
  const since7 = istStartOfDayDaysAgo(6)

  const [students, courses, submissions, lessons, progressCount, recentWeek, recentFeed] =
    await Promise.all([
      supabase.from('students').select('id, full_name, xp, streak, status, course_id'),
      supabase.from('courses').select('id, title').order('order_index'),
      supabase.from('submissions').select('id, status'),
      supabase.from('lessons').select('id, course_id'),
      supabase.from('lesson_progress').select('id', { count: 'exact', head: true }),
      supabase.from('activity_log').select('student_id, created_at').gte('created_at', since7.toISOString()),
      supabase
        .from('activity_log')
        .select('id, type, created_at, xp_delta, students (full_name)')
        .order('created_at', { ascending: false })
        .limit(12),
    ])

  const studentList = students.data || []
  const courseList = courses.data || []
  const subs = submissions.data || []
  const lessonRows = lessons.data || []
  const weekActivity = recentWeek.data || []
  const feed = recentFeed.data || []

  const totalStudents = studentList.length
  const activeStudents = studentList.filter(s => s.status === 'active').length
  const totalXp = studentList.reduce((sum, s) => sum + (s.xp || 0), 0)

  // Course completion %: lessons completed vs lessons available to assigned students.
  const lessonsByCourse = new Map<string, number>()
  for (const l of lessonRows) {
    lessonsByCourse.set(l.course_id, (lessonsByCourse.get(l.course_id) || 0) + 1)
  }
  let possible = 0
  for (const s of studentList) {
    if (s.course_id) possible += lessonsByCourse.get(s.course_id) || 0
  }
  const completionPct = possible > 0 ? Math.round(((progressCount.count || 0) / possible) * 100) : 0

  const approved = subs.filter(s => s.status === 'approved').length
  const approvalPct = subs.length > 0 ? Math.round((approved / subs.length) * 100) : 0

  // Daily active users — today and the 7-day trend, bucketed by IST calendar day.
  const todayKey = getISTDateKey()
  const dauToday = new Set(
    weekActivity.filter(a => getISTDateKey(a.created_at) === todayKey).map(a => a.student_id)
  ).size

  const trend: { day: string; users: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = istStartOfDayDaysAgo(i)
    const key = getISTDateKey(d)
    const users = new Set(
      weekActivity.filter(a => getISTDateKey(a.created_at) === key).map(a => a.student_id)
    ).size
    trend.push({ day: formatISTWeekday(d), users })
  }

  const engagement = courseList.map(c => ({
    name: c.title.length > 14 ? c.title.slice(0, 13) + '…' : c.title,
    students: studentList.filter(s => s.course_id === c.id).length,
  }))

  const leaderboard = [...studentList]
    .filter(s => s.status === 'active')
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 8)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 mb-6 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Platform analytics &amp; engagement
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href="/admin/students">Manage Students</Link>
          </Button>
          <Button asChild className="flex-1 sm:flex-none">
            <Link href="/admin/new-course">
              <Plus className="w-4 h-4 mr-2" />
              New Course
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Kpi icon={<Users className="w-5 h-5 text-primary" />} label="Total Students" value={totalStudents} />
        <Kpi icon={<UserCheck className="w-5 h-5 text-green-600" />} label="Active Students" value={activeStudents} />
        <Kpi icon={<Activity className="w-5 h-5 text-blue-500" />} label="Active Today" value={dauToday} />
        <Kpi icon={<BookOpen className="w-5 h-5 text-primary" />} label="Course Completion" value={`${completionPct}%`} />
        <Kpi icon={<ClipboardCheck className="w-5 h-5 text-orange-500" />} label="Approval Rate" value={`${approvalPct}%`} />
        <Kpi icon={<Zap className="w-5 h-5 text-yellow-500" />} label="Total XP" value={totalXp.toLocaleString()} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Active Users</CardTitle>
            <CardDescription>Distinct students active each day (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTrendChart data={trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Students per Course</CardTitle>
            <CardDescription>Enrollment across all courses</CardDescription>
          </CardHeader>
          <CardContent>
            <CourseEngagementChart data={engagement} />
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Highest XP across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-sm border-b border-border last:border-0 py-2"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0
                            ? 'bg-yellow-500/20 text-yellow-600'
                            : i === 1
                              ? 'bg-slate-400/20 text-slate-500'
                              : i === 2
                                ? 'bg-orange-500/20 text-orange-600'
                                : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <Link
                        href={`/admin/students/${s.id}`}
                        className="hover:underline"
                      >
                        {s.full_name || 'Unnamed student'}
                      </Link>
                    </span>
                    <span className="flex items-center gap-3 text-muted-foreground">
                      <span>🔥 {s.streak}d</span>
                      <span className="font-semibold text-foreground">{s.xp} XP</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No students yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest student actions</CardDescription>
          </CardHeader>
          <CardContent>
            {feed.length > 0 ? (
              <div className="space-y-2">
                {feed.map((a: any) => (
                  <div
                    key={a.id}
                    className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3 text-sm border-b border-border last:border-0 py-2"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">
                        {a.students?.full_name || 'A student'}
                      </span>{' '}
                      <span className="text-muted-foreground">
                        {ACTIVITY_LABEL[a.type] || a.type}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatISTShortDateTimeNoPad(a.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Kpi({
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
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl sm:text-2xl font-bold truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
