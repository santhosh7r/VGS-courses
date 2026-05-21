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
import YouTubeEmbed from '@/components/youtube-embed'
import { fromISTDateTimeLocalInput } from '@/lib/date-utils'

export default function NewLessonPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modules, setModules] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    scheduledAt: '',
    moduleId: '',
  })

  useEffect(() => {
    supabase
      .from('modules')
      .select('id, title, order_index')
      .eq('course_id', courseId)
      .order('order_index')
      .then(({ data }) => setModules(data || []))
  }, [supabase, courseId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: false })
        .limit(1)

      const nextOrder = lessons && lessons.length > 0 ? lessons[0].order_index + 1 : 0

      const { error: lessonError } = await supabase.from('lessons').insert({
        course_id: courseId,
        title: formData.title,
        description: formData.description,
        content: formData.content,
        video_url: formData.videoUrl || null,
        module_id: formData.moduleId || null,
        scheduled_at: fromISTDateTimeLocalInput(formData.scheduledAt),
        order_index: nextOrder,
      })

      if (lessonError) {
        setError(lessonError.message)
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create New Lesson</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Add a new lesson to your course
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
          <CardDescription>
            Add resources (PDFs, slides) after creating the lesson, from its edit page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateLesson} className="space-y-6">
            <div>
              <label htmlFor="title" className="text-sm font-medium mb-2 block">
                Lesson Title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Introduction to React Hooks"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="moduleId" className="text-sm font-medium mb-2 block">
                  Module (optional)
                </label>
                <select
                  id="moduleId"
                  name="moduleId"
                  value={formData.moduleId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">— No module —</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="scheduledAt" className="text-sm font-medium mb-2 block">
                  Schedule date (optional)
                </label>
                <Input
                  id="scheduledAt"
                  name="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="videoUrl" className="text-sm font-medium mb-2 block">
                YouTube Video URL (optional)
              </label>
              <Input
                id="videoUrl"
                name="videoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=…"
                value={formData.videoUrl}
                onChange={handleChange}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Paste the YouTube link of the recorded class — students watch it as an
                embedded player on the lesson page.
              </p>
              {formData.videoUrl && (
                <div className="mt-3">
                  <YouTubeEmbed url={formData.videoUrl} title={formData.title || 'Lesson video'} />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-medium mb-2 block">
                Short Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief overview of this lesson..."
                value={formData.description}
                onChange={handleChange}
                className="min-h-20"
              />
            </div>

            <div>
              <label htmlFor="content" className="text-sm font-medium mb-2 block">
                Lesson Content
              </label>
              <Textarea
                id="content"
                name="content"
                placeholder="Write the main lesson content here."
                value={formData.content}
                onChange={handleChange}
                className="min-h-96 font-mono"
              />
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Creating...' : 'Create Lesson'}
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
