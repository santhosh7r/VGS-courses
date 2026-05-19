'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Zap, Check, X, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'

// Supabase project password policy: 8+ chars with each character class.
const rules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'A number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'A special character (!@#$…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

/**
 * Set-a-password screen.
 *
 * Reached after /auth/callback establishes a session from a secure email
 * link — either a first-time student invite or a password reset. The student
 * chooses their own password here; it is never sent through email.
 */
export default function SetupPasswordPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The secure link must have been opened — confirm a session exists.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user)
      setEmail(data.user?.email ?? null)
      setChecking(false)
    })
  }, [])

  const passwordOk = rules.every((r) => r.test(password))
  const matches = password.length > 0 && password === confirm

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!passwordOk) {
      setError('Your password does not meet all the requirements below.')
      return
    }
    if (!matches) {
      setError('The two passwords do not match.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(
        /session|jwt|token|missing/i.test(updateError.message)
          ? 'Your secure link has expired. Please ask your admin to re-send the invite, or use “Forgot password”.'
          : updateError.message,
      )
      return
    }
    setDone(true)
    // Brief success state, then into the platform.
    setTimeout(() => {
      router.replace('/dashboard')
      router.refresh()
    }, 1100)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-premium">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground">
            100x Hub
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            by Velozity Global Solutions
          </p>
        </div>

        <Card className="shadow-premium">
          <CardContent className="p-6 sm:p-8">
            {checking ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying your secure link…
              </div>
            ) : done ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-600/10 text-green-600">
                  <Check className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">Password set</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Taking you to your dashboard…
                </p>
              </div>
            ) : !hasSession ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <X className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">Link expired</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  This secure link is invalid or has expired. Ask your admin to re-send your
                  invite, or use “Forgot password” on the sign-in page.
                </p>
                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link href="/auth/login">Go to sign in</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Create your password</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {email ? (
                      <>
                        Set a password for{' '}
                        <span className="font-medium text-foreground">{email}</span> to finish
                        setting up your account.
                      </>
                    ) : (
                      'Set a password to finish setting up your account.'
                    )}
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                      Create password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    {password.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {rules.map((rule) => {
                          const ok = rule.test(password)
                          return (
                            <li
                              key={rule.label}
                              className={`flex items-center gap-1.5 text-xs ${
                                ok ? 'text-green-600' : 'text-muted-foreground'
                              }`}
                            >
                              {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              {rule.label}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium">
                      Confirm password
                    </label>
                    <Input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                    {confirm.length > 0 && password !== confirm && (
                      <p className="mt-1.5 text-xs text-destructive">
                        Passwords do not match.
                      </p>
                    )}
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !passwordOk || !matches}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        Set password &amp; continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by Velozity Global Solutions
        </p>
      </div>
    </div>
  )
}
