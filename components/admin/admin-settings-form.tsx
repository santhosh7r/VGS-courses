'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminSettingsForm({
  email,
  fullName,
}: {
  email: string
  fullName: string
}) {
  const supabase = createClient()
  const router = useRouter()

  const [name, setName] = useState(fullName)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingName, setSavingName] = useState(false)

  const [pwd, setPwd] = useState({ next: '', confirm: '' })
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingPwd, setSavingPwd] = useState(false)

  const saveName = async () => {
    setNameMsg(null)
    setSavingName(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSavingName(false)
      return
    }
    const { error } = await supabase
      .from('admins')
      .update({ full_name: name })
      .eq('id', user.id)
    setSavingName(false)
    setNameMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Saved ✓' })
    if (!error) router.refresh()
  }

  const changePassword = async () => {
    setPwdMsg(null)
    if (pwd.next.length < 8) {
      setPwdMsg({ ok: false, text: 'Password must be at least 8 characters.' })
      return
    }
    if (pwd.next !== pwd.confirm) {
      setPwdMsg({ ok: false, text: 'Passwords do not match.' })
      return
    }
    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: pwd.next })
    setSavingPwd(false)
    if (error) {
      setPwdMsg({ ok: false, text: error.message })
      return
    }
    setPwd({ next: '', confirm: '' })
    setPwdMsg({ ok: true, text: 'Password updated ✓' })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Profile</CardTitle>
          <CardDescription>Signed in as {email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Display name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {nameMsg && (
            <p className={`text-sm ${nameMsg.ok ? 'text-green-600' : 'text-destructive'}`}>
              {nameMsg.text}
            </p>
          )}
          <Button onClick={saveName} disabled={savingName}>
            {savingName ? 'Saving…' : 'Save'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your admin password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">New password</label>
            <Input
              type="password"
              value={pwd.next}
              onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Confirm new password</label>
            <Input
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
            />
          </div>
          {pwdMsg && (
            <p className={`text-sm ${pwdMsg.ok ? 'text-green-600' : 'text-destructive'}`}>
              {pwdMsg.text}
            </p>
          )}
          <Button onClick={changePassword} disabled={savingPwd}>
            {savingPwd ? 'Updating…' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
