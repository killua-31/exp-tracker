'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { ProgressBar } from '@/components/ui/progress-bar'
import { formatCurrency } from '@/lib/utils'
import type { BudgetStatus, Category } from '@/types'

interface BudgetCategoryRowProps {
  status: BudgetStatus
  categories: Category[]
  onEdit: () => void
  onDelete: () => void
}

export function BudgetCategoryRow({ status, categories, onEdit, onDelete }: BudgetCategoryRowProps) {
  const category = categories.find((c) => c.id === status.budget.category_id)
  const spent = Number(status.spent)
  const remaining = Number(status.remaining)
  const percentage = Number(status.percentage)
  const budgetAmount = Number(status.budget.amount)
  const isOver = percentage > 100

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800">
      {/* Color dot + name */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: category?.color ?? '#94a3b8' }}
          />
          <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {category?.name ?? 'Unknown'}
          </span>
        </div>

        <ProgressBar value={percentage} />

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {formatCurrency(spent)} / {formatCurrency(budgetAmount)}
          </span>
          <span
            className={
              isOver
                ? 'font-medium text-expense-500'
                : 'text-slate-500 dark:text-slate-400'
            }
          >
            {isOver
              ? `${formatCurrency(Math.abs(remaining))} over`
              : `${formatCurrency(remaining)} left`}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          aria-label="Edit budget"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-expense-50 hover:text-expense-500 dark:hover:bg-expense-950 dark:hover:text-expense-400"
          aria-label="Delete budget"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
