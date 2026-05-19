import { Flame, Zap } from 'lucide-react'

export interface LeaderboardRow {
  id: string
  full_name: string | null
  xp: number
  streak: number
}

/**
 * Ranked list of students by XP — shared by the student leaderboard page and
 * the admin course view. Pass `currentUserId` to highlight the viewer's row.
 */
export default function LeaderboardTable({
  rows,
  currentUserId,
  emptyMessage = 'No rankings yet.',
}: {
  rows: LeaderboardRow[]
  currentUserId?: string
  emptyMessage?: string
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const isMe = currentUserId != null && r.id === currentUserId
        return (
          <div
            key={r.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              isMe ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0
                    ? 'bg-yellow-500/20 text-yellow-600'
                    : i === 1
                      ? 'bg-slate-400/20 text-slate-500'
                      : i === 2
                        ? 'bg-orange-500/20 text-orange-600'
                        : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </span>
              <span className="font-medium">
                {r.full_name || 'Student'}
                {isMe && <span className="text-primary"> (you)</span>}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-orange-500">
                <Flame className="w-4 h-4" />
                {r.streak}d
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Zap className="w-4 h-4 text-yellow-500" />
                {r.xp} XP
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
