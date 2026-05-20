import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trophy, BarChart3 } from 'lucide-react'
import LessonManager from '@/components/dashboard/lesson-manager'
import AssignmentManager from '@/components/dashboard/assignment-manager'
import CourseSettingsForm from '@/components/admin/course-settings-form'
import ModuleManager from '@/components/admin/module-manager'
import ScheduleManager from '@/components/admin/schedule-manager'
import LeaderboardTable from '@/components/leaderboard-table'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export default async function CourseEditorPage({ params }: PageProps) {
  const { courseId } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select(
      `
      id, title, description, duration_weeks,
      modules ( id, title, order_index ),
      lessons ( id, title, is_published, order_index, module_id ),
      assignments ( id, title, is_published, order_index ),
      quizzes ( id, title, is_published ),
      students ( id, full_name, email, xp, streak )
    `
    )
    .eq('id', courseId)
    .maybeSingle()

  if (!course) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/admin/courses">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </Button>
        <p>Course not found.</p>
      </div>
    )
  }

  // Course-wide schedule events (admin-created — owner_student_id is null).
  const { data: scheduleEvents } = await supabase
    .from('calendar_events')
    .select('id, title, description, event_type, starts_at, ends_at')
    .eq('course_id', courseId)
    .is('owner_student_id', null)
    .order('starts_at', { ascending: true })

  const modules = course.modules?.sort((a: any, b: any) => a.order_index - b.order_index) || []
  const lessons = course.lessons?.sort((a, b) => a.order_index - b.order_index) || []
  const assignments = course.assignments?.sort((a, b) => a.order_index - b.order_index) || []
  const quizzes = course.quizzes || []
  const students = course.students || []
  const leaderboard = [...students].sort(
    (a: any, b: any) => (b.xp ?? 0) - (a.xp ?? 0) || (b.streak ?? 0) - (a.streak ?? 0)
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-4 sm:mb-6">
        <Link href="/admin/courses">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Link>
      </Button>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
          {course.title}
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          {course.description || 'No description'}
        </p>
      </div>

      <Tabs defaultValue="lessons" className="space-y-4 sm:space-y-6">
        <div className="-mx-4 sm:mx-0 overflow-x-auto px-4 sm:px-0">
          <TabsList className="w-max">
            <TabsTrigger value="lessons">Lessons ({lessons.length})</TabsTrigger>
            <TabsTrigger value="assignments">Assignments ({assignments.length})</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes ({quizzes.length})</TabsTrigger>
            <TabsTrigger value="modules">Modules ({modules.length})</TabsTrigger>
            <TabsTrigger value="schedule">Schedule ({scheduleEvents?.length || 0})</TabsTrigger>
            <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lessons">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button asChild>
                <Link href={`/admin/courses/${courseId}/new-lesson`}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Lesson
                </Link>
              </Button>
            </div>
            <LessonManager courseId={courseId} lessons={lessons} />
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button asChild>
                <Link href={`/admin/courses/${courseId}/new-assignment`}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Assignment
                </Link>
              </Button>
            </div>
            <AssignmentManager courseId={courseId} assignments={assignments} />
          </div>
        </TabsContent>

        <TabsContent value="quizzes">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button asChild>
                <Link href={`/admin/courses/${courseId}/new-quiz`}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Quiz
                </Link>
              </Button>
            </div>
            {quizzes.length > 0 ? (
              <div className="space-y-3">
                {quizzes.map((q: any) => (
                  <Card key={q.id}>
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium break-words">{q.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {q.is_published ? 'Published' : 'Draft'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
                          <Link href={`/admin/quizzes/${q.id}/results`}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Results
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
                          <Link href={`/admin/quizzes/${q.id}`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Quizzes Yet</CardTitle>
                  <CardDescription>
                    Create a multiple-choice quiz — students earn XP for their score.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <ModuleManager courseId={courseId} modules={modules} lessons={lessons} />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleManager courseId={courseId} events={scheduleEvents || []} />
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students in this Course</CardTitle>
              <CardDescription>
                {students.length} student{students.length !== 1 ? 's' : ''} assigned · assign
                more from the{' '}
                <Link href="/admin/students" className="text-primary hover:underline">
                  Students
                </Link>{' '}
                page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <div className="space-y-3">
                  {students.map((student: any) => (
                    <div
                      key={student.id}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {student.full_name || 'Unnamed student'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                      </div>
                      <Button asChild variant="outline" size="sm" className="self-start sm:self-auto shrink-0">
                        <Link href={`/admin/students/${student.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No students assigned to this course yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Student Leaderboard
              </CardTitle>
              <CardDescription>
                Students in this course ranked by XP — the same ranking students see on
                their dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                rows={leaderboard}
                emptyMessage="No students assigned to this course yet."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <CourseSettingsForm
            course={{
              id: course.id,
              title: course.title,
              description: course.description,
              duration_weeks: course.duration_weeks,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
