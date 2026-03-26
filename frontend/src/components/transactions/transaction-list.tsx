'use client'

import { useState, useMemo, useCallback } from 'react'
import { Receipt } from 'lucide-react'
import { useTransactions, useCategories } from '@/hooks/useTransactions'
import { SearchBar } from './search-bar'
import { TransactionFilters } from './transaction-filters'
import { TransactionRow } from './transaction-row'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/loading-skeleton'
import type { Transaction } from '@/types'

function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  if (d >= today) return 'Today'
  if (d >= yesterday) return 'Yesterday'
  if (d >= weekAgo) return 'This Week'
  return 'Earlier'
}

function groupTransactions(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {}
  const order = ['Today', 'Yesterday', 'This Week', 'Earlier']

  for (const tx of transactions) {
    const group = getDateGroup(tx.date)
    if (!groups[group]) groups[group] = []
    groups[group].push(tx)
  }

  // Return in order
  const ordered: Record<string, Transaction[]> = {}
  for (const key of order) {
    if (groups[key]) ordered[key] = groups[key]
  }
  return ordered
}

export function TransactionList() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<{ type?: string; sort: string }>({
    sort: 'newest',
  })

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (filters.type) params.type = filters.type
    if (filters.sort) params.sort = filters.sort
    return params
  }, [search, filters])

  const { data: transactions, isLoading } = useTransactions(queryParams)
  const { data: categories } = useCategories()

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const grouped = useMemo(() => {
    if (!transactions) return {}
    return groupTransactions(transactions)
  }, [transactions])

  const hasTransactions = transactions && transactions.length > 0

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Transactions
      </h1>

      <SearchBar value={search} onChange={handleSearchChange} />
      <TransactionFilters filters={filters} onFilterChange={setFilters} />

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-card dark:bg-slate-800">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="space-y-1.5 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-3 w-14 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !hasTransactions && (
        <EmptyState
          icon={Receipt}
          title="No transactions"
          description={
            search || filters.type
              ? 'No transactions match your filters. Try adjusting your search or filters.'
              : 'Add your first transaction to start tracking your finances.'
          }
        />
      )}

      {!isLoading && hasTransactions && (
        <div className="space-y-5">
          {Object.entries(grouped).map(([group, txs]) => (
            <div key={group} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group}
              </h2>
              <div className="space-y-2">
                {txs.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    categories={categories || []}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
