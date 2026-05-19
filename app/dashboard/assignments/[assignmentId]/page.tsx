import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Clock, AlertCircle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import SubmissionForm from '@/components/dashboard/submission-form'
import { format } from 'date-fns'

interface PageProps {
  params: Promise<{ assignmentId: string }>
}

export default async function AssignmentDetailPage({ params }: PageProps) {
  const { assignmentId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: assignment } = await supabase
    .from('assignments')
    .select(
      `
      id, title, description, instructions, due_date, points_possible, course_id,
      courses ( id, title )
    `
    )
    .eq('id', assignmentId)
    .maybeSingle()

  if (!assignment) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Assignment Not Available</CardTitle>
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

  const course: any = assignment.courses

  const { data: submission } = await supabase
    .from('submissions')
    .select('id, content, link_url, status, points_earned, feedback, submitted_at, graded_at')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .maybeSingle()

  const status = submission?.status as string | undefined
  const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
  const isOverdue = dueDate && new Date() > dueDate && !submission

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={`/dashboard/courses/${assignment.course_id}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{assignment.title}</h1>
        <p className="text-muted-foreground mt-2">{course?.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{assignment.description}</p>
              </div>
              {assignment.instructions && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Instructions</p>
                  <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap text-foreground">
                    {assignment.instructions}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approved */}
          {status === 'approved' && submission && (
            <Card className="border-green-600/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {submission.points_earned != null && (
                  <p className="font-medium">
                    Grade: {submission.points_earned}/{assignment.points_possible} points
                  </p>
                )}
                {submission.feedback && (
                  <div>
                    <p className="text-muted-foreground mb-1">Feedback</p>
                    <p>{submission.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submitted — awaiting review */}
          {status === 'submitted' && submission && (
            <Card className="border-blue-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Clock className="w-5 h-5" />
                  Submitted — awaiting review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Submitted {format(new Date(submission.submitted_at), 'MMM dd, yyyy')}
                </p>
                {submission.link_url && (
                  <a
                    href={submission.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    {submission.link_url}
                  </a>
                )}
                {submission.content && (
                  <div className="bg-muted p-3 rounded whitespace-pre-wrap">
                    {submission.content}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rejected — show feedback + resubmit form */}
          {status === 'rejected' && submission && (
            <>
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <XCircle className="w-5 h-5" />
                    Changes Requested
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {submission.feedback ? (
                    <div>
                      <p className="text-muted-foreground mb-1">Reviewer feedback</p>
                      <p>{submission.feedback}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Please review your work and resubmit.
                    </p>
                  )}
                </CardContent>
              </Card>
              <SubmissionForm
                assignmentId={assignmentId}
                existing={{
                  id: submission.id,
                  content: submission.content,
                  link_url: submission.link_url,
                }}
              />
            </>
          )}

          {/* No submission yet */}
          {!submission && <SubmissionForm assignmentId={assignmentId} />}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Points</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{assignment.points_possible}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Points</p>
            </CardContent>
          </Card>

          {dueDate && (
            <Card className={isOverdue ? 'border-destructive/50' : ''}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Due Date
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">{format(dueDate, 'MMM dd, yyyy')}</p>
                <p className="text-xs text-muted-foreground">{format(dueDate, 'hh:mm a')}</p>
                {isOverdue && (
                  <div className="mt-4 flex items-start gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>This assignment is overdue</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
