/**
 * Admin and student sessions are stored under SEPARATE cookie namespaces, so
 * signing in to one panel never overwrites the session of the other. The
 * namespace is chosen from the request path.
 */
export const STUDENT_AUTH_COOKIE = 'sb-vgs-student'
export const ADMIN_AUTH_COOKIE = 'sb-vgs-admin'

/** Admin paths use the admin cookie; every other path uses the student cookie. */
export function authCookieName(pathname: string): string {
  const isAdminArea =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  return isAdminArea ? ADMIN_AUTH_COOKIE : STUDENT_AUTH_COOKIE
}
