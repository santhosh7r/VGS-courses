import { Card, CardContent } from '@/components/ui/card'
import { executionTier } from '@/lib/execution-score'
import { Gauge } from 'lucide-react'

interface Factor {
  label: string
  value: number // 0–100
}

/**
 * Execution Score™ widget — an animated progress ring plus factor breakdown.
 */
export default function ExecutionScore({
  score,
  factors = [],
}: {
  score: number
  factors?: Factor[]
}) {
  const { label, color } = executionTier(score)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <div className="relative h-[140px] w-[140px] shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="12"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums">{score}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              / 100
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Execution Score™</h3>
          </div>
          <p className="mt-0.5 text-sm font-medium" style={{ color }}>
            {label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your consistency across lessons, assignments and streaks.
          </p>

          {factors.length > 0 && (
            <div className="mt-4 space-y-2.5">
              {factors.map((f) => (
                <div key={f.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium tabular-nums">{Math.round(f.value)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(0, f.value))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
