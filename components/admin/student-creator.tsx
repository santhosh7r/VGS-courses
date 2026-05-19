'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, MailCheck, Loader2, Copy, Check, TriangleAlert } from 'lucide-react'

interface Course {
  id: string
  title: string
}

interface AddResult {
  email: string
  signupLink: string
  emailSent: boolean
  emailError?: string
}

/**
 * Admin-only "Add Student" form.
 *
 * Posts to /api/admin/students, which adds the email to the signup allowlist
 * and emails the student their signup link. Only allowlisted emails can ever
 * create an account (with Google or a password) — there is no open sign-up.
 */
export default function StudentCreator({ courses }: { courses: Course[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ full_name: '', email: '', course_id: '', batch: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AddResult | null>(null)
  const [copied, setCopied] = useState(false)

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setCopied(false)

    if (!form.full_name.trim() || !form.email.trim()) {
      setError('Full name and email are required.')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Could not add this student.')
        return
      }
      setResult({
        email: data.email ?? form.email,
        signupLink: data.signupLink,
        emailSent: Boolean(data.emailSent),
        emailError: data.emailError,
      })
      setForm({ full_name: '', email: '', course_id: '', batch: '' })
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.signupLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the link is visible to select manually */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Add a Student
        </CardTitle>
        <CardDescription>
          Approves the email and emails the student a signup link. They create their account
          with Google or a password — only approved emails can sign up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sc-name" className="mb-1.5 block text-sm font-medium">
                Full Name
              </label>
              <Input
                id="sc-name"
                value={form.full_name}
                onChange={(e) => set({ full_name: e.target.value })}
                placeholder="Jane Doe"
                required
              />
            </div>
            <div>
              <label htmlFor="sc-email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <Input
                id="sc-email"
                type="email"
                value={form.email}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="jane@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="sc-course" className="mb-1.5 block text-sm font-medium">
                Course
              </label>
              <select
                id="sc-course"
                value={form.course_id}
                onChange={(e) => set({ course_id: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">— Assign later —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sc-batch" className="mb-1.5 block text-sm font-medium">
                Batch
              </label>
              <Input
                id="sc-batch"
                value={form.batch}
                onChange={(e) => set({ batch: e.target.value })}
                placeholder="e.g. 2026 - Spring"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {result && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
              {result.emailSent ? (
                <p className="flex items-center gap-1.5 text-sm text-green-600">
                  <MailCheck className="h-4 w-4" />
                  Signup email sent to {result.email}.
                </p>
              ) : (
                <p className="flex items-start gap-1.5 text-sm text-amber-600">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {result.email} is approved, but the email couldn&apos;t be sent
                    {result.emailError ? ` (${result.emailError})` : ''}. Copy the signup link
                    below and send it to the student.
                  </span>
                </p>
              )}
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background px-2 py-1.5 text-xs text-muted-foreground">
                  {result.signupLink}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={copyLink}>
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy link
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <Button type="submit" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding student…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Add Student &amp; Send Link
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
