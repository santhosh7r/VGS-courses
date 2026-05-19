import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, Flame, Zap, Clock } from 'lucide-react'
import StudentCourseAssigner from '@/components/admin/student-course-assigner'
import StudentCreator from '@/components/admin/student-creator'

export const dynamic = 'force-dynamic'

export default async function AdminStudentsPage() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, email, status, xp, streak, last_active_at, course_id, batch')
    .order('xp', { ascending: false })

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .order('order_index', { ascending: true })

  // Allowlisted emails that have not yet created an account.
  const { data: pending } = await supabase
    .from('allowed_students')
    .select('id, email, full_name, batch, course_id, created_at')
    .is('claimed_at', null)
    .order('created_at', { ascending: false })

  const courseList = courses || []
  const list = students || []
  const pendingList = pending || []
  const activeCount = list.filter((s) => s.status === 'active').length
  const courseTitle = (id: string | null) =>
    courseList.find((c) => c.id === id)?.title ?? null

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Students</h1>
        <p className="text-muted-foreground mt-2">
          {list.length} signed up · {activeCount} active · {pendingList.length} awaiting signup
        </p>
      </div>

      <StudentCreator courses={courseList} />

      {pendingList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Awaiting Signup
            </CardTitle>
            <CardDescription>
              Approved emails that haven&apos;t created an account yet. Each moves to “All
              Students” once they sign up with Google or a password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingList.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-1 rounded-lg border border-dashed border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.full_name || 'Unnamed student'}</p>
                    <p className="text-sm text-muted-foreground truncate">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {courseTitle(p.course_id) && <span>{courseTitle(p.course_id)}</span>}
                    {p.batch && <span>Batch: {p.batch}</span>}
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 uppercase tracking-wide text-amber-600">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {list.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              All Students
            </CardTitle>
            <CardDescription>
              A student can only ever access the course you assign here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {list.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4 border border-border rounded-lg"
                >
                  <div className="min-w-0 lg:w-64">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {student.full_name || 'Unnamed student'}
                      </p>
                      <span
                        className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          student.status === 'suspended'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-green-600/15 text-green-600'
                        }`}
                      >
                        {student.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                    {student.batch && (
                      <p className="text-xs text-muted-foreground">Batch: {student.batch}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1" title="XP">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      {student.xp}
                    </span>
                    <span className="flex items-center gap-1" title="Streak">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {student.streak}d
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <StudentCourseAssigner
                      studentId={student.id}
                      currentCourseId={student.course_id}
                      courses={courseList}
                    />
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/students/${student.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Students Yet</CardTitle>
            <CardDescription>
              Use “Add a Student” above to invite your first student by email.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
