import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Lock, BookOpen } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string
  is_published: boolean
  order_index: number
  lesson_resources: any[]
}

export default function LessonList({
  lessons,
  courseId,
}: {
  lessons: Lesson[]
  courseId: string
}) {
  return (
    <div className="space-y-4">
      {lessons.length > 0 ? (
        lessons.map((lesson, index) => (
          <Card key={lesson.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {lesson.is_published ? (
                      <BookOpen className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">
                      Lesson {index + 1}: {lesson.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {lesson.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lesson.lesson_resources && lesson.lesson_resources.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Resources</p>
                  <div className="space-y-2">
                    {lesson.lesson_resources.map((resource: any) => (
                      <a
                        key={resource.id}
                        href={resource.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {resource.title}
                        <span className="text-xs text-muted-foreground">
                          ({resource.resource_type})
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <Button asChild className="w-full">
                <Link href={`/dashboard/lessons/${lesson.id}`}>
                  {lesson.is_published ? 'Open Lesson' : 'Lesson Coming Soon'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Lessons Yet</CardTitle>
            <CardDescription>Lessons will be added soon</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
