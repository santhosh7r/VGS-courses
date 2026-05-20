'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Pencil } from 'lucide-react'

interface ExistingSubmission {
  id: string
  content: string | null
  link_url: string | null
  submitted_at?: string
}

/**
 * Submit (or edit) work for an assignment. Three modes:
 * - new: no submission yet — form is shown directly
 * - edit: submission exists, awaiting admin review — starts collapsed with an
 *   "Edit submission" button so the read-only summary above stays the focus
 * - resubmit: rejected by admin — same collapsed-by-default flow, with
 *   wording that nudges the student to address the feedback
 */
export default function SubmissionForm({
  assignmentId,
  existing,
  status,
}: {
  assignmentId: string
  existing?: ExistingSubmission
  status?: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const mode: 'new' | 'edit' | 'resubmit' = !existing
    ? 'new'
    : status === 'rejected'
      ? 'resubmit'
      : 'edit'

  // Existing submissions stay collapsed until the student opts in to editing.
  const [editing, setEditing] = useState(mode === 'new')
  const [content, setContent] = useState(existing?.content ?? '')
  const [linkUrl, setLinkUrl] = useState(existing?.link_url ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openEditor = () => {
    setError(null)
    setContent(existing?.content ?? '')
    setLinkUrl(existing?.link_url ?? '')
    setEditing(true)
  }

  const cancelEdit = () => {
    setError(null)
    setContent(existing?.content ?? '')
    setLinkUrl(existing?.link_url ?? '')
    setEditing(false)
  }

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
      if (existing) {
        const { error } = await supabase
          .from('submissions')
          .update({
            content,
            link_url: linkUrl || null,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            graded_at: null,
          })
          .eq('id', existing.id)
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

  const title =
    mode === 'new'
      ? 'Submit Your Work'
      : mode === 'resubmit'
        ? 'Resubmit Your Work'
        : 'Edit Your Submission'
  const description =
    mode === 'new'
      ? 'Share your solution as written notes and/or a link.'
      : mode === 'resubmit'
        ? 'Address the feedback above and resubmit for review.'
        : 'You can keep editing until an admin reviews it.'
  const submitLabel = loading
    ? mode === 'new'
      ? 'Submitting…'
      : 'Saving…'
    : mode === 'new'
      ? 'Submit Assignment'
      : mode === 'resubmit'
        ? 'Resubmit Assignment'
        : 'Save Changes'
  const editButtonLabel = mode === 'resubmit' ? 'Edit & Resubmit' : 'Edit Submission'

  // Collapsed state — existing submission, not in edit mode.
  if (!editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={openEditor} className="w-full sm:w-auto">
            <Pencil className="w-4 h-4 mr-2" />
            {editButtonLabel}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="flex-1" disabled={loading}>
              {submitLabel}
            </Button>
            {mode !== 'new' && (
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                disabled={loading}
                className="sm:flex-none"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
