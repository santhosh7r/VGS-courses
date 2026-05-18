import { createBrowserClient } from '@supabase/ssr'
import { authCookieName } from './cookie-names'

/**
 * Browser Supabase client.
 *
 * The auth cookie namespace is derived from the current path, so the admin
 * panel and the student app keep completely independent sessions in the same
 * browser — logging into one never signs the other out.
 */
export function createClient() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { name: authCookieName(pathname) } },
  )
}
