'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// ISO timestamp -> value for a <input type="datetime-local"> (local time).
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export default function EditAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.assignmentId as string
  const supabase = createClient()

  const [loadingData, setLoadingData] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [courseId, setCourseId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    pointsPossible: '100',
    dueDate: '',
    isPublished: false,
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('assignments')
        .select(
          'title, description, instructions, points_possible, due_date, is_published, course_id'
        )
        .eq('id', assignmentId)
        .maybeSingle()

      if (!data) {
        setNotFound(true)
      } else {
        setCourseId(data.course_id)
        setFormData({
          title: data.title ?? '',
          description: data.description ?? '',
          instructions: data.instructions ?? '',
          pointsPossible: String(data.points_possible ?? 100),
          dueDate: toLocalInput(data.due_date),
          isPublished: data.is_published ?? false,
        })
      }
      setLoadingData(false)
    }
    load()
  }, [supabase, assignmentId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          points_possible: parseInt(formData.pointsPossible) || 100,
          due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          is_published: formData.isPublished,
        })
        .eq('id', assignmentId)

      if (updateError) {
        setError(updateError.message)
        return
      }
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="p-4 sm:p-6 lg:p-8 text-muted-foreground">Loading assignment…</div>
  }

  if (notFound) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/admin">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </Button>
        <p>Assignment not found.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-4 sm:mb-6">
        <Link href={`/admin/courses/${courseId}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>
      </Button>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Edit Assignment</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Update this assignment&apos;s details
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>Changes are saved when you click Save</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="title" className="text-sm font-medium mb-2 block">
                Assignment Title
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
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
                value={formData.description}
                onChange={handleChange}
                className="min-h-20"
              />
            </div>

            <div>
              <label htmlFor="instructions" className="text-sm font-medium mb-2 block">
                Instructions
              </label>
              <Textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                className="min-h-64 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="pointsPossible" className="text-sm font-medium mb-2 block">
                  Points Possible
                </label>
                <Input
                  id="pointsPossible"
                  name="pointsPossible"
                  type="number"
                  min="1"
                  value={formData.pointsPossible}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="dueDate" className="text-sm font-medium mb-2 block">
                  Due Date (Optional)
                </label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, isPublished: e.target.checked }))
                }
                className="h-4 w-4"
              />
              Published (visible to students)
            </label>

            {error && <div className="text-sm text-destructive">{error}</div>}
            {saved && <div className="text-sm text-green-600">Saved ✓</div>}

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
                <Link href={`/admin/courses/${courseId}`}>Back to Course</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
