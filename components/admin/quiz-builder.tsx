'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Question {
  question: string
  options: string[]
  correct: number
}

interface QuizData {
  id: string
  title: string
  description: string | null
  xp_reward: number
  is_published: boolean
  questions: Question[]
}

const blankQuestion = (): Question => ({ question: '', options: ['', ''], correct: 0 })

/** Build or edit a multiple-choice quiz. */
export default function QuizBuilder({
  courseId,
  quiz,
}: {
  courseId: string
  quiz?: QuizData
}) {
  const supabase = createClient()
  const router = useRouter()
  const isEdit = !!quiz

  const [title, setTitle] = useState(quiz?.title ?? '')
  const [description, setDescription] = useState(quiz?.description ?? '')
  const [xpReward, setXpReward] = useState(String(quiz?.xp_reward ?? 20))
  const [isPublished, setIsPublished] = useState(quiz?.is_published ?? false)
  const [questions, setQuestions] = useState<Question[]>(
    quiz?.questions?.length ? quiz.questions : [blankQuestion()]
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (i: number, patch: Partial<Question>) =>
    setQuestions(qs => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)))

  const setOption = (qi: number, oi: number, value: string) =>
    setQuestions(qs =>
      qs.map((q, idx) =>
        idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q
      )
    )

  const addOption = (qi: number) =>
    setQuestions(qs =>
      qs.map((q, idx) => (idx === qi ? { ...q, options: [...q.options, ''] } : q))
    )

  const removeOption = (qi: number, oi: number) =>
    setQuestions(qs =>
      qs.map((q, idx) => {
        if (idx !== qi || q.options.length <= 2) return q
        const options = q.options.filter((_, j) => j !== oi)
        return { ...q, options, correct: q.correct >= options.length ? 0 : q.correct }
      })
    )

  const save = async () => {
    setError(null)

    const cleaned = questions.map(q => ({
      question: q.question.trim(),
      options: q.options.map(o => o.trim()).filter(Boolean),
      correct: q.correct,
    }))
    if (!title.trim()) {
      setError('Give the quiz a title.')
      return
    }
    for (const [i, q] of cleaned.entries()) {
      if (!q.question || q.options.length < 2) {
        setError(`Question ${i + 1}: add the question text and at least 2 options.`)
        return
      }
      if (q.correct >= q.options.length) {
        setError(`Question ${i + 1}: choose which option is correct.`)
        return
      }
    }

    setBusy(true)
    const payload = {
      course_id: courseId,
      title: title.trim(),
      description: description || null,
      xp_reward: parseInt(xpReward) || 0,
      is_published: isPublished,
      questions: cleaned,
    }

    const { error: saveError } = isEdit
      ? await supabase.from('quizzes').update(payload).eq('id', quiz!.id)
      : await supabase.from('quizzes').insert(payload)

    setBusy(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    router.push(`/admin/courses/${courseId}`)
    router.refresh()
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {isEdit ? 'Edit Quiz' : 'Create Quiz'}
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Multiple-choice quiz — students earn XP based on their score.
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-20"
              />
            </div>
            <div className="max-w-xs">
              <label className="text-sm font-medium mb-2 block">XP Reward (full score)</label>
              <Input
                type="number"
                min="0"
                value={xpReward}
                onChange={(e) => setXpReward(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4"
              />
              Published (visible to students)
            </label>
          </CardContent>
        </Card>

        {questions.map((q, qi) => (
          <Card key={qi}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Question {qi + 1}</CardTitle>
              {questions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuestions(qs => qs.filter((_, i) => i !== qi))}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Question text"
                value={q.question}
                onChange={(e) => update(qi, { question: e.target.value })}
              />
              <CardDescription>Select the correct answer with the radio button</CardDescription>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correct === oi}
                    onChange={() => update(qi, { correct: oi })}
                    className="h-4 w-4 shrink-0"
                  />
                  <Input
                    placeholder={`Option ${oi + 1}`}
                    value={opt}
                    onChange={(e) => setOption(qi, oi, e.target.value)}
                  />
                  {q.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(qi, oi)}
                      title="Remove option"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addOption(qi)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={() => setQuestions(qs => [...qs, blankQuestion()])}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button onClick={save} disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save Quiz' : 'Create Quiz'}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/courses/${courseId}`}>Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
