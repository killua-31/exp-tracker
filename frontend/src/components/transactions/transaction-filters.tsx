'use client'

import { cn } from '@/lib/utils'

interface Filters {
  type?: string
  sort: string
}

interface TransactionFiltersProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
}

const typeOptions = [
  { label: 'All', value: '' },
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfer', value: 'transfer' },
]

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Amount \u2191', value: 'amount_asc' },
  { label: 'Amount \u2193', value: 'amount_desc' },
]

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-accent-500 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
      )}
    >
      {label}
    </button>
  )
}

export function TransactionFilters({ filters, onFilterChange }: TransactionFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {typeOptions.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            active={(filters.type || '') === opt.value}
            onClick={() => onFilterChange({ ...filters, type: opt.value || undefined })}
          />
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sortOptions.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            active={filters.sort === opt.value}
            onClick={() => onFilterChange({ ...filters, sort: opt.value })}
          />
        ))}
      </div>
    </div>
  )
}
