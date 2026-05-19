import SignUpForm from '@/components/auth/sign-up-form'

/**
 * Student sign-up.
 *
 * Not open registration — an admin must first approve the email (it goes on
 * the allowlist). The admin emails the student a link to this page, with
 * `?email=` pre-filled. Signing up — by Google or email + password — is gated
 * by the handle_new_user database trigger: an un-approved email is rejected.
 */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  return <SignUpForm presetEmail={email ?? ''} />
}
