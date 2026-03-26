'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  className?: string
}

function getBarColor(value: number): string {
  if (value > 100) return 'bg-expense-500'
  if (value >= 75) return 'bg-warning-500'
  return 'bg-income-500'
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clampedWidth = Math.min(value, 100)

  return (
    <div
      className={cn(
        'h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700',
        className
      )}
    >
      <motion.div
        className={cn('h-full rounded-full', getBarColor(value))}
        initial={{ width: 0 }}
        animate={{ width: `${clampedWidth}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}
