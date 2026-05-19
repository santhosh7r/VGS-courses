import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default async function CoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // A student is assigned to exactly one course — fetch that one.
  const { data: student } = await supabase
    .from('students')
    .select(
      `
      course_id,
      courses (
        id,
        title,
        description,
        duration_weeks
      )
    `
    )
    .eq('id', user.id)
    .maybeSingle()

  const course: any = student?.courses ?? null

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Course</h1>
        <p className="text-muted-foreground mt-2">The course you are enrolled in</p>
      </div>

      {course ? (
        <Card className="max-w-md flex flex-col">
          <CardHeader>
            <div className="flex items-start gap-2">
              <BookOpen className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div className="flex-1">
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
            <p className="text-xs text-muted-foreground">
              {course.duration_weeks || 8} weeks
            </p>
          </CardContent>
          <div className="p-6 pt-0">
            <Button asChild className="w-full">
              <Link href={`/dashboard/courses/${course.id}`}>Open Course</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Course Assigned</CardTitle>
            <CardDescription>You don&apos;t have access to a course yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contact your administrator to be assigned to a course.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
