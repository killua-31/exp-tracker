'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/loading-skeleton'
import { useCreditCards } from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/utils'

export function CreditCardsStrip() {
  const { data: cards, isLoading } = useCreditCards()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Credit Cards</h2>
        <Link
          href="/credit-cards"
          className="text-sm text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
        >
          View All
        </Link>
      </div>
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
        {isLoading
          ? [0, 1, 2].map((i) => (
              <Card key={i} className="min-w-[200px] shrink-0">
                <Skeleton className="h-4 w-28 mb-3" />
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-1.5 w-full rounded-full" />
                <Skeleton className="h-4 w-20 mt-2" />
              </Card>
            ))
          : cards?.map((card) => {
              const utilization =
                card.credit_limit > 0
                  ? Math.round((card.outstanding_balance / card.credit_limit) * 100)
                  : 0
              return (
                <Card key={card.id} className="min-w-[200px] shrink-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {card.name}
                  </p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>{utilization}% used</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(utilization, 100)}%`,
                          backgroundColor:
                            utilization > 80
                              ? 'var(--color-expense-500)'
                              : utilization > 50
                                ? 'var(--color-warning-500)'
                                : 'var(--color-income-500)',
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2">
                    {formatCurrency(card.outstanding_balance)}
                  </p>
                </Card>
              )
            })}
      </div>
    </div>
  )
}
