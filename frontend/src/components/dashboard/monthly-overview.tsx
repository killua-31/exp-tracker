'use client'

import { ArrowDownCircle, ArrowUpCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/loading-skeleton'
import { useDashboardSummary } from '@/hooks/useDashboard'
import { formatCurrency } from '@/lib/utils'

export function MonthlyOverview() {
  const { data, isLoading } = useDashboardSummary()

  if (isLoading || !data) {
    return (
      <Card>
        <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 px-4 py-1">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const netPositive = Number(data.monthly_net) >= 0
  const NetIcon = netPositive ? TrendingUp : TrendingDown

  const metrics = [
    {
      label: 'Income',
      value: data.monthly_income,
      icon: ArrowUpCircle,
      colorClass: 'text-income-500',
      bgClass: 'bg-income-100 dark:bg-income-900/40',
    },
    {
      label: 'Expenses',
      value: data.monthly_expenses,
      icon: ArrowDownCircle,
      colorClass: 'text-expense-500',
      bgClass: 'bg-expense-100 dark:bg-expense-900/40',
    },
    {
      label: 'Net',
      value: data.monthly_net,
      icon: NetIcon,
      colorClass: netPositive ? 'text-income-500' : 'text-expense-500',
      bgClass: netPositive
        ? 'bg-income-100 dark:bg-income-900/40'
        : 'bg-expense-100 dark:bg-expense-900/40',
    },
  ]

  return (
    <Card>
      <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex flex-col items-center gap-1 px-4 py-1">
            <div className={`rounded-full p-2 ${metric.bgClass}`}>
              <metric.icon className={`h-5 w-5 ${metric.colorClass}`} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
            <p className={`text-lg font-bold ${metric.colorClass}`}>
              {formatCurrency(metric.value)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
