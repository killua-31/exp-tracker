'use client'

import { motion } from 'framer-motion'
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/loading-skeleton'
import { useDashboardSummary } from '@/hooks/useDashboard'
import { formatCurrency } from '@/lib/utils'

export function SummaryCards() {
  const { data, isLoading } = useDashboardSummary()

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Net Worth',
      subtitle: 'Total assets minus credit',
      value: data.net_worth,
      icon: Wallet,
      colorClass: 'text-accent-600 dark:text-accent-400',
      bgClass: 'bg-accent-100 dark:bg-accent-900/40',
    },
    {
      label: 'Monthly Spending',
      subtitle: 'This month',
      value: data.monthly_expenses,
      icon: ArrowDownCircle,
      colorClass: 'text-expense-500',
      bgClass: 'bg-expense-100 dark:bg-expense-900/40',
    },
    {
      label: 'Monthly Income',
      subtitle: 'This month',
      value: data.monthly_income,
      icon: ArrowUpCircle,
      colorClass: 'text-income-500',
      bgClass: 'bg-income-100 dark:bg-income-900/40',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.colorClass}`}>
                  {formatCurrency(card.value)}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{card.subtitle}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.bgClass}`}>
                <card.icon className={`h-5 w-5 ${card.colorClass}`} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
