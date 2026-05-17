'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError || !data.user) {
        setError(signInError?.message ?? 'Sign in failed.')
        return
      }

      // The admins table IS the admin allow-list. If there's no row here for
      // this account, it is not an admin — revoke the session immediately.
      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!admin) {
        await supabase.auth.signOut()
        setError('This account does not have admin access.')
        return
      }

      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-primary/10 p-3">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
          </div>
          <CardTitle>100x Hub · Admin Portal</CardTitle>
          <CardDescription>Restricted access — authorized staff only</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium mb-1 block">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium mb-1 block">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Sign In to Admin'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Not an admin?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Go to student login
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Powered by Velozity Global Solutions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
