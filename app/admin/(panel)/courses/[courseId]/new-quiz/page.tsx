import QuizBuilder from '@/components/admin/quiz-builder'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export default async function NewQuizPage({ params }: PageProps) {
  const { courseId } = await params
  return <QuizBuilder courseId={courseId} />
}
