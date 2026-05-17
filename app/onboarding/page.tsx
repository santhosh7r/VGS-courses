import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingFlow from '@/components/onboarding-flow'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  if (admin) redirect('/admin')

  const { data: student } = await supabase
    .from('students')
    .select('full_name, avatar_url, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (student?.onboarding_completed) redirect('/dashboard')

  return (
    <OnboardingFlow
      initialName={student?.full_name || ''}
      initialAvatar={student?.avatar_url || ''}
    />
  )
}
