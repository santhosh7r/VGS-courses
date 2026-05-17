import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import QuizBuilder from '@/components/admin/quiz-builder'

interface PageProps {
  params: Promise<{ quizId: string }>
}

export default async function EditQuizPage({ params }: PageProps) {
  const { quizId } = await params
  const supabase = await createClient()

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, course_id, title, description, xp_reward, is_published, questions')
    .eq('id', quizId)
    .maybeSingle()

  if (!quiz) {
    return (
      <div className="p-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/admin">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <p>Quiz not found.</p>
      </div>
    )
  }

  return (
    <QuizBuilder
      courseId={quiz.course_id}
      quiz={{
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        xp_reward: quiz.xp_reward,
        is_published: quiz.is_published,
        questions: Array.isArray(quiz.questions) ? quiz.questions : [],
      }}
    />
  )
}
