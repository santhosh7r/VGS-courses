import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatISTDate } from '@/lib/date-utils'

export default function SubmissionList({
  submissions,
  showGrades,
}: {
  submissions: any[]
  assignmentId: string
  showGrades?: boolean
}) {
  return (
    <div className="space-y-4">
      {submissions.length > 0 ? (
        submissions.map((submission: any) => (
          <Card key={submission.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg break-words">
                    {submission.students?.full_name || 'Unnamed student'}
                  </CardTitle>
                  <CardDescription className="break-all">
                    {submission.students?.email}
                  </CardDescription>
                </div>
                <div className="sm:text-right shrink-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Submitted</p>
                  <p className="text-sm font-medium">
                    {formatISTDate(submission.submitted_at)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Submission</p>
                <p className="text-sm line-clamp-3 bg-muted p-3 rounded">
                  {submission.content}
                </p>
              </div>

              {submission.graded_at && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Grade</p>
                  <p className="text-lg font-semibold text-green-600">
                    {submission.points_earned} points
                  </p>
                </div>
              )}

              <Button asChild variant="outline">
                <Link href={`/admin/submissions/${submission.id}`}>
                  {submission.graded_at ? 'View / Re-grade' : 'Grade Submission'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Submissions</CardTitle>
            <CardDescription>
              {showGrades ? 'No graded submissions yet' : 'No submissions yet'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
