import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Flame, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('course_id, courses (title)')
    .eq('id', user.id)
    .maybeSingle()

  const course: any = student?.courses ?? null
  const { data: rows } = await supabase.rpc('course_leaderboard')
  const leaderboard: any[] = rows || []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-7 h-7 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">
          {course ? `Rankings for ${course.title}` : 'You are not assigned to a course yet'}
        </p>
      </div>

      {leaderboard.length > 0 ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Course Rankings</CardTitle>
            <CardDescription>You compete only with students in your course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((r, i) => {
                const isMe = r.student_id === user.id
                return (
                  <div
                    key={r.student_id}
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
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>No Rankings Yet</CardTitle>
            <CardDescription>
              {course
                ? 'Earn XP by completing lessons and assignments to climb the leaderboard.'
                : 'Once an admin assigns you to a course, the leaderboard will appear here.'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
