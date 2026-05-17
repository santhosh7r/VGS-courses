'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit, Eye, EyeOff, FileText, Trash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface Assignment {
  id: string
  title: string
  is_published: boolean
  order_index: number
}

export default function AssignmentManager({
  assignments: initialAssignments,
}: {
  courseId: string
  assignments: Assignment[]
}) {
  const supabase = createClient()
  const [assignments, setAssignments] = useState(initialAssignments)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleTogglePublish = async (assignmentId: string, isPublished: boolean) => {
    try {
      await supabase
        .from('assignments')
        .update({ is_published: !isPublished })
        .eq('id', assignmentId)

      setAssignments(assignments.map(a =>
        a.id === assignmentId ? { ...a, is_published: !isPublished } : a
      ))
    } catch (error) {
      console.error('Failed to toggle publish:', error)
    }
  }

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return

    setDeleting(assignmentId)
    try {
      await supabase.from('assignments').delete().eq('id', assignmentId)
      setAssignments(assignments.filter(a => a.id !== assignmentId))
    } catch (error) {
      console.error('Failed to delete assignment:', error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {assignments.length > 0 ? (
        assignments.map((assignment, index) => (
          <Card key={assignment.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">
                  Assignment {index + 1}: {assignment.title}
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  title={assignment.is_published ? 'Unpublish' : 'Publish'}
                  onClick={() => handleTogglePublish(assignment.id, assignment.is_published)}
                >
                  {assignment.is_published ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </Button>
                <Button asChild variant="ghost" size="sm" title="Edit assignment">
                  <Link href={`/admin/assignments/${assignment.id}/edit`}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" title="View submissions">
                  <Link href={`/admin/assignments/${assignment.id}`}>
                    <FileText className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Delete"
                  onClick={() => handleDelete(assignment.id)}
                  disabled={deleting === assignment.id}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {assignment.is_published
                  ? 'Published — visible to students'
                  : 'Draft — hidden from students'}
              </p>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Assignments Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create your first assignment to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
