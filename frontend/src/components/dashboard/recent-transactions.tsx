'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { getTransactions, getCategories } from '@/lib/api'
import { formatCurrency, getRelativeDate } from '@/lib/utils'

export function RecentTransactions() {
  const { data: transactions, isLoading: loadingTxns } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => getTransactions({ limit: '8', sort: 'newest' }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const categoryMap = new Map(categories?.map((c) => [c.id, c]))

  if (loadingTxns) {
    return <Card className="animate-pulse h-[360px]"><span /></Card>
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Recent Transactions
        </h3>
        <Link
          href="/transactions"
          className="text-sm text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
        >
          View All
        </Link>
      </div>
      {!transactions || transactions.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">
          No transactions yet
        </p>
      ) : (
        <div className="space-y-3">
          {transactions.map((txn) => {
            const category = txn.category_id ? categoryMap.get(txn.category_id) : null
            const isExpense = txn.type === 'expense' || txn.type === 'card_payment'
            return (
              <div key={txn.id} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: category?.color ?? '#94a3b8' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {txn.merchant || category?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {getRelativeDate(txn.date)}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold shrink-0 ${
                    isExpense ? 'text-expense-500' : 'text-income-500'
                  }`}
                >
                  {isExpense ? '-' : '+'}
                  {formatCurrency(txn.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
