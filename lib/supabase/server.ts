import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { authCookieName } from './cookie-names'

/**
 * Server Supabase client.
 *
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 *
 * The proxy forwards the request path as the `x-pathname` header; it decides
 * whether this request belongs to the admin session or the student session,
 * which are kept in separate cookies.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const pathname = (await headers()).get('x-pathname') ?? ''

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: authCookieName(pathname) },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  )
}
