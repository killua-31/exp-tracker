'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search transactions...' }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localValue, onChange, value])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl bg-white py-2.5 pl-10 pr-4 text-sm',
          'text-slate-900 placeholder:text-slate-400',
          'shadow-card outline-none ring-1 ring-slate-200',
          'focus:ring-2 focus:ring-accent-500',
          'dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:placeholder:text-slate-500',
          'dark:focus:ring-accent-400'
        )}
      />
    </div>
  )
}
