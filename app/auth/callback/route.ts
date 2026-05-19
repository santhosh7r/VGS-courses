import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * Auth callback — the single landing point for every secure email link:
 *
 *  - Student invite     → `?token_hash=...&type=invite`
 *  - Password recovery  → `?token_hash=...&type=recovery` (or `?next=...`)
 *  - Magic link         → `?token_hash=...&type=magiclink`
 *  - PKCE / code flow   → `?code=...`
 *
 * It establishes the session, then routes the user:
 *  - invite / recovery → /auth/setup-password  (choose a password)
 *  - onboarding open   → /onboarding
 *  - otherwise         → /dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  // An un-approved Google sign-up is rejected inside the handle_new_user DB
  // trigger; the provider surfaces that as a generic "Database error saving
  // new user". Translate it (and the raw trigger message) into guidance a
  // student can act on.
  const friendly = (raw: string) =>
    /EMAIL_NOT_APPROVED|allowlist|Database error saving new user/i.test(raw)
      ? 'This email isn’t approved for 100x Hub yet. Ask your admin to add it, then sign in again.'
      : raw

  const toError = (message: string) =>
    NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(friendly(message))}`,
    )

  // The provider can report a failure instead of returning a token.
  const providerError = searchParams.get('error_description') ?? searchParams.get('error')
  if (providerError) return toError(providerError)

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()

  if (code) {
    // OAuth, plus email links delivered through the PKCE / code flow.
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return toError(error.message)
  } else if (tokenHash && type) {
    // Invite, magic-link, recovery and signup links (token_hash flow).
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) return toError(error.message)
  } else {
    return toError('This sign-in link is missing its security token or has expired.')
  }

  // First-time invite and password recovery → set-a-password screen, where
  // the student chooses their own password (never sent through email).
  const next = searchParams.get('next')
  if (type === 'invite' || type === 'recovery' || next === '/auth/setup-password') {
    return NextResponse.redirect(`${origin}/auth/setup-password`)
  }

  // Returning users go to the dashboard; the dashboard layout sends anyone
  // with an unfinished profile to onboarding (and handles admin/suspended).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: student } = await supabase
      .from('students')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()
    if (student && !student.onboarding_completed) {
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
