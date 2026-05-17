'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

/**
 * Light/dark theme toggle. Defaults to the system theme; the user's choice is
 * persisted by next-themes in localStorage.
 */
export default function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent ${
        collapsed ? 'justify-center' : 'w-full justify-start'
      }`}
    >
      {mounted && isDark ? (
        <Sun className="h-[18px] w-[18px] shrink-0" />
      ) : (
        <Moon className="h-[18px] w-[18px] shrink-0" />
      )}
      {!collapsed && <span>{mounted && isDark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  )
}
