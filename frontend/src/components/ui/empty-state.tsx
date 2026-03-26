'use client'

import type { LucideIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
        <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mb-6 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
