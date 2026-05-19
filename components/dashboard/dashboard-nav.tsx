'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import ThemeToggle from '@/components/theme-toggle'
import {
  LogOut, LayoutDashboard, BookOpen, CalendarDays, Trophy, Bell, Settings,
  ChevronsLeft, Menu, X, GraduationCap,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/courses', label: 'My Course', icon: BookOpen },
  { href: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, badgeKey: 'unread' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardNav() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    setCollapsed(localStorage.getItem('sb:dash:collapsed') === '1')
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
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
      localStorage.setItem('sb:dash:collapsed', next ? '1' : '0')
      return next
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile top bar — holds the menu button so page content is never
          hidden underneath a floating button. */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card px-3">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-foreground hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="font-bold text-foreground">100x Hub</span>
        </div>
      </header>

      {/* Mobile backdrop */}
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
        {/* Brand */}
        <div className={cn('flex items-center gap-2 px-5 h-16 shrink-0', collapsed && 'md:justify-center md:px-0')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-bold text-sidebar-foreground">100x Hub</p>
              <p className="text-[11px] text-muted-foreground">Student Portal</p>
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

        {/* Nav */}
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

        {/* Footer */}
        <div className="space-y-3 border-t border-sidebar-border p-3">
          <ThemeToggle collapsed={collapsed} />

          {!collapsed && (
            <div className="px-1 text-xs">
              <p className="text-muted-foreground">Signed in as</p>
              <p className="font-medium text-sidebar-foreground truncate">{email}</p>
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

          {/* Collapse toggle — desktop only */}
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
