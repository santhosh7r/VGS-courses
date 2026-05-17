'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command'
import {
  LayoutDashboard, BookOpen, Users, Bell, Plus, Settings, Trophy, GraduationCap,
  ClipboardList, Search,
} from 'lucide-react'

type Role = 'admin' | 'student'

interface SearchRow {
  group: string
  label: string
  sub?: string
  href: string
}

const NAV: Record<Role, { label: string; href: string; icon: any }[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Courses', href: '/admin/courses', icon: BookOpen },
    { label: 'Students', href: '/admin/students', icon: Users },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell },
    { label: 'New Course', href: '/admin/new-course', icon: Plus },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  student: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Course', href: '/dashboard/courses', icon: BookOpen },
    { label: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
    { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
}

/**
 * Global ⌘K / Ctrl+K command palette — instant navigation and search,
 * Linear / Raycast style. Mounted in both the admin and student panels.
 */
export default function CommandPalette({ role }: { role: Role }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<SearchRow[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Lazy-load searchable records the first time the palette opens.
  useEffect(() => {
    if (!open || loaded) return
    const load = async () => {
      const rows: SearchRow[] = []
      if (role === 'admin') {
        const [{ data: courses }, { data: students }] = await Promise.all([
          supabase.from('courses').select('id, title').order('order_index'),
          supabase.from('students').select('id, full_name, email').limit(100),
        ])
        for (const c of courses || [])
          rows.push({ group: 'Courses', label: c.title, href: `/admin/courses/${c.id}` })
        for (const s of students || [])
          rows.push({
            group: 'Students',
            label: s.full_name || 'Unnamed student',
            sub: s.email || '',
            href: `/admin/students/${s.id}`,
          })
      } else {
        const [{ data: lessons }, { data: assignments }] = await Promise.all([
          supabase.from('lessons').select('id, title').limit(100),
          supabase.from('assignments').select('id, title').limit(100),
        ])
        for (const l of lessons || [])
          rows.push({ group: 'Lessons', label: l.title, href: `/dashboard/lessons/${l.id}` })
        for (const a of assignments || [])
          rows.push({
            group: 'Assignments',
            label: a.title,
            href: `/dashboard/assignments/${a.id}`,
          })
      }
      setResults(rows)
      setLoaded(true)
    }
    load()
  }, [open, loaded, role, supabase])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const groups = Array.from(new Set(results.map((r) => r.group)))
  const groupIcon: Record<string, any> = {
    Courses: BookOpen,
    Students: Users,
    Lessons: GraduationCap,
    Assignments: ClipboardList,
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Search and navigate 100x Hub"
    >
      <CommandInput placeholder="Search pages, courses, people…  (⌘K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {NAV[role].map((item) => (
            <CommandItem
              key={item.href}
              value={`go ${item.label}`}
              onSelect={() => go(item.href)}
            >
              <item.icon />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {groups.map((group) => {
          const Icon = groupIcon[group] || Search
          return (
            <CommandGroup key={group} heading={group}>
              {results
                .filter((r) => r.group === group)
                .map((r, i) => (
                  <CommandItem
                    key={r.href + i}
                    value={`${r.label} ${r.sub ?? ''}`}
                    onSelect={() => go(r.href)}
                  >
                    <Icon />
                    <span className="flex-1 truncate">{r.label}</span>
                    {r.sub && (
                      <span className="text-xs text-muted-foreground truncate">{r.sub}</span>
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}
