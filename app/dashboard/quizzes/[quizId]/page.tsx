import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import QuizTaker from '@/components/dashboard/quiz-taker'

interface PageProps {
  params: Promise<{ quizId: string }>
}

export default async function TakeQuizPage({ params }: PageProps) {
  const { quizId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // RLS limits this to published quizzes in the student's own course.
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, description, xp_reward, questions, course_id')
    .eq('id', quizId)
    .maybeSingle()

  if (!quiz) {
    return (
      <div className="p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Quiz Not Available</CardTitle>
            <CardDescription>This quiz isn&apos;t part of your course.</CardDescription>
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

  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('score, total, completed_at')
    .eq('quiz_id', quizId)
    .eq('student_id', user.id)
    .maybeSingle()

  // Strip the answer key before anything reaches the browser.
  const rawQuestions: any[] = Array.isArray(quiz.questions) ? quiz.questions : []
  const safeQuestions = rawQuestions.map((q: any) => ({
    question: q.question,
    options: q.options,
  }))

  return (
    <div className="p-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href={`/dashboard/courses/${quiz.course_id}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-muted-foreground mt-2">{quiz.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {safeQuestions.length} question{safeQuestions.length !== 1 ? 's' : ''} · up to{' '}
          {quiz.xp_reward} XP
        </p>
      </div>

      <div className="max-w-2xl">
        {attempt ? (
          <Card className="border-green-600/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                Already Completed
              </CardTitle>
              <CardDescription>You have already taken this quiz.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {attempt.score} / {attempt.total}
              </p>
              <Button asChild className="mt-4">
                <Link href={`/dashboard/courses/${quiz.course_id}`}>Back to Course</Link>
              </Button>
            </CardContent>
          </Card>
        ) : safeQuestions.length > 0 ? (
          <QuizTaker quizId={quiz.id} questions={safeQuestions} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Quiz Not Ready</CardTitle>
              <CardDescription>This quiz has no questions yet.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}
