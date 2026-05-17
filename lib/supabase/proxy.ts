import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Runs on every request. Validates the session and — crucially — keeps the
 * auth cookies in sync so users are NOT logged out on refresh.
 *
 * Supabase rotates the refresh token whenever the access token is refreshed.
 * The new cookies must reach the browser on EVERY response, including
 * redirects. Returning a bare NextResponse.redirect() drops them and the
 * browser is left holding a stale (already-rotated) token → forced logout.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // With Fluid compute, don't put this client in a global variable —
  // always create a new one per request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and getUser() — it refreshes
  // the session, and a mistake here causes hard-to-debug random logouts.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  /**
   * Build a redirect that carries over any refreshed auth cookies set during
   * getUser(). This is what keeps the session alive across redirects.
   */
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = ''
    const response = NextResponse.redirect(url)
    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie)
    }
    return response
  }

  // Unauthenticated users may not access the dashboard.
  if (!user && pathname.startsWith('/dashboard')) {
    return redirectTo('/auth/login')
  }

  // Unauthenticated users may not access the admin panel.
  // (/admin/login is public; the role check lives in the admin layout.)
  if (!user && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return redirectTo('/admin/login')
  }

  // Authenticated users should not sit on the auth screens — send them in.
  if (user && (pathname === '/auth/login' || pathname === '/auth/sign-up')) {
    return redirectTo('/dashboard')
  }

  // IMPORTANT: return supabaseResponse unchanged so its cookies are preserved.
  return supabaseResponse
}
