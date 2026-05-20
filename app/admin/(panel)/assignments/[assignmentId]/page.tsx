import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import SubmissionList from '@/components/dashboard/submission-list'

interface PageProps {
  params: Promise<{ assignmentId: string }>
}

export default async function AssignmentSubmissionsPage({ params }: PageProps) {
  const { assignmentId } = await params
  const supabase = await createClient()

  // Fetch assignment details with every student submission.
  const { data: assignment } = await supabase
    .from('assignments')
    .select(
      `
      id,
      title,
      description,
      due_date,
      points_possible,
      course_id,
      courses (
        id,
        title
      ),
      submissions (
        id,
        student_id,
        content,
        submitted_at,
        points_earned,
        graded_at,
        students (
          id,
          full_name,
          email
        )
      )
    `
    )
    .eq('id', assignmentId)
    .single()

  if (!assignment) {
    return <div className="p-4 sm:p-6 lg:p-8">Assignment not found</div>
  }

  const course: any = assignment.courses
  const submissions = assignment.submissions || []
  const gradedCount = submissions.filter((s: any) => s.graded_at).length
  const submittedCount = submissions.length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-4 sm:mb-6">
        <Link href={`/admin/courses/${assignment.course_id}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>
      </Button>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
          {assignment.title}
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          {course?.title}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Submissions</p>
                <p className="font-semibold">{submittedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Graded</p>
                <p className="font-semibold">{gradedCount}/{submittedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Points</p>
              <p className="font-semibold">{assignment.points_possible}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="submissions" className="space-y-4 sm:space-y-6">
        <TabsList>
          <TabsTrigger value="submissions">Submissions ({submittedCount})</TabsTrigger>
          <TabsTrigger value="grading">Graded ({gradedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <SubmissionList submissions={submissions} assignmentId={assignmentId} />
        </TabsContent>

        <TabsContent value="grading">
          <SubmissionList
            submissions={submissions.filter((s: any) => s.graded_at)}
            assignmentId={assignmentId}
            showGrades={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
