export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Ban } from 'lucide-react'
import DashboardNav from '@/components/dashboard/dashboard-nav'
import CommandPalette from '@/components/command-palette'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Admins belong in the admin panel, not the student dashboard.
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (admin) {
    redirect('/admin')
  }

  const { data: student } = await supabase
    .from('students')
    .select('status, last_login_at, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  // Suspended students keep their account but lose all access.
  if (student?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md border-destructive/40">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-destructive/10 p-3">
                <Ban className="w-7 h-7 text-destructive" />
              </div>
            </div>
            <CardTitle>Account Suspended</CardTitle>
            <CardDescription>
              Your account has been suspended by an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Please contact your administrator to restore access.
          </CardContent>
        </Card>
      </div>
    )
  }

  // New students must finish onboarding before entering the dashboard.
  if (student && !student.onboarding_completed) {
    redirect('/onboarding')
  }

  // Record one "login" activity per day (powers streaks + login history).
  const today = new Date().toISOString().slice(0, 10)
  if (student && (!student.last_login_at || student.last_login_at.slice(0, 10) < today)) {
    const ua = (await headers()).get('user-agent') || ''
    const device = /mobile|android|iphone|ipad/i.test(ua) ? 'Mobile' : 'Desktop'
    await supabase
      .from('activity_log')
      .insert({ student_id: user.id, type: 'login', detail: { device }, xp_delta: 0 })
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardNav />
      {/* pt-14 on mobile clears the fixed top bar from DashboardNav. */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
      <CommandPalette role="student" />
    </div>
  )
}
