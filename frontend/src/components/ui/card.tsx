'use client'

import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  glass?: boolean
  onClick?: () => void
}

export function Card({ children, className, glass, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5 shadow-card',
        glass
          ? 'bg-white/80 backdrop-blur-xl dark:bg-slate-800/80'
          : 'bg-white dark:bg-slate-800',
        onClick && 'cursor-pointer hover:shadow-soft active:scale-[0.99] transition-all duration-150',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      {children}
    </div>
  )
}
