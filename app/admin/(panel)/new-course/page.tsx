'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewCoursePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    durationWeeks: '8',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Place new courses after any existing ones.
      const { data: existing } = await supabase
        .from('courses')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)

      const nextOrder =
        existing && existing.length > 0 ? existing[0].order_index + 1 : 0

      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: formData.title,
          description: formData.description,
          duration_weeks: parseInt(formData.durationWeeks) || 8,
          order_index: nextOrder,
        })
        .select()

      if (courseError) {
        setError(courseError.message)
        return
      }

      router.push(`/admin/courses/${course[0].id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-4 sm:mb-6">
        <Link href="/admin">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Link>
      </Button>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create New Course</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Add a new course to the platform. You can assign students to it afterwards.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Provide basic information about your course</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCourse} className="space-y-6">
            <div>
              <label htmlFor="title" className="text-sm font-medium mb-2 block">
                Course Title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., React Fundamentals"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-medium mb-2 block">
                Course Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what students will learn in this course..."
                value={formData.description}
                onChange={handleChange}
                className="min-h-32"
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
                value={formData.durationWeeks}
                onChange={handleChange}
              />
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Course'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
