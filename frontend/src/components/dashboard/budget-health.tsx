'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { useBudgetStatus } from '@/hooks/useAccounts'
import { getCategories } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

// TODO: Use actual current date in production
const MONTH = 3
const YEAR = 2026

export function BudgetHealth() {
  const { data: budgetStatuses, isLoading: loadingBudgets } = useBudgetStatus(MONTH, YEAR)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const categoryMap = new Map(categories?.map((c) => [c.id, c]))

  if (loadingBudgets) {
    return <Card className="animate-pulse h-[360px]"><span /></Card>
  }

  const topBudgets = budgetStatuses?.slice(0, 3) ?? []

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Budget Health</h3>
        <Link
          href="/budgets"
          className="text-sm text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
        >
          View All
        </Link>
      </div>
      {topBudgets.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">
          No budgets set for this month
        </p>
      ) : (
        <div className="space-y-5">
          {topBudgets.map((status) => {
            const category = status.budget.category_id
              ? categoryMap.get(status.budget.category_id)
              : null
            const label = category?.name ?? 'Overall'
            return (
              <div key={status.budget.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {Math.round(status.percentage)}%
                  </span>
                </div>
                <ProgressBar value={status.percentage} />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {formatCurrency(status.spent)} / {formatCurrency(status.budget.amount)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
