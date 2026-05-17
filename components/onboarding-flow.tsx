'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import AvatarPicker from '@/components/avatar-picker'
import { cn } from '@/lib/utils'
import { ArrowRight, ArrowLeft, Check, GraduationCap } from 'lucide-react'

const DOMAINS = ['AI', 'Web Development', 'Data Science', 'Automation', 'Marketing', 'Design']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const GOALS = ['Get a job', 'Build a startup', 'Freelancing', 'Skill growth', 'Career switch']
const COMMITMENTS = ['5 hrs / week', '10 hrs / week', '20 hrs / week', '30+ hrs / week']

export default function OnboardingFlow({
  initialName,
  initialAvatar,
}: {
  initialName: string
  initialAvatar: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [autosaved, setAutosaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: initialName,
    avatar_url: initialAvatar,
    bio: '',
    country: '',
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
    domain: '',
    experience_level: '',
    goal: '',
    weekly_commitment: '',
  })

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  // Trap the browser Back button INSIDE onboarding — it steps backwards
  // through the flow instead of escaping to the login/signup pages.
  useEffect(() => {
    window.history.pushState(null, '')
    const onPop = () => {
      setStep((s) => {
        window.history.pushState(null, '')
        return Math.max(0, s - 1)
      })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const steps = [
    { title: 'Welcome to 100x Hub', subtitle: 'Let’s set up your profile.', valid: form.full_name.trim().length > 1 },
    { title: 'Your learning focus', subtitle: 'This personalises your experience.', valid: !!form.domain && !!form.experience_level },
    { title: 'Your goals', subtitle: 'What are you working towards?', valid: !!form.goal && !!form.weekly_commitment },
  ]
  const current = steps[step]
  const pct = Math.round(((step + 1) / steps.length) * 100)

  // Autosave progress (without completing onboarding) as the user advances.
  const autosave = async () => {
    await supabase.rpc('update_my_profile', { p: form })
    setAutosaved(true)
    setTimeout(() => setAutosaved(false), 2000)
  }

  const next = async () => {
    autosave()
    setStep((s) => s + 1)
  }

  const finish = async () => {
    setError(null)
    setSaving(true)
    const { error: rpcError } = await supabase.rpc('update_my_profile', {
      p: { ...form, onboarding_completed: true },
    })
    setSaving(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">100x Hub</span>
          <span className="ml-auto text-xs text-muted-foreground">
            Step {step + 1} of {steps.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-premium">
          <div key={step} className="animate-fade-rise">
            <h1 className="font-display text-3xl font-bold">{current.title}</h1>
            <p className="text-muted-foreground mt-1">{current.subtitle}</p>

            <div className="mt-8 space-y-6">
              {step === 0 && (
                <>
                  <AvatarPicker
                    value={form.avatar_url}
                    name={form.full_name}
                    onChange={(url) => set({ avatar_url: url })}
                  />
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Full name</label>
                    <Input
                      value={form.full_name}
                      onChange={(e) => set({ full_name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Short bio</label>
                    <Textarea
                      value={form.bio}
                      onChange={(e) => set({ bio: e.target.value })}
                      placeholder="A sentence about you and what you want to build."
                      className="min-h-20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Country</label>
                      <Input
                        value={form.country}
                        onChange={(e) => set({ country: e.target.value })}
                        placeholder="India"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Time zone</label>
                      <Input
                        value={form.timezone}
                        onChange={(e) => set({ timezone: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Domain of interest</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {DOMAINS.map((d) => (
                        <Choice key={d} label={d} active={form.domain === d} onClick={() => set({ domain: d })} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Experience level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {LEVELS.map((l) => (
                        <Choice
                          key={l}
                          label={l}
                          active={form.experience_level === l}
                          onClick={() => set({ experience_level: l })}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Primary goal</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {GOALS.map((g) => (
                        <Choice key={g} label={g} active={form.goal === g} onClick={() => set({ goal: g })} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Weekly commitment</label>
                    <div className="grid grid-cols-2 gap-2">
                      {COMMITMENTS.map((c) => (
                        <Choice
                          key={c}
                          label={c}
                          active={form.weekly_commitment === c}
                          onClick={() => set({ weekly_commitment: c })}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || saving}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <span className="text-xs text-green-600">{autosaved ? 'Progress saved' : ''}</span>
            {step < steps.length - 1 ? (
              <Button onClick={next} disabled={!current.valid}>
                Continue
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={!current.valid || saving}>
                {saving ? 'Finishing…' : 'Enter 100x Hub'}
                <Check className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Choice({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border px-3 py-3 text-sm font-medium transition-all text-left',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border hover:border-primary/40 hover:bg-accent',
      )}
    >
      {label}
    </button>
  )
}
