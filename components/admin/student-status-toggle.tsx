'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Ban, CheckCircle2 } from 'lucide-react'

/**
 * Suspend / activate a student. A suspended student keeps their account but
 * loses ALL course access (enforced in the database by my_course_id()).
 */
export default function StudentStatusToggle({
  studentId,
  status,
}: {
  studentId: string
  status: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const suspended = status === 'suspended'

  const toggle = async () => {
    const next = suspended ? 'active' : 'suspended'
    if (
      !suspended &&
      !confirm('Suspend this student? They will immediately lose access to their course.')
    ) {
      return
    }
    setBusy(true)
    const { error } = await supabase
      .from('students')
      .update({ status: next })
      .eq('id', studentId)
    setBusy(false)
    if (!error) router.refresh()
  }

  return (
    <Button
      variant={suspended ? 'default' : 'destructive'}
      size="sm"
      onClick={toggle}
      disabled={busy}
    >
      {suspended ? (
        <>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {busy ? 'Activating…' : 'Activate Student'}
        </>
      ) : (
        <>
          <Ban className="w-4 h-4 mr-2" />
          {busy ? 'Suspending…' : 'Suspend Student'}
        </>
      )}
    </Button>
  )
}
