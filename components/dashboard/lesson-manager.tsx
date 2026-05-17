'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit, Eye, EyeOff, Trash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface Lesson {
  id: string
  title: string
  is_published: boolean
  order_index: number
}

export default function LessonManager({
  lessons: initialLessons,
}: {
  courseId: string
  lessons: Lesson[]
}) {
  const supabase = createClient()
  const [lessons, setLessons] = useState(initialLessons)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleTogglePublish = async (lessonId: string, isPublished: boolean) => {
    try {
      await supabase
        .from('lessons')
        .update({ is_published: !isPublished })
        .eq('id', lessonId)

      setLessons(lessons.map(l =>
        l.id === lessonId ? { ...l, is_published: !isPublished } : l
      ))
    } catch (error) {
      console.error('Failed to toggle publish:', error)
    }
  }

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    setDeleting(lessonId)
    try {
      await supabase.from('lessons').delete().eq('id', lessonId)
      setLessons(lessons.filter(l => l.id !== lessonId))
    } catch (error) {
      console.error('Failed to delete lesson:', error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {lessons.length > 0 ? (
        lessons.map((lesson, index) => (
          <Card key={lesson.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">
                  Lesson {index + 1}: {lesson.title}
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  title={lesson.is_published ? 'Unpublish' : 'Publish'}
                  onClick={() => handleTogglePublish(lesson.id, lesson.is_published)}
                >
                  {lesson.is_published ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </Button>
                <Button asChild variant="ghost" size="sm" title="Edit lesson">
                  <Link href={`/admin/lessons/${lesson.id}`}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Delete"
                  onClick={() => handleDelete(lesson.id)}
                  disabled={deleting === lesson.id}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {lesson.is_published ? 'Published — visible to students' : 'Draft — hidden from students'}
              </p>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Lessons Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create your first lesson to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
