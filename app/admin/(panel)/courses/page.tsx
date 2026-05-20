import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select(
      `
      id,
      title,
      description,
      duration_weeks,
      order_index,
      lessons (id),
      assignments (id),
      students (id)
    `
    )
    .order('order_index', { ascending: true })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 mb-6 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            {courses?.length || 0} course{courses?.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/new-course">
            <Plus className="w-4 h-4 mr-2" />
            New Course
          </Link>
        </Button>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {courses.map((course: any) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-2">
                  <BookOpen className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                </div>
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Lessons</p>
                    <p className="font-semibold text-base">{course.lessons?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Assignments</p>
                    <p className="font-semibold text-base">{course.assignments?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Students</p>
                    <p className="font-semibold text-base">{course.students?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild variant="default" className="w-full">
                  <Link href={`/admin/courses/${course.id}`}>Manage Course</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Courses Yet</CardTitle>
            <CardDescription>Create your first course to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/new-course">Create Course</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
