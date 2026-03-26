'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Transaction, Category } from '@/types'
import { formatCurrency, getRelativeDate, cn } from '@/lib/utils'

interface TransactionRowProps {
  transaction: Transaction
  categories: Category[]
}

export function TransactionRow({ transaction, categories }: TransactionRowProps) {
  const category = categories.find((c) => c.id === transaction.category_id)
  const categoryColor = category?.color || '#94a3b8'

  const displayName = transaction.merchant || category?.name || 'Uncategorized'
  const dateLabel = getRelativeDate(transaction.date)

  const amountColor = {
    expense: 'text-expense-500',
    income: 'text-income-500',
    transfer: 'text-blue-500',
    card_payment: 'text-purple-500',
  }[transaction.type]

  const amountPrefix = {
    expense: '\u2212',
    income: '+',
    transfer: '',
    card_payment: '\u2212',
  }[transaction.type]

  const sourceLabel =
    transaction.source_type === 'credit_card' ? 'Credit Card' : 'Account'

  return (
    <Link href={`/transactions/${transaction.id}/edit`}>
      <motion.div
        layout
        className={cn(
          'flex items-center gap-3 rounded-xl px-4 py-3',
          'bg-white shadow-card dark:bg-slate-800',
          'hover:shadow-soft active:scale-[0.99] transition-all duration-150 cursor-pointer'
        )}
      >
        {/* Category color dot */}
        <div
          className="h-4 w-4 shrink-0 rounded-full"
          style={{ backgroundColor: categoryColor }}
        />

        {/* Middle: name + date */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {displayName}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{dateLabel}</p>
        </div>

        {/* Right: amount + source */}
        <div className="shrink-0 text-right">
          <p className={cn('text-sm font-semibold', amountColor)}>
            {amountPrefix}
            {formatCurrency(transaction.amount, transaction.currency)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{sourceLabel}</p>
        </div>
      </motion.div>
    </Link>
  )
}
