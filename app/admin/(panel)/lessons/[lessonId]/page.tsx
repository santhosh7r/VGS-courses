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
import LessonResourceManager from '@/components/admin/lesson-resource-manager'
import YouTubeEmbed from '@/components/youtube-embed'

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export default function EditLessonPage() {
  const router = useRouter()
  const params = useParams()
  const lessonId = params.lessonId as string
  const supabase = createClient()

  const [loadingLesson, setLoadingLesson] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [courseId, setCourseId] = useState('')
  const [modules, setModules] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    scheduledAt: '',
    moduleId: '',
    isPublished: false,
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('lessons')
        .select('title, description, content, video_url, scheduled_at, module_id, is_published, course_id')
        .eq('id', lessonId)
        .maybeSingle()

      if (!data) {
        setNotFound(true)
        setLoadingLesson(false)
        return
      }
      setCourseId(data.course_id)
      setFormData({
        title: data.title ?? '',
        description: data.description ?? '',
        content: data.content ?? '',
        videoUrl: data.video_url ?? '',
        scheduledAt: toLocalInput(data.scheduled_at),
        moduleId: data.module_id ?? '',
        isPublished: data.is_published ?? false,
      })

      const [{ data: mods }, { data: res }] = await Promise.all([
        supabase.from('modules').select('id, title, order_index').eq('course_id', data.course_id).order('order_index'),
        supabase.from('lesson_resources').select('id, title, resource_type, file_url').eq('lesson_id', lessonId),
      ])
      setModules(mods || [])
      setResources(res || [])
      setLoadingLesson(false)
    }
    load()
  }, [supabase, lessonId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
        .from('lessons')
        .update({
          title: formData.title,
          description: formData.description,
          content: formData.content,
          video_url: formData.videoUrl || null,
          module_id: formData.moduleId || null,
          scheduled_at: formData.scheduledAt
            ? new Date(formData.scheduledAt).toISOString()
            : null,
          is_published: formData.isPublished,
        })
        .eq('id', lessonId)

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

  if (loadingLesson) {
    return <div className="p-4 sm:p-6 lg:p-8 text-muted-foreground">Loading lesson…</div>
  }

  if (notFound) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/admin/courses">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </Button>
        <p>Lesson not found.</p>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Edit Lesson</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Update this lesson&apos;s content
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Lesson Details</CardTitle>
            <CardDescription>Changes are saved when you click Save</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label htmlFor="title" className="text-sm font-medium mb-2 block">
                  Lesson Title
                </label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="moduleId" className="text-sm font-medium mb-2 block">
                    Module
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
                    Schedule date
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
                  YouTube Video URL
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
                  value={formData.content}
                  onChange={handleChange}
                  className="min-h-96 font-mono"
                />
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

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <LessonResourceManager lessonId={lessonId} resources={resources} />
      </div>
    </div>
  )
}
