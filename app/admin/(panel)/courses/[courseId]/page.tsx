import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil } from 'lucide-react'
import LessonManager from '@/components/dashboard/lesson-manager'
import AssignmentManager from '@/components/dashboard/assignment-manager'
import CourseSettingsForm from '@/components/admin/course-settings-form'
import ModuleManager from '@/components/admin/module-manager'
import ScheduleManager from '@/components/admin/schedule-manager'

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
      lessons ( id, title, is_published, order_index ),
      assignments ( id, title, is_published, order_index ),
      quizzes ( id, title, is_published ),
      students ( id, full_name, email )
    `
    )
    .eq('id', courseId)
    .maybeSingle()

  if (!course) {
    return (
      <div className="p-8">
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

  return (
    <div className="p-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/admin/courses">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
        <p className="text-muted-foreground mt-2">{course.description || 'No description'}</p>
      </div>

      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lessons">Lessons ({lessons.length})</TabsTrigger>
          <TabsTrigger value="assignments">Assignments ({assignments.length})</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes ({quizzes.length})</TabsTrigger>
          <TabsTrigger value="modules">Modules ({modules.length})</TabsTrigger>
          <TabsTrigger value="schedule">Schedule ({scheduleEvents?.length || 0})</TabsTrigger>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

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
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{q.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {q.is_published ? 'Published' : 'Draft'}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/quizzes/${q.id}`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
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
          <ModuleManager courseId={courseId} modules={modules} />
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
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{student.full_name || 'Unnamed student'}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <Button asChild variant="outline" size="sm">
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
