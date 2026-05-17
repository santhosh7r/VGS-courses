'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, XCircle } from 'lucide-react'

/**
 * Review panel for a submission. Approving awards marks + XP (the database
 * trigger credits the XP and notifies the student). Rejecting asks them to
 * fix the feedback and resubmit.
 */
export default function GradeForm({
  submissionId,
  pointsPossible,
  currentPoints,
  currentXp,
  currentFeedback,
  currentStatus,
}: {
  submissionId: string
  pointsPossible: number
  currentPoints: number | null
  currentXp: number
  currentFeedback: string | null
  currentStatus: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [points, setPoints] = useState(currentPoints != null ? String(currentPoints) : '')
  const [xp, setXp] = useState(String(currentXp || 50))
  const [feedback, setFeedback] = useState(currentFeedback ?? '')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const decide = async (decision: 'approved' | 'rejected') => {
    setError(null)

    const score = points === '' ? null : parseInt(points)
    if (score != null && (Number.isNaN(score) || score < 0 || score > pointsPossible)) {
      setError(`Marks must be between 0 and ${pointsPossible}.`)
      return
    }
    const xpValue = decision === 'approved' ? parseInt(xp) || 0 : 0

    setBusy(decision === 'approved' ? 'approve' : 'reject')
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: decision,
        points_earned: score,
        xp_awarded: xpValue,
        feedback: feedback || null,
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
    setBusy(null)

    if (updateError) {
      setError(updateError.message)
      return
    }
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Submission</CardTitle>
        <CardDescription>
          {currentStatus === 'submitted'
            ? 'Awaiting your review'
            : `Current status: ${currentStatus}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="points" className="text-sm font-medium mb-2 block">
            Marks (out of {pointsPossible})
          </label>
          <Input
            id="points"
            type="number"
            min="0"
            max={pointsPossible}
            placeholder={`0 - ${pointsPossible}`}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="xp" className="text-sm font-medium mb-2 block">
            XP reward on approval
          </label>
          <Input
            id="xp"
            type="number"
            min="0"
            value={xp}
            onChange={(e) => setXp(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="feedback" className="text-sm font-medium mb-2 block">
            Feedback
          </label>
          <Textarea
            id="feedback"
            placeholder="Comments for the student…"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-32"
          />
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => decide('approved')}
            disabled={busy !== null}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {busy === 'approve' ? 'Approving…' : 'Approve'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => decide('rejected')}
            disabled={busy !== null}
          >
            <XCircle className="w-4 h-4 mr-2" />
            {busy === 'reject' ? 'Rejecting…' : 'Reject'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Approving credits the XP reward to the student. Rejecting lets them resubmit.
        </p>
      </CardContent>
    </Card>
  )
}
