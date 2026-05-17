/**
 * Execution Score™ — 100x Hub's signature metric.
 * A 0–100 composite of how consistently a student executes: lesson completion,
 * assignment performance, streak momentum and day-to-day consistency.
 */
export interface ExecutionInputs {
  completionPct: number // 0–100, lessons completed
  assignmentRate: number // 0–1, assignments approved / total
  streak: number // current streak in days
  consistency?: number // 0–100, active-days ratio (optional)
}

const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)))

export function computeExecutionScore(i: ExecutionInputs): number {
  const completion = i.completionPct
  const assignments = i.assignmentRate * 100
  const streakScore = Math.min(i.streak / 14, 1) * 100

  if (i.consistency === undefined) {
    return clamp(completion * 0.45 + assignments * 0.35 + streakScore * 0.2)
  }
  return clamp(
    completion * 0.35 + assignments * 0.3 + streakScore * 0.15 + i.consistency * 0.2,
  )
}

export function executionTier(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Elite Executor', color: '#16a34a' }
  if (score >= 60) return { label: 'Strong Executor', color: '#f97316' }
  if (score >= 40) return { label: 'Building Momentum', color: '#eab308' }
  return { label: 'Getting Started', color: '#9ca3af' }
}
