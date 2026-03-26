'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { BudgetStatus } from '@/types'

interface BudgetOverviewProps {
  budgetStatus: BudgetStatus[]
}

function getRingColor(percentage: number): string {
  if (percentage > 100) return '#f43f5e' // expense-500
  if (percentage >= 75) return '#f59e0b' // warning-500
  return '#10b981' // income-500
}

function getRingTrackColor(): string {
  return '#e2e8f0' // slate-200
}

export function BudgetOverview({ budgetStatus }: BudgetOverviewProps) {
  const overall = budgetStatus.find((s) => s.budget.category_id === null)

  if (!overall) {
    return (
      <Card className="flex flex-col items-center py-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No overall budget set for this month.
        </p>
      </Card>
    )
  }

  const { spent, budget } = overall
  const budgetAmount = budget.amount
  const percentage = overall.percentage
  const color = getRingColor(percentage)

  // SVG ring parameters
  const size = 160
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedPct = Math.min(percentage, 100)
  const dashOffset = circumference - (clampedPct / 100) * circumference

  return (
    <Card className="flex flex-col items-center gap-4 py-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getRingTrackColor()}
            strokeWidth={strokeWidth}
            className="dark:stroke-slate-700"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(spent)} / {formatCurrency(budgetAmount)}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {percentage > 100
            ? `Over budget by ${formatCurrency(spent - budgetAmount)}`
            : `${formatCurrency(overall.remaining)} remaining`}
        </p>
      </div>
    </Card>
  )
}
