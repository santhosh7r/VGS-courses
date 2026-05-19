import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * POST /api/admin/students
 *
 * Admin-only. Two steps:
 *  1. Adds the email to the signup allowlist (public.allowed_students).
 *  2. Has Supabase email the student an invite — its built-in "Invite user"
 *     email (a plain signup link; no custom email service).
 *
 * `inviteUserByEmail` creates the auth user; the handle_new_user trigger then
 * checks the allowlist (just populated in step 1) and seeds the student's
 * profile. Only allowlisted emails can ever get an account.
 *
 * Sending the invite is best-effort: if it fails (Supabase's free-tier email
 * rate limit, or a missing service-role key) the student can still sign up at
 * /auth/sign-up with the same allowlisted email — that link is returned so the
 * admin can share it. Adding a student never fails because of email.
 */
export async function POST(request: NextRequest) {
  // ---- 1. Authorise: the caller must be a signed-in admin -------------------
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'You are not signed in.' }, { status: 401 })
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!admin) {
    return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 })
  }

  // ---- 2. Validate input ----------------------------------------------------
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const fullName = String(body.full_name ?? '').trim()
  const email = String(body.email ?? '')
    .trim()
    .toLowerCase()
  const courseId = body.course_id ? String(body.course_id) : null
  const batch = body.batch ? String(body.batch).trim() : null

  if (!fullName) {
    return NextResponse.json({ error: 'Full name is required.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  // ---- 3. Add the email to the allowlist ------------------------------------
  // RLS ("allowed_students admin manages") permits this — the caller is a
  // verified admin. Done BEFORE the invite so the handle_new_user trigger
  // finds the row when inviteUserByEmail creates the auth user.
  const { error: insertError } = await supabase.from('allowed_students').insert({
    email,
    full_name: fullName,
    course_id: courseId,
    batch,
    added_by: user.id,
  })

  if (insertError) {
    // 23505 = unique_violation on the lower(email) index.
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'That email is already on the student list.' },
        { status: 409 },
      )
    }
    console.error('[admin/students] allowlist insert failed:', insertError)
    return NextResponse.json(
      { error: `Could not add this student: ${insertError.message}` },
      { status: 500 },
    )
  }

  // ---- 4. Email the Supabase invite (best-effort) ---------------------------
  const signupLink = `${request.nextUrl.origin}/auth/sign-up?email=${encodeURIComponent(email)}`
  let emailSent = false
  let emailError: string | undefined

  try {
    const service = createServiceClient()
    const { error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, account_type: 'student' },
      redirectTo: `${request.nextUrl.origin}/auth/callback`,
    })
    if (inviteError) {
      emailError = inviteError.message
      console.error('[admin/students] invite email failed:', inviteError)
    } else {
      emailSent = true
    }
  } catch (err) {
    emailError = err instanceof Error ? err.message : 'Invite could not be sent.'
    console.error('[admin/students] invite email failed:', emailError)
  }

  return NextResponse.json({ ok: true, email, signupLink, emailSent, emailError })
}
