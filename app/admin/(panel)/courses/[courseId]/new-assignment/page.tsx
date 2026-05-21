'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { fromISTDateTimeLocalInput } from '@/lib/date-utils'

export default function NewAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    pointsPossible: '100',
    dueDate: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: assignments } = await supabase
        .from('assignments')
        .select('order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: false })
        .limit(1)

      const nextOrder = assignments && assignments.length > 0 ? assignments[0].order_index + 1 : 0

      const { error: assignmentError } = await supabase.from('assignments').insert({
        course_id: courseId,
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        points_possible: parseInt(formData.pointsPossible),
        due_date: fromISTDateTimeLocalInput(formData.dueDate),
        order_index: nextOrder,
      })

      if (assignmentError) {
        setError(assignmentError.message)
        return
      }

      router.push(`/admin/courses/${courseId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create New Assignment</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Add a new assignment to your course
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>Provide assignment information and requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAssignment} className="space-y-6">
            <div>
              <label htmlFor="title" className="text-sm font-medium mb-2 block">
                Assignment Title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Build a Todo App"
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
                placeholder="Brief overview of the assignment..."
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
                placeholder="Detailed instructions for completing the assignment..."
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

            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Creating...' : 'Create Assignment'}
              </Button>
              <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
                <Link href={`/admin/courses/${courseId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
