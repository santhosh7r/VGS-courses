'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Zap, MailCheck, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import OAuthButtons from '@/components/auth/oauth-buttons'

/**
 * Student sign-in.
 *
 * Allowlist-gated platform: sign in with Google or email + password, plus a
 * "forgot password" flow. Accounts only exist for emails an admin has approved
 * — see /auth/sign-up.
 */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Set after a reset email is sent — swaps the form for a confirmation notice.
  const [notice, setNotice] = useState<string | null>(null)

  /* ---- Email + password sign-in ----------------------------------------- */
  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    // replace() so Back can never return to the login screen after sign-in.
    router.replace('/dashboard')
    router.refresh()
  }

  /* ---- Forgot password --------------------------------------------------- */
  const sendReset = async () => {
    setError(null)
    if (!email) {
      setError('Enter your email above, then tap “Forgot password?” again.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/setup-password`,
    })
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setNotice(`If ${email} is an approved account, we’ve emailed a password reset link.`)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient brand backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Brand */}
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
            {notice ? (
              <div className="py-4 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                  <MailCheck className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">Check your email</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{notice}</p>
                <Button
                  variant="outline"
                  className="mt-6 w-full"
                  onClick={() => {
                    setNotice(null)
                    setError(null)
                  }}
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-5 text-center">
                  <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Welcome back to your courses.
                  </p>
                </div>

                {/* Invite-only notice */}
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                  Access is restricted to approved students only.
                </div>

                <form onSubmit={signIn} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="password" className="text-sm font-medium">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={sendReset}
                        disabled={loading}
                        className="text-xs text-primary hover:underline disabled:opacity-50"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Please wait…
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-4">
                  <OAuthButtons next="/dashboard" />
                </div>
              </>
            )}

            <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
              Don’t have an account?{' '}
              <span className="font-medium text-foreground">Contact your admin for access.</span>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by Velozity Global Solutions
        </p>
      </div>
    </div>
  )
}
