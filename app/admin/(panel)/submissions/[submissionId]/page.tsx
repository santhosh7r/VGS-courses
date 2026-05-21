import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { formatISTDateTime } from '@/lib/date-utils'
import GradeForm from '@/components/admin/grade-form'

interface PageProps {
  params: Promise<{ submissionId: string }>
}

export default async function GradeSubmissionPage({ params }: PageProps) {
  const { submissionId } = await params
  const supabase = await createClient()

  const { data: submission } = await supabase
    .from('submissions')
    .select(
      `
      id, content, link_url, submitted_at, points_earned, xp_awarded,
      feedback, graded_at, status, assignment_id,
      assignments ( id, title, points_possible ),
      students ( full_name, email )
    `
    )
    .eq('id', submissionId)
    .maybeSingle()

  if (!submission) {
    return <div className="p-4 sm:p-6 lg:p-8">Submission not found</div>
  }

  const assignment: any = submission.assignments
  const student: any = submission.students

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-4 sm:mb-6">
        <Link href={`/admin/assignments/${submission.assignment_id}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Submissions
        </Link>
      </Button>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Review Submission</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base break-words">
          {assignment?.title} · {student?.full_name || 'Unnamed student'} ({student?.email})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Submitted {formatISTDateTime(submission.submitted_at)}
                {' · '}status: <span className="font-medium">{submission.status}</span>
              </p>

              {submission.link_url && (
                <a
                  href={submission.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline break-all"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  {submission.link_url}
                </a>
              )}

              <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                {submission.content || 'No written notes provided.'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <GradeForm
            submissionId={submission.id}
            pointsPossible={assignment?.points_possible ?? 100}
            currentPoints={submission.points_earned}
            currentXp={submission.xp_awarded ?? 50}
            currentFeedback={submission.feedback}
            currentStatus={submission.status}
          />
        </div>
      </div>
    </div>
  )
}
