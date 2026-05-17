import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, Flame, Zap } from 'lucide-react'
import StudentCourseAssigner from '@/components/admin/student-course-assigner'

export const dynamic = 'force-dynamic'

export default async function AdminStudentsPage() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, email, status, xp, streak, last_active_at, course_id')
    .order('xp', { ascending: false })

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .order('order_index', { ascending: true })

  const courseList = courses || []
  const list = students || []
  const activeCount = list.filter(s => s.status === 'active').length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Students</h1>
        <p className="text-muted-foreground mt-2">
          {list.length} total · {activeCount} active · assign each student to one course
        </p>
      </div>

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
              Students appear here after they register at the student sign-up page.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
