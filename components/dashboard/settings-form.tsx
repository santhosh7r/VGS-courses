'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import AvatarPicker from '@/components/avatar-picker'

const DOMAINS = ['AI', 'Web Development', 'Data Science', 'Automation', 'Marketing', 'Design']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

interface Profile {
  full_name?: string
  bio?: string | null
  avatar_url?: string | null
  country?: string | null
  timezone?: string | null
  domain?: string | null
  experience_level?: string | null
  daily_goal?: number
}

export default function SettingsForm({
  email,
  profile,
}: {
  email: string
  profile: Profile
}) {
  const supabase = createClient()
  const router = useRouter()

  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    bio: profile.bio ?? '',
    avatar_url: profile.avatar_url ?? '',
    country: profile.country ?? '',
    timezone: profile.timezone ?? '',
    domain: profile.domain ?? '',
    experience_level: profile.experience_level ?? '',
    daily_goal: String(profile.daily_goal ?? 30),
  })
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [pwd, setPwd] = useState({ next: '', confirm: '' })
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingPwd, setSavingPwd] = useState(false)

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const saveProfile = async () => {
    setProfileMsg(null)
    setSavingProfile(true)
    const { error } = await supabase.rpc('update_my_profile', {
      p: { ...form, daily_goal: parseInt(form.daily_goal) || 30 },
    })
    setSavingProfile(false)
    setProfileMsg(
      error ? { ok: false, text: error.message } : { ok: true, text: 'Saved ✓' },
    )
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
    <Tabs defaultValue="profile" className="max-w-2xl space-y-6">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="productivity">Productivity</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>How you appear across 100x Hub</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <AvatarPicker
              value={form.avatar_url}
              name={form.full_name}
              onChange={(url) => set({ avatar_url: url })}
            />
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full name</label>
              <Input value={form.full_name} onChange={(e) => set({ full_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Bio</label>
              <Textarea
                value={form.bio}
                onChange={(e) => set({ bio: e.target.value })}
                className="min-h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Country</label>
                <Input value={form.country} onChange={(e) => set({ country: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Time zone</label>
                <Input value={form.timezone} onChange={(e) => set({ timezone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Domain</label>
                <select
                  value={form.domain}
                  onChange={(e) => set({ domain: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">—</option>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Experience</label>
                <select
                  value={form.experience_level}
                  onChange={(e) => set({ experience_level: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">—</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {profileMsg && (
              <p className={`text-sm ${profileMsg.ok ? 'text-green-600' : 'text-destructive'}`}>
                {profileMsg.text}
              </p>
            )}
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="productivity">
        <Card>
          <CardHeader>
            <CardTitle>Productivity</CardTitle>
            <CardDescription>Your daily learning target</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="max-w-xs">
              <label className="text-sm font-medium mb-1.5 block">
                Daily study goal (minutes)
              </label>
              <Input
                type="number"
                min="5"
                max="600"
                value={form.daily_goal}
                onChange={(e) => set({ daily_goal: e.target.value })}
              />
            </div>
            {profileMsg && (
              <p className={`text-sm ${profileMsg.ok ? 'text-green-600' : 'text-destructive'}`}>
                {profileMsg.text}
              </p>
            )}
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Signed in as {email}</CardDescription>
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
      </TabsContent>
    </Tabs>
  )
}
