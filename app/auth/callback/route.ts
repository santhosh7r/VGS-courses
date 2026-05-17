import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth / email-confirmation callback.
 *
 * Supabase redirects here with a `code` that we exchange for a session.
 * On any failure we send the user to /auth/error with a readable message.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  // The provider can report a failure instead of returning a code.
  const providerError =
    searchParams.get('error_description') ?? searchParams.get('error')
  if (providerError) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(providerError)}`,
    )
  }

  // Only honour same-site relative redirects (prevents open-redirect abuse).
  const requestedNext = searchParams.get('next') ?? '/dashboard'
  const next =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(error.message)}`,
    )
  }

  return NextResponse.redirect(
    `${origin}/auth/error?message=${encodeURIComponent('No authentication code was provided.')}`,
  )
}
