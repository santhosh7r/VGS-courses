import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import QuizResults from '@/components/admin/quiz-results'

interface PageProps {
  params: Promise<{ quizId: string }>
}

export default async function QuizResultsPage({ params }: PageProps) {
  const { quizId } = await params
  const supabase = await createClient()

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, course_id, title, description, questions, is_published')
    .eq('id', quizId)
    .maybeSingle()

  if (!quiz) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/admin/courses">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </Button>
        <p>Quiz not found.</p>
      </div>
    )
  }

  const [{ data: attempts }, { count: totalStudents }] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select('id, score, total, answers, completed_at, students ( full_name, email )')
      .eq('quiz_id', quizId)
      .order('completed_at', { ascending: false }),
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', quiz.course_id),
  ])

  const questions = Array.isArray(quiz.questions) ? quiz.questions : []
  const rows = (attempts || []).map((a: any) => ({
    id: a.id,
    student_name: a.students?.full_name || 'Unnamed student',
    student_email: a.students?.email || '',
    answers: Array.isArray(a.answers) ? a.answers : [],
    score: a.score,
    total: a.total,
    completed_at: a.completed_at,
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Button asChild variant="ghost" className="mb-4 sm:mb-6">
        <Link href={`/admin/courses/${quiz.course_id}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>
      </Button>

      <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
            {quiz.title}
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Quiz results · {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/admin/quizzes/${quiz.id}`}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit Quiz
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Results</CardTitle>
          <CardDescription>
            Every student attempt — expand a row to see exactly what they answered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuizResults
            questions={questions}
            attempts={rows}
            totalStudents={totalStudents || 0}
          />
        </CardContent>
      </Card>
    </div>
  )
}
