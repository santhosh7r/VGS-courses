'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import ThemeToggle from '@/components/theme-toggle'
import {
  LogOut, LayoutDashboard, BookOpen, Users, Bell, Plus, Settings, ChevronsLeft, Menu, X, ShieldCheck,
} from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell, badgeKey: 'unread' },
  { href: '/admin/new-course', label: 'New Course', icon: Plus },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminNav({ email, name }: { email?: string; name: string }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    setCollapsed(localStorage.getItem('sb:admin:collapsed') === '1')
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)
      setUnread(count || 0)
    }
    load()
  }, [supabase])

  useEffect(() => setMobileOpen(false), [pathname])

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('sb:admin:collapsed', next ? '1' : '0')
      return next
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <TooltipProvider delayDuration={0}>
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed top-4 left-4 z-30 rounded-lg border border-border bg-card p-2 shadow-premium"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
          'fixed inset-y-0 left-0 md:static',
          'w-64',
          collapsed ? 'md:w-[76px]' : 'md:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className={cn('flex items-center gap-2 px-5 h-16 shrink-0', collapsed && 'md:justify-center md:px-0')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-bold text-sidebar-foreground">100x Hub</p>
              <p className="text-[11px] text-muted-foreground">Admin Panel</p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden ml-auto rounded-lg p-1.5 hover:bg-sidebar-accent"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact)
            const showBadge = item.badgeKey === 'unread' && unread > 0
            const link = (
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  collapsed && 'md:justify-center md:px-0',
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && showBadge && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {unread}
                  </span>
                )}
                {collapsed && showBadge && (
                  <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-primary" />
                )}
              </Link>
            )
            return (
              <div key={item.href} className="relative">
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </div>
            )
          })}
        </nav>

        <div className="space-y-3 border-t border-sidebar-border p-3">
          <ThemeToggle collapsed={collapsed} />

          {!collapsed && (
            <div className="px-1 text-xs">
              <p className="font-medium text-sidebar-foreground truncate">{name}</p>
              <p className="text-muted-foreground truncate">{email}</p>
            </div>
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex w-full justify-center rounded-lg border border-sidebar-border p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Sign out
            </button>
          )}

          <button
            onClick={toggleCollapsed}
            className={cn(
              'hidden md:flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent',
              collapsed && 'justify-center px-0',
            )}
          >
            <ChevronsLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
