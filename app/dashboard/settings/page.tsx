import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/dashboard/settings-form'

export const dynamic = 'force-dynamic'

export default async function StudentSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select(
      'full_name, bio, avatar_url, country, timezone, domain, experience_level, goal, weekly_commitment, daily_goal',
    )
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="p-6 md:p-8 animate-fade-rise">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile, productivity and security</p>
      </div>
      <SettingsForm email={user.email || ''} profile={student || {}} />
    </div>
  )
}
