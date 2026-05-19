import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Download, Play } from 'lucide-react'
import LessonCompleteButton from '@/components/dashboard/lesson-complete-button'
import YouTubeEmbed from '@/components/youtube-embed'

interface PageProps {
  params: Promise<{ lessonId: string }>
}

export default async function LessonDetailPage({ params }: PageProps) {
  const { lessonId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // RLS limits this to published lessons of the student's own course.
  const { data: lesson } = await supabase
    .from('lessons')
    .select(
      `
      id,
      title,
      description,
      content,
      video_url,
      course_id,
      courses (
        id,
        title
      ),
      lesson_resources (
        id,
        title,
        resource_type,
        file_url,
        created_at
      )
    `
    )
    .eq('id', lessonId)
    .maybeSingle()

  if (!lesson) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Lesson Not Available</CardTitle>
            <CardDescription>
              This lesson isn&apos;t part of your assigned course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: completion } = await supabase
    .from('lesson_progress')
    .select('id')
    .eq('lesson_id', lessonId)
    .eq('student_id', user.id)
    .maybeSingle()

  const course: any = lesson.courses

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={`/dashboard/courses/${lesson.course_id}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{lesson.title}</h1>
        <p className="text-muted-foreground mt-2">{course?.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Video */}
          {lesson.video_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  Lesson Video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <YouTubeEmbed url={lesson.video_url} title={lesson.title} />
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {lesson.content || 'No content available yet.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          {lesson.lesson_resources && lesson.lesson_resources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Learning Resources</CardTitle>
                <CardDescription>
                  {lesson.lesson_resources.length} file
                  {lesson.lesson_resources.length !== 1 ? 's' : ''} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lesson.lesson_resources.map((resource: any) => (
                    <a
                      key={resource.id}
                      href={resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{resource.title}</p>
                        <p className="text-xs text-muted-foreground">{resource.resource_type}</p>
                      </div>
                      <Download className="w-4 h-4 text-primary" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <LessonCompleteButton
                lessonId={lesson.id}
                studentId={user.id}
                completed={!!completion}
              />
              <Button asChild variant="outline" className="w-full">
                <Link href={`/dashboard/courses/${lesson.course_id}`}>
                  Back to Course
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Contact your administrator if you have questions about this lesson.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
