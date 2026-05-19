import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — SERVER ONLY.
 *
 * Uses the secret `service_role` key, which bypasses Row Level Security and
 * unlocks the privileged `auth.admin.*` API (e.g. `inviteUserByEmail`). This
 * is what powers admin-controlled student onboarding.
 *
 * IMPORTANT: only import this from server code (Route Handlers, Server
 * Actions). `SUPABASE_SERVICE_ROLE_KEY` has no NEXT_PUBLIC_ prefix, so it is
 * never bundled for the browser — the key must never reach the client.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env — see the ' +
        'comment there for where to find it in the Supabase dashboard.',
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
