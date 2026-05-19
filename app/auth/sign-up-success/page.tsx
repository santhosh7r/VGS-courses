import { redirect } from 'next/navigation'

/** Public sign-up has been removed — see app/auth/sign-up/page.tsx. */
export default function SignUpSuccessPage() {
  redirect('/auth/login')
}
