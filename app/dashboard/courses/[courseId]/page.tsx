import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { CheckCircle, Clock, FileText, HelpCircle } from 'lucide-react'
import ModuleAccordion from '@/components/dashboard/module-accordion'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // RLS guarantees a student can only read their single assigned course.
  const { data: course } = await supabase
    .from('courses')
    .select(
      `
      id, title, description, duration_weeks,
      modules ( id, title, order_index ),
      lessons (
        id, title, description, is_published, order_index, module_id,
        lesson_resources ( id, title, resource_type, file_url )
      ),
      assignments ( id, title, description, due_date, is_published ),
      quizzes ( id, title, description )
    `
    )
    .eq('id', courseId)
    .maybeSingle()

  if (!course) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Course Not Available</CardTitle>
            <CardDescription>
              This course is not the one assigned to you, so you don&apos;t have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [{ data: attempts }, { data: submissions }] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select('quiz_id, score, total')
      .eq('student_id', user.id),
    supabase
      .from('submissions')
      .select('assignment_id, status, points_earned')
      .eq('student_id', user.id),
  ])

  const attemptMap = new Map((attempts || []).map((a: any) => [a.quiz_id, a]))
  const submissionMap = new Map(
    (submissions || []).map((s: any) => [s.assignment_id, s])
  )

  const lessons = (course.lessons || []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  )
  const modules = (course.modules || []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  )
  const assignments = course.assignments || []
  const quizzes = course.quizzes || []

  // Group lessons by module (module-less lessons go in their own group).
  const groups: { id: string; title: string | null; lessons: any[] }[] = []
  for (const m of modules) {
    const ls = lessons.filter((l: any) => l.module_id === m.id)
    if (ls.length) groups.push({ id: m.id, title: m.title, lessons: ls })
  }
  const ungrouped = lessons.filter(
    (l: any) => !l.module_id || !modules.some((m: any) => m.id === l.module_id)
  )
  if (ungrouped.length) {
    groups.push({
      id: 'ungrouped',
      title: modules.length ? 'Other Lessons' : null,
      lessons: ungrouped,
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
        <p className="text-muted-foreground mt-2">{course.description}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat icon={<Clock className="w-5 h-5 text-primary" />} label="Duration" value={`${course.duration_weeks || 8} wks`} />
        <Stat icon={<FileText className="w-5 h-5 text-primary" />} label="Lessons" value={lessons.length} />
        <Stat icon={<CheckCircle className="w-5 h-5 text-primary" />} label="Assignments" value={assignments.length} />
        <Stat icon={<HelpCircle className="w-5 h-5 text-primary" />} label="Quizzes" value={quizzes.length} />
      </div>

      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-4">
          {modules.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Lessons are organised into {modules.length} module
              {modules.length !== 1 ? 's' : ''} — click a module to see its lessons.
            </p>
          )}
          {groups.length > 0 ? (
            <ModuleAccordion groups={groups} courseId={courseId} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Lessons Yet</CardTitle>
                <CardDescription>Lessons will appear here once published.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          {assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment: any) => {
                const sub = submissionMap.get(assignment.id)
                return (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="line-clamp-1">{assignment.title}</CardTitle>
                        <AssignmentStatusBadge status={sub?.status} />
                      </div>
                      <CardDescription className="line-clamp-2">
                        {assignment.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {sub?.status === 'approved' && sub.points_earned != null && (
                        <p className="text-sm font-medium text-green-600">
                          Graded — {sub.points_earned} point{sub.points_earned !== 1 ? 's' : ''}
                        </p>
                      )}
                      <Button asChild>
                        <Link href={`/dashboard/assignments/${assignment.id}`}>
                          {sub ? 'View Submission & Feedback' : 'View Assignment'}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Assignments Yet</CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quizzes">
          {quizzes.length > 0 ? (
            <div className="space-y-4">
              {quizzes.map((quiz: any) => {
                const done = attemptMap.get(quiz.id)
                return (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{quiz.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {quiz.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {done ? (
                        <>
                          <p className="text-sm font-medium text-green-600">
                            ✓ Completed — scored {done.score}/{done.total}
                            {done.total > 0 &&
                              ` (${Math.round((done.score / done.total) * 100)}%)`}
                          </p>
                          <Button asChild variant="outline">
                            <Link href={`/dashboard/quizzes/${quiz.id}`}>
                              View Results & Answers
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <Button asChild>
                          <Link href={`/dashboard/quizzes/${quiz.id}`}>Take Quiz</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Quizzes Yet</CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AssignmentStatusBadge({ status }: { status?: string }) {
  if (status === 'approved') {
    return <Badge className="bg-green-600 shrink-0">Approved</Badge>
  }
  if (status === 'submitted') {
    return (
      <Badge className="bg-blue-500 shrink-0">Awaiting review</Badge>
    )
  }
  if (status === 'rejected') {
    return <Badge variant="destructive" className="shrink-0">Changes requested</Badge>
  }
  return (
    <Badge variant="outline" className="shrink-0 text-muted-foreground">
      Not submitted
    </Badge>
  )
}

function Stat({
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
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
