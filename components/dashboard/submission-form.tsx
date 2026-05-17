'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ExistingSubmission {
  id: string
  content: string | null
  link_url: string | null
}

/**
 * Submit work for an assignment — or resubmit a rejected one.
 * A submission may include written notes and/or a link (repo, doc, deployed app).
 */
export default function SubmissionForm({
  assignmentId,
  existing,
}: {
  assignmentId: string
  existing?: ExistingSubmission
}) {
  const supabase = createClient()
  const router = useRouter()
  const isResubmit = !!existing
  const [content, setContent] = useState(existing?.content ?? '')
  const [linkUrl, setLinkUrl] = useState(existing?.link_url ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!content.trim() && !linkUrl.trim()) {
      setError('Add some notes or a link before submitting.')
      return
    }
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in.')
        return
      }

      let submitError = null
      if (isResubmit) {
        const { error } = await supabase
          .from('submissions')
          .update({
            content,
            link_url: linkUrl || null,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            graded_at: null,
          })
          .eq('id', existing!.id)
        submitError = error
      } else {
        const { error } = await supabase.from('submissions').insert({
          assignment_id: assignmentId,
          student_id: user.id,
          content,
          link_url: linkUrl || null,
        })
        submitError = error
      }

      if (submitError) {
        setError(submitError.message)
        return
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isResubmit ? 'Resubmit Your Work' : 'Submit Your Work'}</CardTitle>
        <CardDescription>
          {isResubmit
            ? 'Address the feedback below and resubmit for review.'
            : 'Share your solution as written notes and/or a link.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="link" className="text-sm font-medium mb-2 block">
              Link (GitHub repo, deployed app, document…)
            </label>
            <Input
              id="link"
              type="url"
              placeholder="https://github.com/you/project"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="content" className="text-sm font-medium mb-2 block">
              Notes / Explanation
            </label>
            <Textarea
              id="content"
              placeholder="Describe your work, your approach, anything the reviewer should know…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-48"
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? 'Submitting…'
              : isResubmit
                ? 'Resubmit Assignment'
                : 'Submit Assignment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
