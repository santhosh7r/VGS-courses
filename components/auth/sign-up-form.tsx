'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Zap, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import OAuthButtons from '@/components/auth/oauth-buttons'

const NOT_APPROVED =
  'This email isn’t approved for 100x Hub yet. Ask your admin to add it, then try again.'

/** Turns raw Supabase signup errors into student-friendly text. */
function friendlyError(raw: string): string {
  if (/EMAIL_NOT_APPROVED|allowlist|Database error saving new user/i.test(raw)) {
    return NOT_APPROVED
  }
  if (/already registered|already exists|user.*exist/i.test(raw)) {
    return 'An account already exists for this email — try signing in instead.'
  }
  return raw
}

/**
 * Sign-up form — email + password, plus "Continue with Google".
 *
 * Either path hits the same allowlist gate in the database, so an un-approved
 * email can never create an account regardless of the method used.
 */
export default function SignUpForm({ presetEmail }: { presetEmail: string }) {
  const router = useRouter()
  const [email, setEmail] = useState(presetEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Enter your email and a password.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setLoading(false)
      setError(friendlyError(signUpError.message))
      return
    }
    // Accounts are auto-confirmed, so signUp returns a live session — go
    // straight to the dashboard. (If somehow there is none, fall back to login.)
    if (data.session) {
      router.replace('/dashboard')
      router.refresh()
      return
    }
    setLoading(false)
    router.replace('/auth/login')
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
            <div className="mb-5 text-center">
              <h2 className="text-xl font-semibold text-foreground">Create your account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up access to your courses.
              </p>
            </div>

            {/* Allowlist notice */}
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              Use the email your admin approved — only approved emails can sign up.
            </div>

            <form onSubmit={signUp} className="space-y-4">
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
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
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
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4">
              <OAuthButtons next="/dashboard" />
            </div>

            <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
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
