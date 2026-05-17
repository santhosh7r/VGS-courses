'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Question {
  question: string
  options: string[]
}

/**
 * Take a multiple-choice quiz. Grading happens server-side via the
 * submit_quiz() function, so the answer key never reaches the browser.
 */
export default function QuizTaker({
  quizId,
  questions,
}: {
  quizId: string
  questions: Question[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ score: number; total: number } | null>(null)

  const allAnswered = questions.every((_, i) => answers[i] !== undefined)

  const submit = async () => {
    setError(null)
    setBusy(true)
    const ordered = questions.map((_, i) => answers[i])
    const { data, error: rpcError } = await supabase.rpc('submit_quiz', {
      p_quiz_id: quizId,
      p_answers: ordered,
    })
    setBusy(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    const row = Array.isArray(data) ? data[0] : data
    setResult({ score: row?.score ?? 0, total: row?.total ?? questions.length })
    router.refresh()
  }

  if (result) {
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0
    return (
      <Card className="border-green-600/50">
        <CardHeader>
          <CardTitle>Quiz Complete 🎉</CardTitle>
          <CardDescription>Your XP has been awarded based on your score.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-3xl font-bold">
            {result.score} / {result.total}{' '}
            <span className="text-lg text-muted-foreground">({pct}%)</span>
          </p>
          <Button onClick={() => router.back()}>Back to Course</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => (
        <Card key={qi}>
          <CardHeader>
            <CardTitle className="text-lg">
              {qi + 1}. {q.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  answers[qi] === oi
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${qi}`}
                  checked={answers[qi] === oi}
                  onChange={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                  className="h-4 w-4"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={busy || !allAnswered} className="w-full">
        {busy ? 'Submitting…' : allAnswered ? 'Submit Quiz' : 'Answer all questions to submit'}
      </Button>
    </div>
  )
}
