'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, CheckCircle2, XCircle } from 'lucide-react'
import { formatISTDate } from '@/lib/date-utils'

interface ResultQuestion {
  question: string
  options: string[]
  correct: number
}

export interface QuizAttemptRow {
  id: string
  student_name: string
  student_email: string
  answers: number[]
  score: number
  total: number
  completed_at: string
}

/**
 * Admin view of who took a quiz — each student's score, and an expandable
 * per-question breakdown of exactly what they answered vs. the correct answer.
 */
export default function QuizResults({
  questions,
  attempts,
  totalStudents,
}: {
  questions: ResultQuestion[]
  attempts: QuizAttemptRow[]
  totalStudents: number
}) {
  const [open, setOpen] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No students have attempted this quiz yet.
        </CardContent>
      </Card>
    )
  }

  const pctOf = (a: QuizAttemptRow) =>
    a.total > 0 ? Math.round((a.score / a.total) * 100) : 0
  const avg = Math.round(
    attempts.reduce((sum, a) => sum + pctOf(a), 0) / attempts.length
  )
  const best = Math.max(...attempts.map(pctOf))
  const sorted = [...attempts].sort((a, b) => pctOf(b) - pctOf(a))

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Attempts" value={`${attempts.length}/${totalStudents}`} />
        <Stat label="Average score" value={`${avg}%`} />
        <Stat label="Highest score" value={`${best}%`} />
      </div>

      {/* Per-student results */}
      <div className="space-y-2">
        {sorted.map((a) => {
          const pct = pctOf(a)
          const isOpen = open.has(a.id)
          return (
            <Card key={a.id}>
              <CardContent className="py-3">
                <button
                  type="button"
                  onClick={() => toggle(a.id)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                        isOpen ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="font-medium block truncate">{a.student_name}</span>
                      <span className="text-xs text-muted-foreground block truncate">
                        {a.student_email} · {formatISTDate(a.completed_at)}
                      </span>
                    </span>
                  </span>
                  <Badge
                    className={`shrink-0 ${
                      pct >= 60 ? 'bg-green-600' : 'bg-destructive'
                    }`}
                  >
                    {a.score}/{a.total} · {pct}%
                  </Badge>
                </button>

                {isOpen && (
                  <div className="mt-3 space-y-3 border-t border-border pt-3">
                    {questions.map((q, qi) => {
                      const picked = a.answers[qi]
                      const correct = picked === q.correct
                      return (
                        <div key={qi} className="space-y-1.5">
                          <p className="text-sm font-medium flex items-start gap-2">
                            {correct ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                            )}
                            {qi + 1}. {q.question}
                          </p>
                          <div className="pl-6 space-y-1">
                            {q.options.map((opt, oi) => {
                              const isAnswerKey = oi === q.correct
                              const isPicked = oi === picked
                              let cls = 'border-border text-muted-foreground'
                              if (isAnswerKey) cls = 'border-green-600 bg-green-600/10 text-foreground'
                              else if (isPicked) cls = 'border-destructive bg-destructive/10 text-foreground'
                              return (
                                <div
                                  key={oi}
                                  className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs ${cls}`}
                                >
                                  <span>{opt}</span>
                                  <span className="flex shrink-0 gap-1">
                                    {isPicked && (
                                      <Badge variant="outline" className="text-[10px]">
                                        Answered
                                      </Badge>
                                    )}
                                    {isAnswerKey && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] text-green-600 border-green-600/50"
                                      >
                                        Correct
                                      </Badge>
                                    )}
                                  </span>
                                </div>
                              )
                            })}
                            {picked === undefined && (
                              <p className="text-xs text-muted-foreground">
                                No answer recorded.
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  )
}
