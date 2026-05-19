import { createClient } from '@/lib/supabase/server'
import ExecutionScore from '@/components/execution-score'
import { computeExecutionScore } from '@/lib/execution-score'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Zap, Flame, Trophy, BookOpen, Award, ArrowRight, Target, ClipboardList,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select(
      `
      full_name, xp, streak, longest_streak, course_id,
      courses (
        id, title, description,
        lessons ( id, title, order_index, is_published ),
        assignments ( id, title, due_date, is_published )
      )
    `
    )
    .eq('id', user.id)
    .maybeSingle()

  const course: any = student?.courses ?? null
  const firstName = (student?.full_name || '').split(' ')[0] || 'there'
  const xp = student?.xp ?? 0

  if (!course) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome, {firstName}!</h1>
        <Card className="max-w-2xl mt-6">
          <CardHeader>
            <CardTitle>No Course Assigned Yet</CardTitle>
            <CardDescription>
              An administrator will assign you to a course soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Once assigned, your lessons, assignments and progress will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [{ data: progress }, { data: earned }, { data: achievements }, leaderboardRes, { data: submissions }] =
    await Promise.all([
      supabase.from('lesson_progress').select('lesson_id').eq('student_id', user.id),
      supabase
        .from('student_achievements')
        .select('achievement_id, achievements (title, description)')
        .eq('student_id', user.id),
      supabase.from('achievements').select('title, xp_threshold').order('xp_threshold'),
      supabase.rpc('course_leaderboard'),
      supabase.from('submissions').select('assignment_id, status').eq('student_id', user.id),
    ])

  const lessons = (course.lessons || [])
    .filter((l: any) => l.is_published)
    .sort((a: any, b: any) => a.order_index - b.order_index)
  const assignments = (course.assignments || []).filter((a: any) => a.is_published)
  const doneIds = new Set((progress || []).map((p: any) => p.lesson_id))
  const lessonsDone = lessons.filter((l: any) => doneIds.has(l.id)).length
  const completionPct = lessons.length > 0 ? Math.round((lessonsDone / lessons.length) * 100) : 0
  const nextLesson = lessons.find((l: any) => !doneIds.has(l.id)) || null

  // Execution Score™ — the signature consistency metric.
  const approvedCount = (submissions || []).filter((s: any) => s.status === 'approved').length
  const assignmentRate = assignments.length > 0 ? approvedCount / assignments.length : 1
  const streakMomentum = Math.min((student?.streak ?? 0) / 14, 1) * 100
  const executionScore = computeExecutionScore({
    completionPct,
    assignmentRate,
    streak: student?.streak ?? 0,
  })

  const subByAssignment = new Map((submissions || []).map((s: any) => [s.assignment_id, s.status]))
  const pendingAssignments = assignments.filter(
    (a: any) => subByAssignment.get(a.id) !== 'approved'
  )

  const leaderboard: any[] = leaderboardRes.data || []
  const myRank = leaderboard.findIndex(r => r.student_id === user.id) + 1

  // Next badge to chase.
  const nextBadge = (achievements || []).find((a: any) => (a.xp_threshold ?? 0) > xp)
  const prevThreshold =
    [...(achievements || [])].reverse().find((a: any) => (a.xp_threshold ?? 0) <= xp)
      ?.xp_threshold ?? 0
  const badgePct = nextBadge
    ? Math.round(((xp - prevThreshold) / (nextBadge.xp_threshold - prevThreshold)) * 100)
    : 100

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground mt-1">{course.title}</p>
      </div>

      <ExecutionScore
        score={executionScore}
        factors={[
          { label: 'Lesson completion', value: completionPct },
          { label: 'Assignment performance', value: assignmentRate * 100 },
          { label: 'Streak momentum', value: streakMomentum },
        ]}
      />

      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-linear-to-br from-yellow-500/10 to-transparent">
          <CardContent className="pt-6">
            <Zap className="w-6 h-6 text-yellow-500 mb-2" />
            <p className="text-3xl font-bold">{xp}</p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-orange-500/10 to-transparent">
          <CardContent className="pt-6">
            <Flame className="w-6 h-6 text-orange-500 mb-2" />
            <p className="text-3xl font-bold">{student?.streak ?? 0} days</p>
            <p className="text-xs text-muted-foreground">
              Current streak · best {student?.longest_streak ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-primary/10 to-transparent">
          <CardContent className="pt-6">
            <Target className="w-6 h-6 text-primary mb-2" />
            <p className="text-3xl font-bold">{completionPct}%</p>
            <p className="text-xs text-muted-foreground">Course complete</p>
          </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-blue-500/10 to-transparent">
          <CardContent className="pt-6">
            <Trophy className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-3xl font-bold">{myRank > 0 ? `#${myRank}` : '—'}</p>
            <p className="text-xs text-muted-foreground">Course rank</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue learning */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Continue Learning</CardTitle>
              <CardDescription>
                {lessonsDone} of {lessons.length} lessons complete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={completionPct} />
              {nextLesson ? (
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Up next</p>
                      <p className="font-medium">{nextLesson.title}</p>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/lessons/${nextLesson.id}`}>
                      Start <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-green-600">
                  🎉 You&apos;ve completed every lesson in this course!
                </p>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link href={`/dashboard/courses/${course.id}`}>Go to Course</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pending assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Pending Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingAssignments.length > 0 ? (
                <div className="space-y-2">
                  {pendingAssignments.map((a: any) => {
                    const status = subByAssignment.get(a.id)
                    return (
                      <Link
                        key={a.id}
                        href={`/dashboard/assignments/${a.id}`}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{a.title}</p>
                          {a.due_date && (
                            <p className="text-xs text-muted-foreground">
                              Due {format(new Date(a.due_date), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs uppercase px-2 py-0.5 rounded ${
                            status === 'rejected'
                              ? 'bg-destructive/15 text-destructive'
                              : status === 'submitted'
                                ? 'bg-blue-500/15 text-blue-600'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {status || 'not started'}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-green-600">All assignments are up to date 🎉</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next badge */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Next Badge
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextBadge ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{nextBadge.title}</p>
                  <Progress value={badgePct} />
                  <p className="text-xs text-muted-foreground">
                    {xp} / {nextBadge.xp_threshold} XP
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You&apos;ve earned every badge. Legend! 👑
                </p>
              )}
            </CardContent>
          </Card>

          {/* Earned badges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Badges ({earned?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {earned && earned.length > 0 ? (
                <div className="space-y-2">
                  {earned.map((e: any) => (
                    <div key={e.achievement_id} className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-yellow-500 shrink-0" />
                      <span>{e.achievements?.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No badges yet — earn XP to unlock them.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((r, i) => (
                  <div
                    key={r.student_id}
                    className={`flex items-center justify-between text-sm py-1 ${
                      r.student_id === user.id ? 'font-semibold text-primary' : ''
                    }`}
                  >
                    <span>
                      {i + 1}. {r.full_name || 'Student'}
                      {r.student_id === user.id ? ' (you)' : ''}
                    </span>
                    <span>{r.xp} XP</span>
                  </div>
                ))}
              </div>
              <Button asChild variant="ghost" size="sm" className="w-full mt-3">
                <Link href="/dashboard/leaderboard">View full leaderboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
