'use client'

import { useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

const options = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
]

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

export function ThemeToggle() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  // On mount: load from localStorage and apply
  useEffect(() => {
    const stored = localStorage.getItem('fintrack-theme') as 'light' | 'dark' | 'system' | null
    if (stored) {
      setTheme(stored)
      applyTheme(stored)
    } else {
      applyTheme(theme)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When theme changes, persist and apply
  useEffect(() => {
    localStorage.setItem('fintrack-theme', theme)
    applyTheme(theme)
  }, [theme])

  // Listen for system preference changes when in system mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function listener() {
      if (theme === 'system') applyTheme('system')
    }
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [theme])

  return (
    <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-700">
      {options.map((opt) => {
        const Icon = opt.icon
        const active = theme === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              active
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            )}
            aria-label={opt.label}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
