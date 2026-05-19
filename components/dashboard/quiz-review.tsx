import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Check, Zap } from 'lucide-react'

interface ReviewQuestion {
  question: string
  options: string[]
  correct: number
}

/**
 * Post-attempt quiz review — shows every question with the student's chosen
 * answer, the correct answer, and the overall score / XP earned. Rendered only
 * after a quiz has been submitted (the answer key is safe to reveal then).
 */
export default function QuizReview({
  questions,
  answers,
  score,
  total,
  xpReward,
}: {
  questions: ReviewQuestion[]
  answers: number[]
  score: number
  total: number
  xpReward?: number
}) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const earnedXp =
    xpReward != null && total > 0 ? Math.round((xpReward * score) / total) : null
  const passed = pct >= 60

  return (
    <div className="space-y-6">
      {/* Score summary */}
      <Card className={passed ? 'border-green-600/50' : 'border-destructive/40'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {passed ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
            Your Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <p className="text-4xl font-bold">
                {score}
                <span className="text-2xl text-muted-foreground"> / {total}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Correct answers</p>
            </div>
            <div>
              <p className={`text-4xl font-bold ${passed ? 'text-green-600' : 'text-destructive'}`}>
                {pct}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Score</p>
            </div>
            {earnedXp != null && (
              <div>
                <p className="text-4xl font-bold flex items-center gap-1 text-yellow-600">
                  <Zap className="w-7 h-7 text-yellow-500" />
                  {earnedXp}
                </p>
                <p className="text-xs text-muted-foreground mt-1">XP earned</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        {questions.map((q, qi) => {
          const picked = answers[qi]
          const isCorrect = picked === q.correct
          return (
            <Card
              key={qi}
              className={isCorrect ? 'border-green-600/40' : 'border-destructive/40'}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <CardTitle className="text-base font-semibold">
                  {qi + 1}. {q.question}
                </CardTitle>
                <Badge
                  variant={isCorrect ? 'default' : 'destructive'}
                  className={isCorrect ? 'bg-green-600' : ''}
                >
                  {isCorrect ? (
                    <>
                      <Check className="w-3 h-3" /> Correct
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> Incorrect
                    </>
                  )}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isAnswerKey = oi === q.correct
                  const isPicked = oi === picked
                  let cls = 'border-border'
                  if (isAnswerKey) cls = 'border-green-600 bg-green-600/10'
                  else if (isPicked) cls = 'border-destructive bg-destructive/10'
                  return (
                    <div
                      key={oi}
                      className={`flex items-center justify-between gap-3 p-3 border rounded-lg text-sm ${cls}`}
                    >
                      <span className="flex items-center gap-2">
                        {isAnswerKey ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        ) : isPicked ? (
                          <XCircle className="w-4 h-4 text-destructive shrink-0" />
                        ) : (
                          <span className="w-4 h-4 shrink-0" />
                        )}
                        <span>{opt}</span>
                      </span>
                      <span className="flex shrink-0 gap-2">
                        {isPicked && (
                          <Badge variant="outline" className="text-xs">
                            Your answer
                          </Badge>
                        )}
                        {isAnswerKey && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600/50">
                            Correct answer
                          </Badge>
                        )}
                      </span>
                    </div>
                  )
                })}
                {picked === undefined && (
                  <p className="text-xs text-muted-foreground">No answer recorded.</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
