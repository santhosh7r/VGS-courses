'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/**
 * Edit / delete a course. Deleting a course also removes its lessons and
 * assignments, and unassigns any students who were on it.
 */
export default function CourseSettingsForm({
  course,
}: {
  course: { id: string; title: string; description: string | null; duration_weeks: number }
}) {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({
    title: course.title,
    description: course.description ?? '',
    durationWeeks: String(course.duration_weeks),
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          title: form.title,
          description: form.description,
          duration_weeks: parseInt(form.durationWeeks) || 8,
        })
        .eq('id', course.id)

      if (updateError) {
        setError(updateError.message)
        return
      }
      setSaved(true)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        'Delete this course? Its lessons and assignments will be deleted and any students on it will be unassigned. This cannot be undone.'
      )
    ) {
      return
    }
    setError(null)
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id)

      if (deleteError) {
        setError(deleteError.message)
        setDeleting(false)
        return
      }
      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Course Settings</CardTitle>
          <CardDescription>Edit the course details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="title" className="text-sm font-medium mb-2 block">
                Course Title
              </label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="text-sm font-medium mb-2 block">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                className="min-h-28"
              />
            </div>
            <div className="max-w-xs">
              <label htmlFor="durationWeeks" className="text-sm font-medium mb-2 block">
                Duration (weeks)
              </label>
              <Input
                id="durationWeeks"
                name="durationWeeks"
                type="number"
                min="1"
                max="52"
                value={form.durationWeeks}
                onChange={handleChange}
              />
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}
            {saved && <div className="text-sm text-green-600">Saved ✓</div>}

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Permanently delete this course and all its content</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Course'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
